import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// Simple interface for our club data
interface Club {
  clubName: string;
  image: string;
  manager: string;
  colour: string;
}

interface ClubData {
  clubs: Club[];
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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadClubs();
  }

  loadClubs() {
    this.http.get<ClubData>('assets/mock_club_data.json').subscribe({
      next: (data) => {
        this.clubs = data.clubs;
        this.sortClubs();
        this.filteredClubs = this.clubs;
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
      }
    });
  }

  sortClubs() {
    this.clubs.sort((a, b) => 
      a.clubName.toLowerCase().localeCompare(b.clubName.toLowerCase())
    );
  }

  filterClubs() {
    if (!this.searchText) {
      this.filteredClubs = this.clubs;
      return;
    }

    const searchTerm = this.searchText.toLowerCase();
    this.filteredClubs = this.clubs.filter(club => 
      club.clubName.toLowerCase().includes(searchTerm) ||
      club.manager.toLowerCase().includes(searchTerm)
    );
  }
}
