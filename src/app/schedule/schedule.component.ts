import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ImageUrlService } from '../shared/services/image-url.service';

// Import selectors
import * as MatchesSelectors from '../store/matches.selectors';
import * as ClubsSelectors from '../store/clubs.selectors';
import * as SeasonsSelectors from '../store/seasons.selectors';

// Import interfaces
import { EashlMatch } from '../store/services/match.service';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './schedule.component.html'
})
export class ScheduleComponent implements OnInit, OnDestroy {
  @Input() isPreview: boolean = false;
  
  private destroy$ = new Subject<void>();
  
  // Observable selectors
  matches$: Observable<any[]>;
  clubs$: Observable<any[]>;
  seasons$: Observable<any[]>;
  matchesLoading$: Observable<boolean>;
  matchesError$: Observable<any>;
  
  // Local state for filtering/sorting
  filteredMatches: any[] = [];
  filterTeam: string = '';
  filterSeason: string = '';
  sortCriteria: 'date' | 'homeTeam' | 'awayTeam' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Track unique teams and seasons for filter dropdowns
  teamOptions: string[] = [];
  seasons: any[] = [];
  allClubs: any[] = [];

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private imageUrlService: ImageUrlService
  ) {
    // Initialize selectors
    this.matches$ = this.store.select(MatchesSelectors.selectAllMatches);
    this.clubs$ = this.store.select(ClubsSelectors.selectAllClubs);
    this.seasons$ = this.store.select(SeasonsSelectors.selectAllSeasons);
    this.matchesLoading$ = this.store.select(MatchesSelectors.selectMatchesLoading);
    this.matchesError$ = this.store.select(MatchesSelectors.selectMatchesError);
  }

  ngOnInit(): void {
    // Load data using NgRx
    this.ngrxApiService.loadMatches();
    this.ngrxApiService.loadClubs();
    this.ngrxApiService.loadSeasons();
    
    // Subscribe to data changes
    this.setupDataSubscriptions();
    
    // If in preview mode, set default season to show all matches
    if (this.isPreview) {
      this.filterSeason = '';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDataSubscriptions() {
    // Combine matches, clubs, and seasons to update team options and apply filters
    combineLatest([
      this.matches$,
      this.clubs$,
      this.seasons$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([matches, clubs, seasons]) => {
      this.allClubs = clubs;
      this.seasons = [...seasons].sort((a: any, b: any) => {
        const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
        const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
      
      this.updateTeamOptions();
      this.applyFiltersAndSort();
    });
  }

  loadSchedule(): void {
    this.ngrxApiService.loadMatches();
    this.ngrxApiService.loadClubs();
    this.ngrxApiService.loadSeasons();
  }

  updateTeamOptions(): void {
    if (!this.seasons.length || !this.allClubs.length) {
      this.teamOptions = [];
      return;
    }

    const selectedSeason = this.seasons.find(s => s._id === this.filterSeason);
    if (!selectedSeason) {
      this.teamOptions = [];
      return;
    }

    // Get clubs that are in the selected season
    const clubsInSeason = this.allClubs.filter(club => 
      club.seasons && club.seasons.some((s: any) => {
        const seasonId = typeof s.seasonId === 'object' ? s.seasonId._id : s.seasonId;
        return seasonId === this.filterSeason;
      })
    );

    this.teamOptions = clubsInSeason.map(club => club.name).sort();
  }

  applyFiltersAndSort(): void {
    this.matches$.pipe(takeUntil(this.destroy$)).subscribe((matches: any[]) => {
      let filtered = [...matches];

      // Apply team filter
      if (this.filterTeam) {
        filtered = filtered.filter(match => 
          match.homeTeam === this.filterTeam || match.awayTeam === this.filterTeam
        );
      }

      // Apply season filter
      if (this.filterSeason) {
        filtered = filtered.filter(match => match.seasonId === this.filterSeason);
      }

      // Apply sorting
      filtered.sort((a, b) => {
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

      this.filteredMatches = filtered;
    });
  }

  onTeamFilterChange(team: string): void {
    this.filterTeam = team;
    this.applyFiltersAndSort();
  }

  onSeasonFilterChange(seasonId: string): void {
    this.filterSeason = seasonId;
    this.updateTeamOptions();
    this.applyFiltersAndSort();
  }

  onSortChange(criteria: 'date' | 'homeTeam' | 'awayTeam'): void {
    if (this.sortCriteria === criteria) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCriteria = criteria;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  clearAllFilters(): void {
    this.filterTeam = '';
    this.filterSeason = '';
    this.applyFiltersAndSort();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  formatDateMobile(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  getResultClass(match: any, teamName: string): string {
    if (!match.homeScore && !match.awayScore) return '';
    
    const isHomeTeam = match.homeTeam === teamName;
    const teamScore = isHomeTeam ? match.homeScore : match.awayScore;
    const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;
    
    if (teamScore > opponentScore) return 'win';
    if (teamScore < opponentScore) return 'loss';
    return '';
  }

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  // Handle image loading errors
  onImageError(event: any): void {
    console.log('Image failed to load, URL:', event.target.src);
    
    // Prevent infinite error loops - if we're already showing the default image, don't change it
    if (event.target.src.includes('square-default.png')) {
      console.log('Default image also failed to load, stopping error handling');
      return;
    }
    
    // Set the fallback image using the image service to ensure correct URL construction
    event.target.src = this.imageUrlService.getImageUrl(undefined);
  }
}