import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ApiService } from '../store/services/api.service';
import { environment } from '../../environments/environment';

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
}

interface Game {
  _id: string;
  seasonId: string;
  divisionId: string;
  homeClubId: string;
  awayClubId: string;
  date: string;
  isOvertime?: boolean;
  eashlMatchId?: string;
  score?: {
    home: number;
    away: number;
  };
  eashlData?: {
    homeScore: number;
    awayScore: number;
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
    private apiService: ApiService
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
    console.log('=== STANDINGS COMPONENT INIT ===');
    
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
        console.log('Admin data updated, refreshing standings...');
        console.log('Storage event timestamp:', event.newValue);
        
        // Force a complete refresh of all data
        this.ngrxApiService.loadMatches();
        this.ngrxApiService.loadClubs();
        this.ngrxApiService.loadDivisions();
        
        // Force a direct API call immediately to get the latest data
        console.log('Forcing direct API reload after storage event...');
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
      console.log('=== STANDINGS DATA UPDATE ===');
      console.log(`Clubs: ${clubs.length}, Matches: ${matches.length}, Divisions: ${divisions.length}`);
      console.log(`Matches with scores: ${matches.filter(m => m.score && m.score.home !== undefined && m.score.away !== undefined).length}`);
      
      // Debug: Log matches for the selected season
      if (this.selectedSeasonId) {
        const seasonMatches = matches.filter(m => m.seasonId === this.selectedSeasonId);
        console.log(`Matches for selected season ${this.selectedSeasonId}:`, seasonMatches.length);
        seasonMatches.forEach(match => {
          console.log(`Match: ${match._id}, Score: ${match.score?.home || 'N/A'}-${match.score?.away || 'N/A'}, EASHL: ${match.eashlMatchId || 'None'}`);
        });
      }
      
      // Only update if we don't have better data from direct API calls
      // The direct API data is more reliable and complete
      if (this.games.length === 0 || matches.some(m => m.score && m.score.home !== undefined && m.score.away !== undefined)) {
        this.clubs = clubs;
        this.games = matches;
        this.divisions = divisions;
        
        // Only recalculate standings when data changes, don't reload season data
        if (this.selectedSeasonId) {
          console.log('Recalculating standings due to NgRx data update...');
          this.calculateStandings();
        }
      } else {
        console.log('Skipping NgRx update - using direct API data instead');
      }
    });
  }

  loadSeasons(): void {
    this.ngrxApiService.loadSeasons();
  }

  onSeasonChange(): void {
    this.loadSeasonData();
  }

  // Direct API call to get fresh data (used when NgRx store isn't updated)
  loadDataDirectly(): void {
    console.log('Loading data directly from API...');
    
    // Load all data in parallel for faster loading
    Promise.all([
      this.apiService.getGames().toPromise(),
      this.apiService.getClubs().toPromise(),
      this.apiService.getDivisions().toPromise()
    ]).then(([games, clubs, divisions]) => {
      console.log('Direct API call - data loaded:', {
        games: games?.length || 0,
        clubs: clubs?.length || 0,
        divisions: divisions?.length || 0
      });
      
      // Debug: Log games for the selected season
      if (this.selectedSeasonId) {
        const seasonGames = (games || []).filter(g => g.seasonId === this.selectedSeasonId);
        console.log(`Direct API - Games for season ${this.selectedSeasonId}:`, seasonGames.length);
        seasonGames.forEach(game => {
          console.log(`Direct API - Game: ${game._id}, Score: ${game.score?.home || 'N/A'}-${game.score?.away || 'N/A'}, EASHL: ${game.eashlMatchId || 'None'}`);
        });
      }
      
      this.games = games || [];
      this.clubs = clubs || [];
      this.divisions = divisions || [];
      this.isLoading = false;
      
      if (this.selectedSeasonId) {
        console.log('Direct API - Recalculating standings...');
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
    console.log('=== CALCULATING STANDINGS ===');
    console.log(`Games: ${this.games.length}, Season: ${this.selectedSeasonId}, Divisions: ${this.divisions.length}`);
    
    // Debug: Log all games for the selected season
    const seasonGames = this.games.filter(game => game.seasonId === this.selectedSeasonId);
    console.log(`Games for season ${this.selectedSeasonId}:`, seasonGames.length);
    seasonGames.forEach(game => {
      console.log(`Game: ${game._id}, Season: ${game.seasonId}, Score: ${game.score?.home || 'N/A'}-${game.score?.away || 'N/A'}, EASHL: ${game.eashlMatchId || 'None'}`);
    });
    
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
    
    console.log(`Games grouped by division: ${gamesByDivision.size} divisions`);
    gamesByDivision.forEach((games, divisionId) => {
      const divisionName = this.divisions.find(d => d._id === divisionId)?.name || 'Unknown';
      console.log(`${divisionName}: ${games.length} games`);
    });

    // Calculate standings for each division
    this.divisions.forEach(division => {
      const divisionGames = gamesByDivision.get(division._id) || [];
      console.log(`${division.name}: ${divisionGames.length} games`);
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
    console.log(`=== ${division.name} Division ===`);
    console.log(`Games: ${games.length}, Clubs: ${this.clubs.length}`);
    
    const standingsMap = new Map<string, TeamStanding>();

    // Filter clubs that belong to the current division for the selected season
    const clubsInDivision = this.clubs.filter(club => {
      const isInDivision = club.seasons.some((s: any) => {
        const seasonId = s.seasonId._id || s.seasonId; // Handle both object and string formats
        return seasonId === this.selectedSeasonId && s.divisionIds && s.divisionIds.includes(division._id);
      });
      return isInDivision;
    });
    
    console.log(`Clubs in division: ${clubsInDivision.length} (${clubsInDivision.map(c => c.name).join(', ')})`);
    console.log(`Club IDs in standings map: ${clubsInDivision.map(c => c._id).join(', ')}`);

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
    console.log(`Processing ${games.length} games for standings calculation`);
    let gamesWithScores = 0;
    
    games.forEach((game, index) => {
      // Use game.score if available, as it's now the single source of truth for scores,
      // populated by both manual entry and the EASHL data linking.
      if (!game.score || typeof game.score.home === 'undefined' || typeof game.score.away === 'undefined') {
        // Skip games without valid scores
        return;
      }

      gamesWithScores++;
      const homeScore = game.score.home;
      const awayScore = game.score.away;
      const homeTeamName = typeof game.homeClubId === 'object' && game.homeClubId ? (game.homeClubId as any).name : 'Unknown';
      const awayTeamName = typeof game.awayClubId === 'object' && game.awayClubId ? (game.awayClubId as any).name : 'Unknown';
      console.log(`Game: ${homeTeamName} ${homeScore}-${awayScore} ${awayTeamName}`);

      // Extract club IDs from objects if needed
      const homeClubId = typeof game.homeClubId === 'object' ? (game.homeClubId as any)._id : game.homeClubId;
      const awayClubId = typeof game.awayClubId === 'object' ? (game.awayClubId as any)._id : game.awayClubId;
      
      const homeTeam = standingsMap.get(homeClubId);
      const awayTeam = standingsMap.get(awayClubId);

      console.log(`Looking up teams: homeClubId=${homeClubId}, awayClubId=${awayClubId}`);
      console.log(`Found teams: homeTeam=${!!homeTeam}, awayTeam=${!!awayTeam}`);

      if (homeTeam && awayTeam) {
        // Update games played
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
    });

    console.log(`Games with scores processed: ${gamesWithScores}/${games.length}`);

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
    console.error('Image failed to load:', event.target.src);
  }

  // Helper method to get the full image URL
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
    
    // If it's a filename that looks like an upload (has timestamp pattern), add /uploads/ prefix
    if (logoUrl.match(/^\d{13}-\d+-.+\.(png|jpg|jpeg|gif)$/)) {
      return `${environment.apiUrl}/uploads/${logoUrl}`;
    }
    
    // If it starts with 'uploads/' (no leading slash), add the API URL
    if (logoUrl.startsWith('uploads/')) {
      return `${environment.apiUrl}/${logoUrl}`;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }
}