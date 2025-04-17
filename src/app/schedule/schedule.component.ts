import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ScheduleService, Match } from '../services/schedule.service';

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

  constructor(private scheduleService: ScheduleService) { }

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
    this.isLoading = true;
    this.scheduleService.getMatches().subscribe({
      next: (data) => {
        this.matches = data;
        this.extractTeamOptions();
        this.applyFiltersAndSort();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.isLoading = false;
      }
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
    return this.scheduleService.getTeamLogo(teamName);
  }

  formatDate(dateString: string): string {
    return this.scheduleService.formatDate(dateString);
  }

  getMatchResult(match: Match, team: string): string {
    const isHome = match.homeTeam === team;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;
    
    if (teamScore > opponentScore) return 'W';
    if (teamScore < opponentScore) return 'L';
    return 'T'; // Tie (though our data doesn't have ties currently)
  }

  getResultClass(match: Match, team: string): string {
    const result = this.getMatchResult(match, team);
    if (result === 'W') return 'win';
    if (result === 'L') return 'loss';
    return '';
  }
}
