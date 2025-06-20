import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Player } from '../store/models/models/player.interface';
import { ApiService } from '../store/services/api.service';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.css']
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  filteredPlayers: Player[] = [];
  statusFilter: 'All' | 'Free Agent' | 'Signed' | 'Pending' = 'All';
  positionFilter: 'All' | 'Forward' | 'Defense' | 'Goalie' = 'All';
  searchTerm: string = '';
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadPlayers();
  }

  loadPlayers() {
    console.log('Loading players from backend...');
    this.apiService.getFreeAgents().subscribe({
      next: (users) => {
        // Map backend user structure to Player interface
        this.players = users.map((user: any) => {
          const profile = user.playerProfile || {};
          return {
            id: user._id || user.id,
            name: profile.name || user.name || '',
            position: profile.position || 'Forward',
            number: profile.number || '',
            psnId: profile.psnId || user.psnId || '',
            xboxGamertag: profile.xboxGamertag || user.xboxGamertag || '',
            country: profile.location || '',
            handedness: profile.handedness || 'Left',
            currentClubId: profile.currentClubId || '',
            currentClubName: profile.currentClubName || '',
            status: profile.status || 'Free Agent',
            lastActive: user.lastActive || '',
            stats: user.stats || {},
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
    console.log('Applying filters:', { status: this.statusFilter, position: this.positionFilter, search: this.searchTerm });
    this.filteredPlayers = this.players.filter(player => {
      const matchesStatus = this.statusFilter === 'All' || player.status === this.statusFilter;
      const matchesPosition = this.positionFilter === 'All' || player.position === this.positionFilter;
      const matchesSearch = player.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          (player.psnId?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                          (player.xboxGamertag?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false);
      
      return matchesStatus && matchesPosition && matchesSearch;
    });
    console.log('Filtered players:', this.filteredPlayers);
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