import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Player } from '../store/models/models/player.interface';
import { PlayerStats } from '../store/models/models/player-stats.interface';
import { PlayerStatsService } from '../store/services/player-stats.service';
import { ApiService } from '../store/services/api.service';
import { Club } from '../store/models/models/club.interface';
import { PositionPillComponent } from '../components/position-pill/position-pill.component';

@Component({
  selector: 'app-player-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PositionPillComponent],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.css']
})
export class PlayerProfileComponent implements OnInit {
  player: Player | null = null;
  playerStats: PlayerStats | null = null;
  clubLogoMap: { [key: string]: string } = {};
  countryEmojiMap: { [key: string]: string } = {};
  error: string | null = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private playerStatsService: PlayerStatsService
  ) {}

  ngOnInit() {
    this.buildCountryEmojiMap();
    this.apiService.getClubs().subscribe(clubs => {
      clubs.forEach(club => {
        if (club.name && club.logoUrl) {
          this.clubLogoMap[club.name.toLowerCase()] = club.logoUrl;
        }
      });
      // After logos are mapped, get the player ID from the route
      this.route.params.subscribe(params => {
        const playerId = params['id'];
        this.loadPlayerData(playerId);
      });
    });
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

  private loadPlayerData(playerId: string) {
    // Fetch player from backend
    this.apiService.getUsers().subscribe({
      next: (users) => {
        const user = users.find((u: any) => (u._id || u.id) === playerId);
        if (user) {
          const profile = user.playerProfile || {};
          const clubName = user.currentClubName || '';
          this.player = {
            id: user._id || user.id,
            discordUsername: user.discordUsername || '',
            position: profile.position || 'C',
            number: profile.number || '',
            psnId: user.platform === 'PS5' ? user.gamertag : '',
            xboxGamertag: user.platform === 'Xbox' ? user.gamertag : '',
            gamertag: user.gamertag || '',
            country: profile.country || '',
            handedness: profile.handedness || 'Left',
            currentClubId: user.currentClubId || '',
            currentClubName: clubName,
            status: profile.status || 'Free Agent',
            lastActive: user.lastActive || '',
            stats: user.stats || {},
            secondaryPositions: profile.secondaryPositions || [],
            clubLogo: this.clubLogoMap[clubName.toLowerCase()] || undefined
          };
          this.loadPlayerStats(playerId);
        } else {
          this.error = 'Player not found';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading player:', error);
        this.error = 'Error loading player data';
        this.loading = false;
      }
    });
  }

  private loadPlayerStats(playerId: string) {
    // Load real player statistics from matches
    this.playerStatsService.getPlayerStats(playerId).subscribe({
      next: (stats) => {
        this.playerStats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading player stats:', error);
        this.error = 'Error loading player statistics';
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