import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Player } from '../store/models/models/player.interface';
import { ApiService } from '../store/services/api.service';
import { Club } from '../store/models/models/club.interface';
import { PositionPillComponent } from '../components/position-pill/position-pill.component';
import { environment } from '../../environments/environment';
import { PlayerStatsService } from '../store/services/player-stats.service';

@Component({
  selector: 'app-player-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PositionPillComponent],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.css']
})
export class PlayerProfileComponent implements OnInit {
  player: Player | null = null;
  clubLogoMap: { [key: string]: string } = {};
  countryEmojiMap: { [key: string]: string } = {};
  error: string | null = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private playerStatsService: PlayerStatsService
  ) {}

  // Method to get the full image URL
  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/square-default.png';
    }
    
    // If it's already a full URL, return as is
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // If it's a relative path starting with /uploads, prepend the API URL
    if (logoUrl.startsWith('/uploads/')) {
      return `${environment.apiUrl}${logoUrl}`;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }

  ngOnInit(): void {
    this.buildCountryEmojiMap();
    const playerId = this.route.snapshot.paramMap.get('id');
    if (playerId) {
      this.loadPlayerData(playerId);
    } else {
      this.error = 'Player ID not found in URL.';
      this.loading = false;
    }
  }

  buildCountryEmojiMap() {
    const countries = [
      { name: 'USA', emoji: '🇺🇸' }, { name: 'Canada', emoji: '🇨🇦' },
      { name: 'Albania', emoji: '🇦🇱' }, { name: 'Andorra', emoji: '🇦🇩' }, { name: 'Austria', emoji: '🇦🇹' }, 
      { name: 'Belarus', emoji: '🇧🇾' }, { name: 'Belgium', emoji: '🇧🇪' }, { name: 'Bosnia and Herzegovina', emoji: '🇧🇦' },
      { name: 'Bulgaria', emoji: '🇧🇬' }, { name: 'Croatia', emoji: '🇭🇷' }, { name: 'Czechia', emoji: '🇨🇿' },
      { name: 'Denmark', emoji: '🇩🇰' }, { name: 'Estonia', emoji: '🇪🇪' }, { name: 'Finland', emoji: '🇫🇮' },
      { name: 'France', emoji: '🇫🇷' }, { name: 'Germany', emoji: '🇩🇪' }, { name: 'Greece', emoji: '🇬🇷' },
      { name: 'Hungary', emoji: '🇭🇺' }, { name: 'Iceland', emoji: '🇮🇸' }, { name: 'Ireland', 'emoji': '🇮🇪' },
      { name: 'Italy', emoji: '🇮🇹' }, { name: 'Latvia', emoji: '🇱🇻' }, { name: 'Liechtenstein', emoji: '🇱🇮' },
      { name: 'Lithuania', emoji: '🇱🇹' }, { name: 'Luxembourg', emoji: '🇱🇺' }, { name: 'Malta', emoji: '🇲🇹' },
      { name: 'Moldova', emoji: '🇲🇩' }, { name: 'Monaco', emoji: '🇲🇨' }, { name: 'Montenegro', emoji: '🇲🇪' },
      { name: 'Netherlands', emoji: '🇳🇱' }, { name: 'North Macedonia', emoji: '🇲🇰' }, { name: 'Norway', emoji: '🇳🇴' },
      { name: 'Poland', emoji: '🇵🇱' }, { name: 'Portugal', emoji: '🇵🇹' }, { name: 'Romania', emoji: '🇷🇴' },
      { name: 'Russia', emoji: '🇷🇺' }, { name: 'Serbia', emoji: '🇷🇸' }, { name: 'Slovakia', emoji: '🇸🇰' },
      { name: 'Slovenia', emoji: '🇸🇮' }, { name: 'Spain', emoji: '🇪🇸' }, { name: 'Sweden', emoji: '🇸🇪' },
      { name: 'Switzerland', emoji: '🇨🇭' }, { name: 'Ukraine', emoji: '🇺🇦' }, { name: 'United Kingdom', emoji: '🇬🇧' }
    ];
    countries.forEach(c => this.countryEmojiMap[c.name] = c.emoji);
  }

  loadPlayerData(id: string) {
    this.loading = true;
    this.error = null;

    this.apiService.getUser(id).subscribe({
      next: (user: any) => {
        if (!user) {
          this.error = 'Player not found.';
          this.loading = false;
          return;
        }
        
        const profile = user.playerProfile || {};
        this.player = {
          id: user._id,
          discordUsername: user.discordUsername || '',
          position: profile.position || 'C',
          number: profile.number || '',
          psnId: user.platform === 'PS5' ? user.gamertag : '',
          xboxGamertag: user.platform === 'Xbox' ? user.gamertag : '',
          gamertag: user.gamertag || '',
          country: profile.country || '',
          handedness: profile.handedness || 'Left',
          currentClubId: user.currentClubId || '',
          currentClubName: user.currentClubName || '',
          status: profile.status || 'Free Agent',
          stats: {
            playerId: user._id,
            gamesPlayed: 0,
            goals: 0,
            assists: 0,
            points: 0,
            plusMinus: 0,
            pim: 0,
            ppg: 0,
            shg: 0,
            gwg: 0,
            shots: 0,
            shotPct: 0,
            hits: 0,
            takeaways: 0,
            giveaways: 0,
            faceoffPct: 0,
            blockedShots: 0,
            savePercentage: 0,
            goalsAgainst: 0,
            gaa: 0,
            goalsAgainstAverage: 0,
            shutouts: 0,
            wins: 0,
            losses: 0,
            otl: 0
          },
          secondaryPositions: profile.secondaryPositions || [],
          // clubLogo will be loaded next
        };

        // Load actual player statistics from games
        this.playerStatsService.getPlayerStats(user._id, user.gamertag).subscribe({
          next: (playerStats) => {
            console.log('Player stats loaded:', playerStats);
            if (this.player) {
              this.player.stats = playerStats;
            }
          },
          error: (err) => {
            console.error('Error loading player stats:', err);
            // Keep the default stats if there's an error
          }
        });

        // If the user has a club, fetch the club details to get the logo
        if (this.player.currentClubId) {
          this.apiService.getClub(this.player.currentClubId).subscribe({
            next: (club: Club) => {
              if (this.player) {
                this.player.clubLogo = this.getImageUrl(club.logoUrl);
              }
            },
            // It's not critical if the logo fails to load, so we just log the error
            error: (err: any) => console.error('Error loading club logo:', err)
          });
        }
        
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load player data. You may not have permission to view this profile.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  getTeamLogo(team: string): string {
    if (!team) return 'assets/images/square-default.png';
    const teamMap: { [key: string]: string } = {
      'roosters': 'square-iserlohnroosters.png',
      // Add more mappings as needed
    };
    const key = team.replace(/\s+/g, '').toLowerCase();
    if (teamMap[key]) {
      return 'assets/images/' + teamMap[key];
    }
    return 'assets/images/square-' + key + '.png';
  }
}
