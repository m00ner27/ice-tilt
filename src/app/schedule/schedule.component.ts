import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../store/services/api.service';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
  matches: any[] = [];
  filteredMatches: any[] = [];
  isLoading: boolean = true;
  clubs: any[] = [];
  
  // Filtering/sorting options
  filterTeam: string = '';
  sortCriteria: 'date' | 'homeTeam' | 'awayTeam' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Track unique teams for filter dropdown
  teamOptions: string[] = [];

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.loadClubsAndMatches();
  }

  loadClubsAndMatches(): void {
    this.isLoading = true;
    this.api.getClubs().subscribe(clubs => {
      this.clubs = clubs;
      this.api.getGames().subscribe({
        next: (games) => {
          // Map backend games to schedule format
          this.matches = games.map(game => {
            const homeClub = this.clubs.find(c => c._id === game.homeClubId);
            const awayClub = this.clubs.find(c => c._id === game.awayClubId);
            return {
              id: game._id,
              date: game.date,
              homeTeam: homeClub ? homeClub.name : 'Unknown',
              awayTeam: awayClub ? awayClub.name : 'Unknown',
              homeLogo: homeClub ? homeClub.logoUrl : '',
              awayLogo: awayClub ? awayClub.logoUrl : '',
              homeScore: game.score?.home ?? '',
              awayScore: game.score?.away ?? ''
            };
          });
          this.extractTeamOptions();
          this.applyFiltersAndSort();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading games:', error);
          this.isLoading = false;
        }
      });
    });
  }

  extractTeamOptions(): void {
    const teams = new Set<string>();
    this.matches.forEach(match => {
      teams.add(match.homeTeam);
      teams.add(match.awayTeam);
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

  getTeamLogo(teamName: string): string {
    const club = this.clubs.find(c => c.name === teamName);
    return club && club.logoUrl ? club.logoUrl : 'assets/images/1ithlwords.png';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getMatchResult(match: any, team: string): string {
    const isHome = match.homeTeam === team;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;
    
    if (teamScore > opponentScore) return 'W';
    if (teamScore < opponentScore) return 'L';
    return 'T'; // Tie (though our data doesn't have ties currently)
  }

  getResultClass(match: any, team: string): string {
    const result = this.getMatchResult(match, team);
    if (result === 'W') return 'win';
    if (result === 'L') return 'loss';
    return '';
  }
}
