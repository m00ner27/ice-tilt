import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest, forkJoin, of } from 'rxjs';
import { takeUntil, map, tap, filter, startWith, shareReplay } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ApiService } from '../store/services/api.service';
import { MatchService } from '../store/services/match.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { LoggerService } from '../shared/services/logger.service';
import { AdSenseComponent, AdSenseConfig } from '../components/adsense/adsense.component';
import { FullPageAdComponent } from '../components/adsense/fullpage-ad.component';
import { FooterAdComponent } from '../components/adsense/footer-ad.component';

// Import selectors
import * as SeasonsSelectors from '../store/seasons.selectors';
import * as ClubsSelectors from '../store/clubs.selectors';
import * as MatchesSelectors from '../store/matches.selectors';
import * as DivisionsSelectors from '../store/divisions.selectors';

interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Division {
  _id: string;
  name: string;
  seasonId: string;
  logoUrl?: string;
  order?: number;
}

interface Game {
  _id: string;
  seasonId: string;
  divisionId: string;
  homeClubId: string | Club;
  awayClubId: string | Club;
  date: string;
  isOvertime?: boolean;
  eashlMatchId?: string;
  forfeit?: string;
  score?: {
    home: number;
    away: number;
  };
  homeTeamScore?: number;
  awayTeamScore?: number;
  eashlData?: {
    homeScore: number;
    awayScore: number;
    manualEntry?: boolean;
    clubs?: {
      [clubId: string]: {
        goals: number;
        goalsAgainst: number;
      };
    };
  };
  homeClub?: Club;
  awayClub?: Club;
}

interface Club {
  _id: string;
  name: string;
  logoUrl?: string;
  seasons: {
    seasonId: string;
    divisionIds: string[];
  }[];
}

interface TeamStanding {
  teamId: string;
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;
  winPercentage: number;
  logo?: string;
}

