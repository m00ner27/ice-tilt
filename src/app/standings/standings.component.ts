import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ApiService } from '../store/services/api.service';
import { ImageUrlService } from '../shared/services/image-url.service';

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
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './standings.component.html'
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
  sortColumn: string = 'points';
  sortDirection: 'asc' | 'desc' = 'desc';
  isLoading: boolean = true;

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private apiService: ApiService,
    private imageUrlService: ImageUrlService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Initialize selectors
    this.seasons$ = this.store.select(SeasonsSelectors.selectAllSeasons);
    this.clubs$ = this.store.select(ClubsSelectors.selectAllClubs);
    this.matches$ = this.store.select(MatchesSelectors.selectAllMatches);
    this.divisions$ = this.store.select(DivisionsSelectors.selectAllDivisions);
    this.seasonsLoading$ = this.store.select(SeasonsSelectors.selectSeasonsLoading);
    this.seasonsError$ = this.store.select(SeasonsSelectors.selectSeasonsError);
  }

  ngOnInit(): void {
    // Check for season query parameter first
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['season']) {
        this.selectedSeasonId = params['season'];
      }
    });

    // Load data using NgRx
    this.ngrxApiService.loadSeasons();
    this.ngrxApiService.loadClubs();
    this.ngrxApiService.loadMatches();
    this.ngrxApiService.loadDivisions();
    
    // Subscribe to data changes
    this.setupDataSubscriptions();
    
    // Also load data directly as backup immediately
    this.loadDataDirectly();
    
    // Listen for storage events (when admin panel makes changes)
    window.addEventListener('storage', (event) => {
      if (event.key === 'admin-data-updated') {
        // Force a complete refresh of all data
        this.ngrxApiService.loadMatches();
        this.ngrxApiService.loadClubs();
        this.ngrxApiService.loadDivisions();
        
        // Force a direct API call immediately to get the latest data
        this.loadDataDirectly();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDataSubscriptions() {
    // Subscribe to seasons
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      if (seasons.length > 0 && !this.selectedSeasonId) {
        this.selectedSeasonId = seasons[0]._id;
        this.loadSeasonData();
      }
    });

    // Subscribe to clubs, matches, and divisions for season data
    combineLatest([
      this.clubs$,
      this.matches$,
      this.divisions$
    ]).pipe(takeUntil(this.destroy$)).subscribe(([clubs, matches, divisions]) => {
      
      // Only update if we don't have better data from direct API calls
      // The direct API data is more reliable and complete
      if (this.games.length === 0 || matches.some(m => m.score && m.score.home !== undefined && m.score.away !== undefined)) {
        this.clubs = clubs;
        this.games = matches;
        this.divisions = divisions;
        
        // Only recalculate standings when data changes, don't reload season data
        if (this.selectedSeasonId) {
          this.calculateStandings();
        }
      }
    });
  }

  loadSeasons(): void {
    this.ngrxApiService.loadSeasons();
  }

  onSeasonChange(): void {
    // Update URL with the selected season
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { season: this.selectedSeasonId },
      queryParamsHandling: 'merge'
    });
    
    this.loadSeasonData();
  }

  // Direct API call to get fresh data (used when NgRx store isn't updated)
  loadDataDirectly(): void {
    // Load all data in parallel for faster loading
    Promise.all([
      this.apiService.getGames().toPromise(),
      this.apiService.getClubs().toPromise(),
      this.apiService.getDivisions().toPromise()
    ]).then(([games, clubs, divisions]) => {
      
      this.games = games || [];
      this.clubs = clubs || [];
      this.divisions = divisions || [];
      this.isLoading = false;
      
      if (this.selectedSeasonId) {
        this.calculateStandings();
      }
    }).catch(error => {
      console.error('Error loading data directly:', error);
    });
  }

  loadSeasonData(): void {
    if (!this.selectedSeasonId) return;

    // Load divisions for the selected season
    this.ngrxApiService.loadDivisionsBySeason(this.selectedSeasonId);
    
    this.calculateStandings();
  }

  calculateStandings(): void {
    const seasonGames = this.games.filter(game => game.seasonId === this.selectedSeasonId);
    
    this.divisionStandings = [];

    // Group games by division
    const gamesByDivision = new Map<string, Game[]>();
    this.games.forEach(game => {
      if (game.seasonId === this.selectedSeasonId) {
        // Handle games with undefined divisionId by assigning them to the first division for this season
        let divisionId = game.divisionId;
        if (!divisionId && this.divisions.length > 0) {
          const firstDivision = this.divisions.find(d => d.seasonId === this.selectedSeasonId);
          if (firstDivision) {
            divisionId = firstDivision._id;
          }
        }
        
        if (divisionId) {
          if (!gamesByDivision.has(divisionId)) {
            gamesByDivision.set(divisionId, []);
          }
          gamesByDivision.get(divisionId)!.push(game);
        }
      }
    });
    

    // Calculate standings for each division, sorted by order
    const sortedDivisions = this.divisions
      .filter(division => division.seasonId === this.selectedSeasonId)
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
  }

  calculateDivisionStandings(games: Game[], division: Division): TeamStanding[] {
    
    const standingsMap = new Map<string, TeamStanding>();

    // Filter clubs that belong to the current division for the selected season
    const clubsInDivision = this.clubs.filter(club => {
      const isInDivision = club.seasons.some((s: any) => {
        const seasonId = s.seasonId._id || s.seasonId; // Handle both object and string formats
        return seasonId === this.selectedSeasonId && s.divisionIds && s.divisionIds.includes(division._id);
      });
      return isInDivision;
    });
    

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

    // If no clubs are in the division, no need to process games
    if (clubsInDivision.length === 0) {
      return [];
    }

    // Calculate stats from games
    let gamesWithScores = 0;
    let manualEntryGames = 0;
    let eashlGames = 0;
    
    games.forEach((game, index) => {
      // Check for scores in multiple possible locations
      let homeScore: number | undefined;
      let awayScore: number | undefined;
      
      // First try game.score (for EASHL data)
      if (game.score && typeof game.score.home !== 'undefined' && typeof game.score.away !== 'undefined') {
        homeScore = game.score.home;
        awayScore = game.score.away;
      }
      // Then try game.homeTeamScore/game.awayTeamScore (for manual entries)
      else if (typeof game.homeTeamScore !== 'undefined' && typeof game.awayTeamScore !== 'undefined') {
        homeScore = game.homeTeamScore;
        awayScore = game.awayTeamScore;
      }
      // Finally try eashlData scores (fallback)
      else if (game.eashlData?.clubs) {
        const homeClubId = typeof game.homeClubId === 'object' ? (game.homeClubId as any)._id : game.homeClubId;
        const awayClubId = typeof game.awayClubId === 'object' ? (game.awayClubId as any)._id : game.awayClubId;
        
        if (homeClubId && game.eashlData.clubs[homeClubId]?.goals !== undefined) {
          homeScore = game.eashlData.clubs[homeClubId].goals;
        }
        if (awayClubId && game.eashlData.clubs[awayClubId]?.goals !== undefined) {
          awayScore = game.eashlData.clubs[awayClubId].goals;
        }
      }
      
      // Skip games without valid scores
      if (typeof homeScore === 'undefined' || typeof awayScore === 'undefined') {
        return;
      }

      gamesWithScores++;
      
      // Debug logging for manual entries
      if (game.eashlData?.manualEntry) {
        manualEntryGames++;
        console.log(`Processing manual entry game ${game._id}:`, {
          homeTeam: typeof game.homeClubId === 'object' ? (game.homeClubId as Club).name : 'Unknown',
          awayTeam: typeof game.awayClubId === 'object' ? (game.awayClubId as Club).name : 'Unknown',
          homeScore,
          awayScore,
          homeTeamScore: game.homeTeamScore,
          awayTeamScore: game.awayTeamScore
        });
      } else {
        eashlGames++;
      }
      
      const homeTeamName = typeof game.homeClubId === 'object' && game.homeClubId ? (game.homeClubId as Club).name : 'Unknown';
      const awayTeamName = typeof game.awayClubId === 'object' && game.awayClubId ? (game.awayClubId as Club).name : 'Unknown';
      // Extract club IDs from objects if needed
      const homeClubId = typeof game.homeClubId === 'object' ? (game.homeClubId as any)._id : game.homeClubId;
      const awayClubId = typeof game.awayClubId === 'object' ? (game.awayClubId as any)._id : game.awayClubId;
      
      const homeTeam = standingsMap.get(homeClubId);
      const awayTeam = standingsMap.get(awayClubId);

      if (homeTeam && awayTeam) {
        // Only count games that have been played (have EASHL data or actual scores > 0)
        const hasBeenPlayed = game.eashlData && (game.eashlData as any).matchId || 
                             (homeScore > 0 || awayScore > 0) ||
                             (game.isOvertime || (game as any).isShootout);

        if (hasBeenPlayed) {
          // Update games played only for completed games
          homeTeam.gamesPlayed++;
          awayTeam.gamesPlayed++;

          // Update goals
          homeTeam.goalsFor += homeScore;
          homeTeam.goalsAgainst += awayScore;
          awayTeam.goalsFor += awayScore;
          awayTeam.goalsAgainst += homeScore;

          // Update wins/losses and points, considering overtime
          if (homeScore > awayScore) {
            homeTeam.wins++;
            homeTeam.points += 2;
            
            // Check if losing team gets OTL point
            if (game.isOvertime) {
              awayTeam.otLosses++;
              awayTeam.points += 1; // 1 point for OTL
            } else {
              awayTeam.losses++;
            }
          } else if (awayScore > homeScore) {
            awayTeam.wins++;
            awayTeam.points += 2;
            
            // Check if losing team gets OTL point
            if (game.isOvertime) {
              homeTeam.otLosses++;
              homeTeam.points += 1; // 1 point for OTL
            } else {
              homeTeam.losses++;
            }
          } else {
            // Tie game - both teams get 1 point (shouldn't happen in hockey but just in case)
            homeTeam.points += 1;
            awayTeam.points += 1;
          }
        }
      }
    });


    // Calculate derived stats
    standingsMap.forEach(team => {
      team.goalDifferential = team.goalsFor - team.goalsAgainst;
      team.winPercentage = team.gamesPlayed > 0 ? team.wins / team.gamesPlayed : 0;
    });
    
    // Debug summary
    console.log(`Standings calculation summary:`, {
      totalGames: games.length,
      gamesWithScores,
      manualEntryGames,
      eashlGames,
      teamsInStandings: standingsMap.size
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
    console.error('Image failed to load:', event.target.src);
    event.target.src = 'assets/images/1ithlwords.png';
  }

  // Helper method to get the full image URL using the centralized service
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl, 'assets/images/1ithlwords.png');
  }
}