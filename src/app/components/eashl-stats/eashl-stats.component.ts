import { Component } from '@angular/core';
import { EashlService } from '../../services/eashl.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-eashl-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eashl-stats.component.html'
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