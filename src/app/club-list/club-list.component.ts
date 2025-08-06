import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../store/services/api.service';
import { environment } from '../../environments/environment';

// Updated interface to match backend Club model
interface Club {
  _id?: string;
  name: string;
  logoUrl?: string;
  manager: string;
  primaryColour?: string;
  seasons?: any[];
  roster?: any[];
}

@Component({
  selector: 'app-club-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './club-list.component.html',
  styleUrls: ['./club-list.component.css']
})
export class ClubListComponent implements OnInit {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  searchText: string = '';
  loading: boolean = false;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadClubs();
  }

  loadClubs() {
    this.loading = true;
    this.error = null;
    
    this.apiService.getClubs().subscribe({
      next: (clubs) => {
        this.clubs = clubs;
        this.sortClubs();
        this.filteredClubs = this.clubs;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
        this.error = 'Failed to load clubs. Please try again.';
        this.loading = false;
      }
    });
  }

  sortClubs() {
    this.clubs.sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
  }

  filterClubs() {
    if (!this.searchText) {
      this.filteredClubs = this.clubs;
      return;
    }

    const searchTerm = this.searchText.toLowerCase();
    this.filteredClubs = this.clubs.filter(club => 
      club.name.toLowerCase().includes(searchTerm) ||
      club.manager.toLowerCase().includes(searchTerm)
    );
  }

  // Method to get the full image URL
  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/default-team.png';
    }
    
    // If it's already a full URL, return as is
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // If it's a relative path starting with /uploads, prepend the API URL
    if (logoUrl.startsWith('/uploads/')) {
      return `${environment.apiUrl}${logoUrl}`;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }
}
