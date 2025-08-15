import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Player } from '../store/models/models/player.interface';
import { ApiService } from '../store/services/api.service';

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
  isLoading: boolean = true;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadFreeAgents();
  }

  loadFreeAgents() {
    this.isLoading = true;
    this.apiService.getFreeAgents().subscribe({
      next: (agents) => {
        // This assumes getFreeAgents returns a structure that needs to be mapped to Player
        this.freeAgents = agents.map((agent: any) => {
          const profile = agent.playerProfile || {};
          return {
            id: agent._id,
            discordUsername: agent.discordUsername,
            position: profile.position || 'C',
            status: profile.status || 'Free Agent',
            number: profile.number || '',
            psnId: agent.platform === 'PS5' ? agent.gamertag : '',
            xboxGamertag: agent.platform === 'Xbox' ? agent.gamertag : '',
            gamertag: agent.gamertag || '',
            stats: agent.stats || {},
            handedness: profile.handedness || 'Left',
            country: profile.country || '',
            currentClubId: agent.currentClubId || '',
            currentClubName: agent.currentClubName || '',
            secondaryPositions: profile.secondaryPositions || [],
          };
        });
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading free agents:', err);
        this.error = 'Failed to load free agents.';
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredAgents = this.freeAgents.filter(player => {
      const matchesPosition = this.positionFilter === 'All' || player.position === this.positionFilter;
      const matchesSearch = (player.discordUsername?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                          (player.psnId?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                          (player.xboxGamertag?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false);
      
      return matchesPosition && matchesSearch;
    });
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

  refreshData() {
    this.loadFreeAgents();
  }
}
