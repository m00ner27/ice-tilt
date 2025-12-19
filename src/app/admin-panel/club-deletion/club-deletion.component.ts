import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { ImageUrlService } from '../../shared/services/image-url.service';

interface Club {
  _id?: string;
  name: string;
  logoUrl: string;
  seasons?: any[];
  tournaments?: any[];
}

@Component({
  selector: 'app-club-deletion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './club-deletion.component.html',
  styleUrl: './club-deletion.component.css'
})
export class ClubDeletionComponent implements OnInit {
  clubs: Club[] = [];
  loading = false;
  searchTerm = '';

  constructor(
    private api: ApiService,
    private imageUrlService: ImageUrlService
  ) {}

  ngOnInit() {
    this.loadAllClubs();
  }

  loadAllClubs() {
    this.loading = true;
    this.api.getClubs().subscribe({
      next: (clubs) => {
        this.clubs = clubs || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
        this.loading = false;
      }
    });
  }

  get filteredClubs(): Club[] {
    if (!this.searchTerm.trim()) {
      return this.clubs;
    }
    const term = this.searchTerm.toLowerCase();
    return this.clubs.filter(club => 
      club.name.toLowerCase().includes(term)
    );
  }

  deleteClub(club: Club): void {
    const confirmMessage = `WARNING: This will permanently delete "${club.name}" from the database.\n\n` +
      `This action cannot be undone!\n\n` +
      `Are you absolutely sure you want to delete this club?`;
    
    if (confirm(confirmMessage)) {
      // Double confirmation
      if (confirm(`Final confirmation: Delete "${club.name}" permanently?`)) {
        this.api.deleteClub(club._id!).subscribe({
          next: () => {
            this.clubs = this.clubs.filter(c => c._id !== club._id);
            this.api.invalidateClubsCache();
            alert(`Club "${club.name}" has been permanently deleted.`);
          },
          error: (error) => {
            console.error('Error deleting club:', error);
            alert('Failed to delete club. Please try again.');
          }
        });
      }
    }
  }

  getImageUrl(url: string): string {
    return this.imageUrlService.getImageUrl(url);
  }

  onImageError(event: any): void {
    event.target.src = '/assets/default-club-logo.png';
  }
}

