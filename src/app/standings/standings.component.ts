import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ApiService } from '../store/services/api.service';
import { MatchService } from '../store/services/match.service';
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
  isLoading: boolean = true; // Start with loading true
  dataLoaded: boolean = false; // Track if data has been loaded at least once

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private apiService: ApiService,
    private matchService: MatchService,
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
    console.log('Standings component initialized');
    
    // Set up data subscriptions first
    this.setupDataSubscriptions();
    
    // Load seasons first, then load data directly
    this.loadSeasons();
    this.loadDataDirectly();
    
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
    
    // Load season-specific data
    this.loadSeasonSpecificData();
  }

  private setupDataSubscriptions() {
    // Subscribe to seasons for the dropdown
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      console.log('Seasons loaded:', seasons?.length);
      if (seasons.length > 0 && !this.selectedSeasonId) {
        this.selectedSeasonId = seasons[0]._id;
        console.log('Auto-selected season:', this.selectedSeasonId);
        this.loadSeasonSpecificData();
      }
    });
  }

  loadSeasons(): void {
    this.ngrxApiService.loadSeasons();
  }


  loadDataDirectly(): void {
    console.log('Loading data directly from API...');
    this.isLoading = true; // Ensure loading state is set
    
    // First load seasons to get the current season
    this.apiService.getSeasons().subscribe({
      next: (seasons) => {
        if (seasons && seasons.length > 0) {
          // Auto-select first season if none selected
          if (!this.selectedSeasonId) {
            this.selectedSeasonId = seasons[0]._id;
            console.log('Auto-selected season:', this.selectedSeasonId);
          }
          
          // Now load season-specific data
          this.loadSeasonSpecificData();
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading seasons:', error);
        this.isLoading = false;
      }
    });
  }

  loadSeasonSpecificData(): void {
    if (!this.selectedSeasonId) {
      this.isLoading = false;
      return;
    }

    console.log(`Loading data for season: ${this.selectedSeasonId}`);
    this.isLoading = true; // Set loading state
    
    // Load only season-specific data in parallel
    forkJoin({
      games: this.apiService.getGamesBySeason(this.selectedSeasonId),
      clubs: this.apiService.getClubsBySeason(this.selectedSeasonId),
      divisions: this.apiService.getDivisionsBySeason(this.selectedSeasonId)
    }).subscribe({
      next: ({ games, clubs, divisions }) => {
        console.log('Season-specific data loaded:', { 
          games: games?.length, 
          clubs: clubs?.length, 
          divisions: divisions?.length 
        });
        
        // Clear existing data to prevent accumulation
        this.games = games || [];
        this.clubs = clubs || [];
        this.divisions = divisions || [];
        this.divisionStandings = []; // Clear existing standings
        
        this.isLoading = false;
        
        this.calculateStandings();
      },
      error: (error) => {
        console.error('Error loading season-specific data:', error);
        this.isLoading = false;
      }
    });
  }

  loadSeasonData(): void {
    if (!this.selectedSeasonId) return;

    // Load divisions for the selected season
    this.ngrxApiService.loadDivisionsBySeason(this.selectedSeasonId);
    
    this.calculateStandings();
  }

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
    this.divisions
      .filter(division => division.seasonId === this.selectedSeasonId)
      .forEach(division => {
        if (!uniqueDivisions.has(division._id)) {
          uniqueDivisions.set(division._id, division);
        }
      });
    
    // Convert to array and sort by order
    const sortedDivisions = Array.from(uniqueDivisions.values())
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log(`Processing ${sortedDivisions.length} unique divisions for season ${this.selectedSeasonId}`);
    
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
    
    console.log(`Created ${this.divisionStandings.length} division standings`);
    this.isLoading = false;
    this.dataLoaded = true; // Mark that data has been loaded at least once
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
    let gamesWithScores = 0;
    
    for (const game of games) {
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

      if (homeTeam && awayTeam && homeScore !== undefined && awayScore !== undefined) {
        // Check if game has been played (simplified logic)
        const hasBeenPlayed = (game.eashlData as any)?.matchId || (homeScore > 0 || awayScore > 0) || game.isOvertime;

        if (hasBeenPlayed) {
          // Update games played
          homeTeam.gamesPlayed++;
          awayTeam.gamesPlayed++;

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