import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Match, MatchService } from '../store/services/match.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
  matches: Match[] = [];
  filteredMatches: Match[] = [];
  isLoading: boolean = true;
  
  // Filtering/sorting options
  filterTeam: string = '';
  sortCriteria: 'date' | 'homeTeam' | 'awayTeam' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Track unique teams for filter dropdown
  teamOptions: string[] = [];

  constructor(private matchService: MatchService) { }

  ngOnInit(): void {
    this.loadSchedule();
  }

  loadSchedule(): void {
    this.isLoading = true;
    this.matchService.getMatches().subscribe({
      next: (matches) => {
        this.matches = matches;
        this.extractTeamOptions();
        this.applyFiltersAndSort();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading schedule:', error);
        this.isLoading = false;
      }
    });
  }

  extractTeamOptions(): void {
    const teams = new Set<string>();
    this.matches.forEach(match => {
      if (match.homeTeam) teams.add(match.homeTeam);
      if (match.awayTeam) teams.add(match.awayTeam);
    });
    this.teamOptions = Array.from(teams).sort();
  }

  applyFiltersAndSort(): void {
    // Apply team filter if selected
    this.filteredMatches = this.matches.filter(match => {
      if (!this.filterTeam) return true;
      return match.homeTeam === this.filterTeam || match.awayTeam === this.filterTeam;
    });

    // Apply sorting
    this.filteredMatches.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortCriteria) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'homeTeam':
          comparison = a.homeTeam.localeCompare(b.homeTeam);
          break;
        case 'awayTeam':
          comparison = a.awayTeam.localeCompare(b.awayTeam);
          break;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onSortChange(criteria: 'date' | 'homeTeam' | 'awayTeam'): void {
    if (this.sortCriteria === criteria) {
      // Toggle direction if clicking the same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new criteria and default to descending for date, ascending for others
      this.sortCriteria = criteria;
      this.sortDirection = criteria === 'date' ? 'desc' : 'asc';
    }
    this.applyFiltersAndSort();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getMatchResult(match: Match, team: string): string {
    const isHome = match.homeTeam === team;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;
    
    if (teamScore > opponentScore) return 'W';
    if (teamScore < opponentScore) return 'L';
    return 'T'; // Tie
  }

  getResultClass(match: Match, team: string): string {
    if (!match.eashlData) return '';
    const result = this.getMatchResult(match, team);
    if (result === 'W') return 'win';
    if (result === 'L') return 'loss';
    return '';
  }

  // Method to get the full image URL
  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/1ithlwords.png';
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
