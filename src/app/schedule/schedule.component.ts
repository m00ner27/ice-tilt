import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Match, MatchService } from '../store/services/match.service';
import { ApiService } from '../store/services/api.service';
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
  filterSeason: string = '';
  sortCriteria: 'date' | 'homeTeam' | 'awayTeam' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Track unique teams and seasons for filter dropdowns
  teamOptions: string[] = [];
  seasons: any[] = [];
  allClubs: any[] = [];

  constructor(
    private matchService: MatchService,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.loadSchedule();
  }

  loadSchedule(): void {
    this.isLoading = true;
    
    // Load matches, seasons, and clubs
    this.matchService.getMatches().subscribe({
      next: (matches) => {
        this.matches = matches;
        console.log('Loaded matches:', matches.length);
        console.log('Sample match season IDs:', matches.slice(0, 5).map(m => ({
          id: m.id,
          seasonId: m.seasonId,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam
        })));
        this.updateTeamOptions();
        this.applyFiltersAndSort();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.isLoading = false;
      }
    });
    
    // Load seasons
    this.apiService.getSeasons().subscribe({
      next: (seasons) => {
        this.seasons = seasons.sort((a: any, b: any) => {
          const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
          const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
          return dateB - dateA; // Most recent first
        });
        this.updateTeamOptions(); // Update team options when seasons load
      },
      error: (error) => {
        console.error('Error loading seasons:', error);
      }
    });
    
    // Load clubs
    this.apiService.getClubs().subscribe({
      next: (clubs) => {
        this.allClubs = clubs;
        console.log('Loaded clubs:', clubs.length);
        console.log('Sample club seasons:', clubs.slice(0, 3).map(c => ({
          name: c.name,
          seasons: c.seasons?.map((s: any) => ({
            seasonId: s.seasonId,
            divisionIds: s.divisionIds
          }))
        })));
        this.updateTeamOptions(); // Update team options when clubs load
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
      }
    });
  }

  updateTeamOptions(): void {
    if (!this.seasons.length || !this.allClubs.length) {
      return; // Wait for both to load
    }
    
    if (this.filterSeason) {
      // If a season is selected, only show teams that participate in that season
      const seasonTeams = new Set<string>();
      
      this.allClubs.forEach(club => {
        const seasonInfo = club.seasons?.find((s: any) => {
          if (typeof s.seasonId === 'object' && s.seasonId._id) {
            return s.seasonId._id === this.filterSeason;
          } else if (typeof s.seasonId === 'string') {
            return s.seasonId === this.filterSeason;
          }
          return false;
        });
        
        if (seasonInfo) {
          seasonTeams.add(club.name);
        }
      });
      
      this.teamOptions = Array.from(seasonTeams).sort();
    } else {
      // If no season is selected, show all teams that have played games
      const teams = new Set<string>();
      this.matches.forEach(match => {
        if (match.homeTeam) teams.add(match.homeTeam);
        if (match.awayTeam) teams.add(match.awayTeam);
      });
      this.teamOptions = Array.from(teams).sort();
    }
  }

  applyFiltersAndSort(): void {
    // Apply team filter if selected
    let filtered = this.matches.filter(match => {
      if (!this.filterTeam) return true;
      return match.homeTeam === this.filterTeam || match.awayTeam === this.filterTeam;
    });

    // Apply season filter if selected
    filtered = filtered.filter(match => {
      if (!this.filterSeason) return true;
      console.log('Season filter check:', {
        matchId: match.id,
        matchSeasonId: match.seasonId,
        filterSeason: this.filterSeason,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam
      });
      return match.seasonId === this.filterSeason;
    });

    this.filteredMatches = filtered;

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

  onSeasonFilterChange(): void {
    // Clear team filter when season changes to avoid invalid combinations
    this.filterTeam = '';
    this.updateTeamOptions();
    this.applyFiltersAndSort();
  }

  clearAllFilters(): void {
    this.filterTeam = '';
    this.filterSeason = '';
    this.updateTeamOptions();
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
