import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Player } from '../store/models/models/player.interface';

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadPlayers();
  }

  loadPlayers() {
    console.log('Loading players...');
    this.http.get<{players: Player[]}>('/assets/data/mock_all_players.json')
      .subscribe({
        next: (data) => {
          console.log('Received data:', data);
          if (data && Array.isArray(data.players)) {
            this.players = data.players;
            this.applyFilters();
          } else {
            console.error('Invalid data format:', data);
            this.error = 'Invalid data format received';
          }
        },
        error: (error: HttpErrorResponse) => {
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
} 