interface DivisionStandings {
  division: Division;
  standings: TeamStanding[];
}

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdSenseComponent, FullPageAdComponent, FooterAdComponent],
  templateUrl: './standings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observable selectors
  seasons$: Observable<any[]>;
  clubs$: Observable<any[]>;
  matches$: Observable<any[]>;
  divisions$: Observable<any[]>;
  seasonsLoading$: Observable<boolean>;
  seasonsError$: Observable<any>;
  
  // Local state
  selectedSeasonId: string = '';
  divisions: any[] = [];
  clubs: any[] = [];
  games: any[] = [];
  divisionStandings: any[] = [];
  seasons: any[] = []; // Local array for sorted seasons (like player-stats)
  sortColumn: string = 'points';
  sortDirection: 'asc' | 'desc' = 'desc';
  isLoading: boolean = true; // Start with loading true
  dataLoaded: boolean = false; // Track if data has been loaded at least once
  
  // AdSense configuration
  bannerAdConfig: AdSenseConfig = {
    adSlot: '8840984486',
    adFormat: 'auto',
    responsive: true,
    className: 'banner-ad'
  };
  
  // Banner ads for better space utilization
  bannerAdConfig2: AdSenseConfig = {
    adSlot: '8840984486',
    adFormat: 'auto',
    responsive: true,
    className: 'banner-ad'
  };

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private apiService: ApiService,
    private matchService: MatchService,
    private imageUrlService: ImageUrlService,
    private route: ActivatedRoute,
    private router: Router,
    private logger: LoggerService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize selectors - exactly like player-stats component
    this.seasons$ = this.store.select(SeasonsSelectors.selectAllSeasons);
    this.clubs$ = this.store.select(ClubsSelectors.selectAllClubs);
    this.matches$ = this.store.select(MatchesSelectors.selectAllMatches);
    this.divisions$ = this.store.select(DivisionsSelectors.selectAllDivisions);
    this.seasonsLoading$ = this.store.select(SeasonsSelectors.selectSeasonsLoading);
    this.seasonsError$ = this.store.select(SeasonsSelectors.selectSeasonsError);
  }

  ngOnInit(): void {
    // Force a visible log to verify code is running
    window.console.error('🚀🚀🚀 STANDINGS COMPONENT INIT 🚀🚀🚀');
    console.log('🚀 Standings component ngOnInit called');
    // Read selectedSeasonId from query parameters
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['season']) {
        this.selectedSeasonId = params['season'];
      }
    });
    
    // Load seasons first, then set up subscriptions
    this.loadSeasons();
    
    // Set up data subscriptions after loading seasons
    this.setupDataSubscriptions();
    
    // Listen for storage events (when admin panel makes changes)
    window.addEventListener('storage', (event) => {
      if (event.key === 'admin-data-updated') {
        // Force a complete refresh of all data
        this.loadDataDirectly();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // Load matches when season changes
  onSeasonChange(seasonId: string) {
    this.selectedSeasonId = seasonId;
    this.isLoading = true;
    this.divisionStandings = []; // Clear existing standings
    this.cdr.markForCheck();
    
    // Update URL query parameters to preserve filter state
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { season: seasonId },
      queryParamsHandling: 'merge'
    });
    
    // Load season-specific data
    this.loadSeasonSpecificData();
  }

  private setupDataSubscriptions() {
    // Force a visible log to verify code is running
    window.console.error('🔧🔧🔧 SETUP DATA SUBSCRIPTIONS CALLED 🔧🔧🔧');
    console.log('🔧 Standings setupDataSubscriptions called');
    // Use combineLatest like player-stats component to sort seasons
    combineLatest([
      this.seasons$,
      this.seasonsLoading$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([seasons, loading]) => {
        console.log('📊 Standings - combineLatest fired, seasons:', seasons?.length || 0, 'loading:', loading);
        // Sort seasons - seasons should already be sorted from reducer, but sort again as backup
        const sorted = [...(seasons || [])].sort((a, b) => {
          // Exact same sorting logic as player-stats component
          let dateA = 0;
          let dateB = 0;
          
          if (a.endDate) {
            if (a.endDate instanceof Date) {
              dateA = a.endDate.getTime();
            } else if (typeof a.endDate === 'string') {
              dateA = new Date(a.endDate).getTime();
            }
          }
          
          if (b.endDate) {
            if (b.endDate instanceof Date) {
              dateB = b.endDate.getTime();
            } else if (typeof b.endDate === 'string') {
              dateB = new Date(b.endDate).getTime();
            }
          }
          
          // Handle invalid dates
          if (isNaN(dateA)) dateA = 0;
          if (isNaN(dateB)) dateB = 0;
          
          return dateB - dateA; // Descending order (newest first)
        });
        console.log('✅ Standings - Sorted order:', sorted.map(s => s.name));
        return { seasons: sorted, loading };
      })
    ).subscribe(({ seasons, loading }) => {
      console.log('📥 Standings - Subscription received, seasons:', seasons.map(s => s.name));
      if (!loading && seasons.length > 0) {
        this.seasons = seasons;
        console.log('💾 Standings - this.seasons set to:', this.seasons.map(s => s.name));
        
        if (!this.selectedSeasonId) {
          // Only set default if no query param was provided
          this.selectedSeasonId = seasons[0]._id;
          this.loadSeasonSpecificData();
          this.cdr.markForCheck();
        } else if (this.selectedSeasonId) {
          // If we have a selectedSeasonId (from query params), verify it exists and load data
          const seasonExists = seasons.some(s => s._id === this.selectedSeasonId);
          if (seasonExists) {
            this.loadSeasonSpecificData();
            this.cdr.markForCheck();
          } else {
            // If the season from query params doesn't exist, fall back to first season
            this.selectedSeasonId = seasons[0]._id;
            this.loadSeasonSpecificData();
            this.cdr.markForCheck();
          }
        }
      }
    });
  }

  loadSeasons(): void {
    this.ngrxApiService.loadSeasons();
  }


  loadDataDirectly(): void {
    this.isLoading = true; // Ensure loading state is set
    
    // First load seasons to get the current season
    this.apiService.getSeasons().subscribe({
      next: (seasons) => {
        if (seasons && seasons.length > 0) {
          // Auto-select first season if none selected
          if (!this.selectedSeasonId) {
            this.selectedSeasonId = seasons[0]._id;
          }
          
          // Now load season-specific data
          this.loadSeasonSpecificData();
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.logger.error('Error loading seasons:', error);
        this.isLoading = false;
      }
    });
  }

  loadSeasonSpecificData(): void {
    if (!this.selectedSeasonId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true; // Set loading state
    this.divisionStandings = []; // Clear existing standings
    
    // Load standings from server (optimized - no need to load all games)
    // Still load divisions for display purposes
    forkJoin({
      standings: this.apiService.getStandings(this.selectedSeasonId),
      divisions: this.apiService.getDivisionsBySeason(this.selectedSeasonId)
    }).subscribe({
      next: ({ standings, divisions }) => {
        // Standings are already calculated server-side and grouped by division
        // Map to the expected format
        this.divisions = divisions || [];
        this.divisionStandings = standings || [];
        
        this.isLoading = false;
        this.dataLoaded = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.logger.error('Error loading standings:', error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadSeasonData(): void {
    if (!this.selectedSeasonId) return;

    // Load divisions for the selected season
    this.ngrxApiService.loadDivisionsBySeason(this.selectedSeasonId);
    
    // Load standings from server instead of calculating client-side
    this.loadSeasonSpecificData();
  }

  // Deprecated: Client-side calculation replaced by server-side aggregation
  // Keeping for reference but no longer called
  calculateStandings(): void {
    this.isLoading = true;
    
    // Clear existing standings to prevent duplicates
    this.divisionStandings = [];
    
    // Pre-filter games for the current season only
    const seasonGames = this.games.filter(game => game.seasonId === this.selectedSeasonId);
    
    // Group games by division
    const gamesByDivision = new Map<string, Game[]>();
    const firstDivision = this.divisions.find(d => d.seasonId === this.selectedSeasonId);
    
    seasonGames.forEach(game => {
      // Handle games with undefined divisionId by assigning them to the first division for this season
      let divisionId = game.divisionId;
      if (!divisionId && firstDivision) {
        divisionId = firstDivision._id;
      }
      
      if (divisionId) {
        if (!gamesByDivision.has(divisionId)) {
          gamesByDivision.set(divisionId, []);
        }
        gamesByDivision.get(divisionId)!.push(game);
      }
    });

    // Calculate standings for each division, sorted by order
    // First, deduplicate divisions by ID to prevent duplicates
    const uniqueDivisions = new Map<string, Division>();
    
    // Since we're loading season-specific data, all divisions should belong to the current season
    // But let's be safe and filter if needed
    const divisionsToProcess = this.divisions.filter(division => {
      // If division has seasonId field, check it matches
      if (division.seasonId) {
        return division.seasonId === this.selectedSeasonId;
      }
      // If no seasonId field, assume it belongs to current season (since we loaded season-specific data)
      return true;
    });
    
    divisionsToProcess.forEach(division => {
      if (!uniqueDivisions.has(division._id)) {
        uniqueDivisions.set(division._id, division);
      }
    });
    
    // Convert to array and sort by order
    const sortedDivisions = Array.from(uniqueDivisions.values())
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    sortedDivisions.forEach(division => {
      const divisionGames = gamesByDivision.get(division._id) || [];
      const standings = this.calculateDivisionStandings(divisionGames, division);
      
      if (standings.length > 0) {
        this.divisionStandings.push({
          division,
          standings
        });
      }
    });
    
    this.isLoading = false;
    this.dataLoaded = true; // Mark that data has been loaded at least once
    this.cdr.markForCheck();
  }

  calculateDivisionStandings(games: Game[], division: Division): TeamStanding[] {
    const standingsMap = new Map<string, TeamStanding>();

    // Pre-cache club lookups for faster access
    const clubMap = new Map<string, Club>();
    this.clubs.forEach(club => clubMap.set(club._id, club));

    // Filter clubs that belong to the current division for the selected season
    let clubsInDivision = this.clubs.filter(club => {
      const isInDivision = club.seasons.some((s: any) => {
        const seasonId = s.seasonId._id || s.seasonId;
        return seasonId === this.selectedSeasonId && s.divisionIds && s.divisionIds.includes(division._id);
      });
      return isInDivision;
    });
    
    // Fallback: If no clubs found through season data, try to get all clubs
    if (clubsInDivision.length === 0) {
      clubsInDivision = this.clubs;
    }

    // Initialize standings for the clubs in this division
    clubsInDivision.forEach(club => {
      standingsMap.set(club._id, {
        teamId: club._id,
        teamName: club.name,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        otLosses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifferential: 0,
        winPercentage: 0,
        logo: club.logoUrl
      });
    });

    if (clubsInDivision.length === 0) {
      return [];
    }

    // Process games with optimized score extraction
    // Additional defensive filter to exclude playoff games
    const regularSeasonGames = games.filter((game: any) => !game.isPlayoff);
    let gamesWithScores = 0;
    
    for (const game of regularSeasonGames) {
      // Optimized score extraction - try most common patterns first
      let homeScore: number | undefined;
      let awayScore: number | undefined;
      
      // Try direct score properties first (most common)
      if (typeof (game as any).homeScore !== 'undefined' && typeof (game as any).awayScore !== 'undefined') {
        homeScore = (game as any).homeScore;
        awayScore = (game as any).awayScore;
      }
      // Try game.score (EASHL data)
      else if (game.score?.home !== undefined && game.score?.away !== undefined) {
        homeScore = game.score.home;
        awayScore = game.score.away;
      }
      // Try homeTeamScore/awayTeamScore (manual entries)
      else if (typeof game.homeTeamScore !== 'undefined' && typeof game.awayTeamScore !== 'undefined') {
        homeScore = game.homeTeamScore;
        awayScore = game.awayTeamScore;
      }
      // Skip if no valid scores found
      else {
        continue;
      }

      gamesWithScores++;
      
      // Extract team info efficiently
      const homeClubId = typeof game.homeClubId === 'object' ? (game.homeClubId as any)._id : game.homeClubId;
      const awayClubId = typeof game.awayClubId === 'object' ? (game.awayClubId as any)._id : game.awayClubId;
      
      const homeTeam = standingsMap.get(homeClubId);
      const awayTeam = standingsMap.get(awayClubId);

      if (homeTeam && awayTeam) {
        // Check if game has been played (simplified logic)
        const hasBeenPlayed = (game.eashlData as any)?.matchId || ((homeScore || 0) > 0 || (awayScore || 0) > 0) || game.isOvertime;
        const isForfeitGame = game.forfeit && game.forfeit !== 'none';

        if (hasBeenPlayed || isForfeitGame) {
          // Update games played
          homeTeam.gamesPlayed++;
          awayTeam.gamesPlayed++;

          if (isForfeitGame) {
            // Handle forfeit games
            if (game.forfeit === 'forfeit-home') {
              // Home team wins by forfeit
              homeTeam.wins++;
              homeTeam.points += 2;
              awayTeam.losses++;
              // For forfeit games, use default scores (1-0)
              homeTeam.goalsFor += 1;
              homeTeam.goalsAgainst += 0;
              awayTeam.goalsFor += 0;
              awayTeam.goalsAgainst += 1;
            } else if (game.forfeit === 'forfeit-away') {
              // Away team wins by forfeit
              awayTeam.wins++;
              awayTeam.points += 2;
              homeTeam.losses++;
              // For forfeit games, use default scores (0-1)
              homeTeam.goalsFor += 0;
              homeTeam.goalsAgainst += 1;
              awayTeam.goalsFor += 1;
              awayTeam.goalsAgainst += 0;
            }
          } else if (homeScore !== undefined && awayScore !== undefined) {
            // Handle regular games with actual scores
            // Update goals
            homeTeam.goalsFor += homeScore;
            homeTeam.goalsAgainst += awayScore;
            awayTeam.goalsFor += awayScore;
            awayTeam.goalsAgainst += homeScore;

            // Update wins/losses and points
            if (homeScore > awayScore) {
              homeTeam.wins++;
              homeTeam.points += 2;
              
              if (game.isOvertime) {
                awayTeam.otLosses++;
                awayTeam.points += 1;
              } else {
                awayTeam.losses++;
              }
            } else if (awayScore > homeScore) {
              awayTeam.wins++;
              awayTeam.points += 2;
              
              if (game.isOvertime) {
                homeTeam.otLosses++;
                homeTeam.points += 1;
              } else {
                homeTeam.losses++;
              }
            } else {
              // Tie game
              homeTeam.points += 1;
              awayTeam.points += 1;
            }
          }
        }
      }
    }

    // Calculate derived stats
    standingsMap.forEach(team => {
      team.goalDifferential = team.goalsFor - team.goalsAgainst;
      team.winPercentage = team.gamesPlayed > 0 ? team.wins / team.gamesPlayed : 0;
    });

    // Convert to array and sort
    const standings = Array.from(standingsMap.values());
    this.sortStandings(standings, this.sortColumn, this.sortDirection);

    return standings;
  }

  sortStandings(standings: TeamStanding[], column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn = column;
    this.sortDirection = direction;

    standings.sort((a, b) => {
      let comparison = 0;

      switch (column) {
        case 'teamName':
          comparison = a.teamName.localeCompare(b.teamName);
          break;
        case 'gamesPlayed':
          comparison = a.gamesPlayed - b.gamesPlayed;
          break;
        case 'wins':
          comparison = a.wins - b.wins;
          break;
        case 'losses':
          comparison = a.losses - b.losses;
          break;
        case 'otLosses':
          comparison = a.otLosses - b.otLosses;
          break;
        case 'points':
          comparison = a.points - b.points;
          break;
        case 'goalsFor':
          comparison = a.goalsFor - b.goalsFor;
          break;
        case 'goalsAgainst':
          comparison = a.goalsAgainst - b.goalsAgainst;
          break;
        case 'goalDifferential':
          comparison = a.goalDifferential - b.goalDifferential;
          break;
        case 'winPercentage':
          comparison = a.winPercentage - b.winPercentage;
          break;
        default:
          comparison = a.points - b.points;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  onSortColumn(column: string): void {
    if (this.sortColumn === column) {
      // Toggle direction for same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Reset to ascending for different column
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Apply sorting to all divisions
    this.divisionStandings.forEach(divisionStanding => {
      this.sortStandings(divisionStanding.standings, this.sortColumn, this.sortDirection);
    });
    this.cdr.markForCheck();
  }

  getColumnSortClass(column: string): string {
    if (this.sortColumn !== column) {
      return 'sortable';
    }
    return this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
  }

  getSelectedSeasonName(): string {
    let selectedSeasonName = '';
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      const season = seasons.find(s => s._id === this.selectedSeasonId);
      selectedSeasonName = season ? season.name : '';
    });
    return selectedSeasonName;
  }

  // Handle image loading errors
  onImageError(event: any): void {
    
    event.target.src = 'assets/images/1ithlwords.png';
  }

  // Helper method to get the full image URL using the centralized service
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl, 'assets/images/1ithlwords.png');
  }

  // Helper method to check if all teams in a division have 0 games played
  hasNoCompletedGames(standings: TeamStanding[]): boolean {
    return standings.every(team => team.gamesPlayed === 0);
  }
}