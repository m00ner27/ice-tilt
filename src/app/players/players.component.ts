import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Player } from '../store/models/models/player.interface';
import { ApiService } from '../store/services/api.service';
import { Club } from '../store/models/models/club.interface';
import { PositionPillComponent } from '../components/position-pill/position-pill.component';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PositionPillComponent
  ],
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.css']
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  filteredPlayers: Player[] = [];
  clubs: Club[] = [];
  clubLogoMap: { [key: string]: string } = {};
  countryEmojiMap: { [key: string]: string } = {};
  statusFilter: 'All' | 'Free Agent' | 'Signed' | 'Pending' = 'All';
  positionFilter: 'All' | 'Forward' | 'Defense' | 'Goalie' = 'All';
  searchTerm: string = '';
  error: string | null = null;
  positionGroupMap: { [key: string]: string } = {
    'C': 'Forward', 'LW': 'Forward', 'RW': 'Forward',
    'LD': 'Defense', 'RD': 'Defense',
    'G': 'Goalie'
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.buildCountryEmojiMap();
    this.loadClubsAndPlayers();
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

  loadClubsAndPlayers() {
    this.apiService.getClubs().subscribe({
      next: (clubs) => {
        this.clubs = clubs;
        clubs.forEach(club => {
          if (club.name && club.logoUrl) {
            this.clubLogoMap[club.name.toLowerCase()] = club.logoUrl;
          }
        });
        this.loadPlayers(); // Load players after clubs are loaded
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
        // still load players even if clubs fail
        this.loadPlayers();
      }
    });
  }

  loadPlayers() {
    this.apiService.getUsers().subscribe({
      next: (users) => {
        // Map backend user structure to Player interface
        this.players = users.map((user: any) => {
          const profile = user.playerProfile || {};
          const clubName = profile.currentClubName || user.currentClubName || '';
          const logo = this.clubLogoMap[clubName.toLowerCase()] || undefined;
          
          return {
            id: user._id || user.id,
            discordUsername: user.discordUsername || '',
            position: profile.position || 'C',
            number: profile.number || '',
            psnId: user.platform === 'PS5' ? user.gamertag : '',
            xboxGamertag: user.platform === 'Xbox' ? user.gamertag : '',
            gamertag: user.gamertag || '',
            country: profile.country || '',
            handedness: profile.handedness || 'Left',
            currentClubId: profile.currentClubId || user.currentClubId || '',
            currentClubName: clubName,
            status: profile.status || 'Free Agent',
            lastActive: user.lastActive || '',
            stats: user.stats || {},
            clubLogo: logo
          };
        });
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading players:', error);
        this.error = `Error loading players data: ${error.message}`;
      }
    });
  }

  applyFilters() {
    this.filteredPlayers = this.players.filter(player => {
      const matchesStatus = this.statusFilter === 'All' || player.status === this.statusFilter;
      
      const positionGroup = this.positionGroupMap[player.position] || 'Unknown';
      const matchesPosition = this.positionFilter === 'All' || positionGroup === this.positionFilter;

      const matchesSearch = (player.discordUsername?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                          (player.psnId?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                          (player.xboxGamertag?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false);
      
      return matchesStatus && matchesPosition && matchesSearch;
    });
  }

  onStatusFilterChange(status: 'All' | 'Free Agent' | 'Signed' | 'Pending') {
    this.statusFilter = status;
    this.applyFilters();
  }

  onPositionFilterChange(position: 'All' | 'Forward' | 'Defense' | 'Goalie') {
    this.positionFilter = position;
    this.applyFilters();
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.applyFilters();
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