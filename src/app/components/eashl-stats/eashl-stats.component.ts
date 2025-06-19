import { Component, OnInit } from '@angular/core';
import { EashlService } from '../../services/eashl.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-eashl-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
      <h2>EASHL Stats</h2>
      
      <!-- Club Stats Form -->
      <div class="card mb-4">
        <div class="card-body">
          <h3>Club Statistics</h3>
          <div class="mb-3">
            <label for="clubId" class="form-label">Club ID</label>
            <input type="text" class="form-control" id="clubId" [(ngModel)]="clubId">
          </div>
          <div class="mb-3">
            <label for="platform" class="form-label">Platform</label>
            <select class="form-select" id="platform" [(ngModel)]="platform">
              <option value="common-gen5">PS5 / Xbox Series X|S</option>
              <option value="common-gen4">PS4 / Xbox One</option>
            </select>
          </div>
          <button class="btn btn-primary mt-2" (click)="loadClubStats()">Load Stats</button>

          <!-- Player Stats Table -->
          <div *ngIf="clubStats && clubStats[clubId] && clubStats[clubId].members">
            <h4>Player Stats</h4>
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Goals</th>
                  <th>Assists</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let player of clubStats[clubId].members">
                  <td>{{ player.playername }}</td>
                  <td>{{ player.skg }} </td>
                  <td>{{ player.ska }} </td>
                  <td>{{ (player.skg || 0) + (player.ska || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Error or No Data -->
          <div *ngIf="clubStats && (!clubStats[clubId] || !clubStats[clubId].members)">
            <p>No player stats available for this club.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
    }
    pre {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
    }
  `]
})
export class EashlStatsComponent implements OnInit {
  clubId: string = '';
  platform: string = 'common-gen5';
  clubStats: any = null;
  clubMatches: any = null;

  constructor(private eashlService: EashlService) {}

  ngOnInit(): void {}

  loadClubStats(): void {
    if (this.clubId) {
      // Load club stats
      this.eashlService.getClubStats(this.clubId, this.platform).subscribe({
        next: (stats) => {
          this.clubStats = stats;
        },
        error: (error) => {
          console.error('Failed to load club stats:', error);
          // Handle error (show message to user)
        }
      });

      // Load club matches
      this.eashlService.getClubMatches(this.clubId).subscribe({
        next: (matches) => {
          this.clubMatches = matches;
        },
        error: (error) => {
          console.error('Failed to load club matches:', error);
          // Handle error (show message to user)
        }
      });
    }
  }
} 