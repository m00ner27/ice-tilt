import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Player } from '../store/models/models/player.interface';

interface PlayerStats {
  playerId: number;
  name: string;
  team: string;
  teamLogo?: string;
  number: number;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
}

@Component({
  selector: 'app-free-agents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './free-agents.component.html',
  styleUrls: ['./free-agents.component.css']
})
export class FreeAgentsComponent implements OnInit {
  freeAgents: Player[] = [];
  filteredAgents: Player[] = [];
  positionFilter: string = 'All';
  searchTerm: string = '';
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadFreeAgents();
  }

  loadFreeAgents() {
    console.log('Loading free agents...');
    this.http.get<{freeAgents: Player[]}>('/assets/data/mock_free_agents.json')
      .subscribe({
        next: (data) => {
          console.log('Received data:', data);
          if (data && Array.isArray(data.freeAgents)) {
            this.freeAgents = data.freeAgents;
            this.filteredAgents = this.freeAgents;
            console.log('Free agents loaded:', this.freeAgents);
            this.applyFilters();
          } else {
            console.error('Invalid data format:', data);
            this.error = 'Invalid data format received';
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading free agents:', error);
          if (error.status === 404) {
            this.error = 'Could not find the mock data file. Path: /assets/data/mock_free_agents.json';
          } else {
            this.error = `Error loading free agents data: ${error.message}`;
          }
        }
      });
  }

  applyFilters() {
    console.log('Applying filters:', { position: this.positionFilter, search: this.searchTerm });
    this.filteredAgents = this.freeAgents.filter(player => {
      const matchesPosition = this.positionFilter === 'All' || player.position === this.positionFilter;
      const matchesSearch = player.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          (player.psnId?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                          (player.xboxGamertag?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false);
      
      return matchesPosition && matchesSearch;
    });
    console.log('Filtered agents:', this.filteredAgents);
  }

  onPositionFilterChange(position: string) {
    this.positionFilter = position;
    this.applyFilters();
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.applyFilters();
  }
}
