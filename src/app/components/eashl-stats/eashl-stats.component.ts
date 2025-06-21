import { Component } from '@angular/core';
import { EashlService } from '../../services/eashl.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-eashl-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
      <h2>EASHL Match History</h2>
      
      <div class="card mb-4">
        <div class="card-body">
          <h3>Fetch Club Matches</h3>
          <div class="mb-3">
            <label for="clubId" class="form-label">Club ID</label>
            <input type="text" class="form-control" id="clubId" [(ngModel)]="clubId" placeholder="Enter EA Club ID">
          </div>
          <button class="btn btn-primary" (click)="loadClubMatches()" [disabled]="isLoading">
            <span *ngIf="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ isLoading ? 'Loading...' : 'Fetch Matches' }}
          </button>

          <div *ngIf="error" class="alert alert-danger mt-3">
            {{ error }}
          </div>

          <div *ngIf="clubMatches" class="mt-4">
            <h4>Recent Matches</h4>
            <pre>{{ clubMatches | json }}</pre>
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
      max-height: 500px;
      overflow-y: auto;
    }
  `]
})
export class EashlStatsComponent {
  clubId: string = '';
  clubMatches: any = null;
  isLoading = false;
  error: string | null = null;

  constructor(private eashlService: EashlService) {}

  loadClubMatches(): void {
    if (this.clubId) {
      this.isLoading = true;
      this.error = null;
      this.clubMatches = null;
      
      this.eashlService.getClubMatches(this.clubId).subscribe({
        next: (matches) => {
          this.clubMatches = matches;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load club matches:', err);
          this.error = 'Failed to load matches. Please check the Club ID and try again.';
          this.isLoading = false;
        }
      });
    }
  }
} 