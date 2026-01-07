import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ApiService } from '../store/services/api.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { AdSenseComponent, AdSenseConfig } from '../components/adsense/adsense.component';

// Import selectors
import * as MatchesSelectors from '../store/matches.selectors';
import * as ClubsSelectors from '../store/clubs.selectors';
import * as SeasonsSelectors from '../store/seasons.selectors';
import * as DivisionsSelectors from '../store/divisions.selectors';

// Simplified interfaces
interface Season {
  _id: string;
  name: string;
  endDate: Date | string;
  startDate: Date | string;
  isActive: boolean;
  divisions?: string[];
}

interface Division {
  _id: string;
  name: string;
  seasonId: string;
  logoUrl?: string;
  order?: number;
}

interface Club {
  name: string;
  seasons?: Array<{
    seasonId: string | { _id: string; name: string };
    divisionIds?: string[];
    roster?: string[];
  }>;
}

interface PlayerStats {
  playerId: number;
  name: string;
  team: string;
  teamLogo?: string;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots: number;
  hits: number;
  blockedShots: number;
  penaltyMinutes: number;
  powerPlayGoals: number;
  shortHandedGoals: number;
  gameWinningGoals: number;
  takeaways: number;
  giveaways: number;
  passAttempts: number;
  passes: number;
  passPercentage: number;
  shotPercentage: number;
  faceoffsWon: number;
  faceoffsLost: number;
  faceoffPercentage: number;
  interceptions?: number;
  division?: string;
}

interface GroupedPlayerStats {
  division: string;
  divisionData?: Division;
  stats: PlayerStats[];
}

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdSenseComponent],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.css'
})
export class PlayerStatsComponent implements OnInit, OnDestroy {
  // Observable selectors
  allMatches$: Observable<any[]>;
  allClubs$: Observable<Club[]>;
  seasons$: Observable<Season[]>;
  divisions$: Observable<Division[]>;
  matchesLoading$: Observable<boolean>;
  clubsLoading$: Observable<boolean>;
  seasonsLoading$: Observable<boolean>;
  divisionsLoading$: Observable<boolean>;
  
  // Local state
  groupedStats: GroupedPlayerStats[] = [];
  filteredGroupedStats: GroupedPlayerStats[] = [];
  selectedSeasonId: string | null = null;
  selectedTournamentId: string | null = null;
  selectedDivisionId: string = 'all-divisions';
  seasons: Season[] = [];
  tournaments: any[] = [];
  divisions: Division[] = [];
  includePlayoffs: boolean = false;
  statsMode: 'season' | 'tournament' = 'season';
  
  isLoading: boolean = true;
  sortColumn: string = 'points';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // AdSense configuration
  bannerAdConfig: AdSenseConfig = {
    adSlot: '8840984486',
    adFormat: 'auto',
    responsive: true,
    className: 'banner-ad'
  };
  
  // Subscription management
  private dataSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  
  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private imageUrlService: ImageUrlService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Initialize selectors
    this.allMatches$ = this.store.select(MatchesSelectors.selectAllMatches);
    this.allClubs$ = this.store.select(ClubsSelectors.selectAllClubs);
    this.seasons$ = this.store.select(SeasonsSelectors.selectAllSeasons);
    this.divisions$ = this.store.select(DivisionsSelectors.selectAllDivisions);
    this.matchesLoading$ = this.store.select(MatchesSelectors.selectMatchesLoading);
    this.clubsLoading$ = this.store.select(ClubsSelectors.selectClubsLoading);
    this.seasonsLoading$ = this.store.select(SeasonsSelectors.selectSeasonsLoading);
    this.divisionsLoading$ = this.store.select(DivisionsSelectors.selectDivisionsLoading);
  }
  
  ngOnInit(): void {
    // Read filter state from query parameters
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['season']) {
        this.selectedSeasonId = params['season'];
      }
      if (params['division']) {
        this.selectedDivisionId = params['division'];
      }
      if (params['playoffs'] !== undefined) {
        this.includePlayoffs = params['playoffs'] === 'true';
      }
    });
    
    this.loadInitialData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }
  
  loadInitialData(): void {
    this.isLoading = true;
    
    // Load data using NgRx store
    this.ngrxApiService.loadMatches();
    this.ngrxApiService.loadClubs();
    this.ngrxApiService.loadSeasons();
    this.ngrxApiService.loadDivisions();
    
    // Load tournaments
    this.apiService.getTournaments().subscribe({
      next: (tournaments) => {
        this.tournaments = tournaments || [];
      },
      error: (error) => {
        console.error('Error loading tournaments:', error);
        this.tournaments = [];
      }
    });
    
    // Subscribe to data changes
    this.dataSubscription = combineLatest([
      this.allMatches$,
      this.allClubs$,
      this.seasons$,
      this.divisions$,
      this.matchesLoading$,
      this.clubsLoading$,
      this.seasonsLoading$,
      this.divisionsLoading$
    ]).pipe(
      map(([matches, clubs, seasons, divisions, matchesLoading, clubsLoading, seasonsLoading, divisionsLoading]) => ({
        matches,
        clubs,
        seasons: [...seasons].sort((a, b) => {
          const dateA = a.endDate ? (a.endDate instanceof Date ? a.endDate.getTime() : new Date(a.endDate).getTime()) : 0;
          const dateB = b.endDate ? (b.endDate instanceof Date ? b.endDate.getTime() : new Date(b.endDate).getTime()) : 0;
          return dateB - dateA;
        }),
        divisions,
        loading: matchesLoading || clubsLoading || seasonsLoading || divisionsLoading
      }))
    ).subscribe({
      next: ({ matches, clubs, seasons, divisions, loading }) => {
        if (!loading && clubs.length > 0 && seasons.length > 0) {
          this.isLoading = false;
          
          if (this.seasons.length === 0) {
            this.seasons = seasons;
            this.selectedSeasonId = seasons.length > 0 ? seasons[0]._id : null;
            
            // Debug logging to see what divisions data we're getting
            console.log('Raw divisions data from store:', divisions);
            console.log('Divisions count:', divisions.length);
            console.log('Selected season ID:', this.selectedSeasonId);
            
            // Filter divisions to only show those for the selected season, then deduplicate
            const seasonDivisions = this.selectedSeasonId 
              ? divisions.filter(d => d.seasonId === this.selectedSeasonId)
              : divisions;
            
            console.log('After season filter - Divisions count:', seasonDivisions.length);
            console.log('After season filter - Division names:', seasonDivisions.map(d => d.name));
            
            // Deduplicate divisions by _id to prevent duplicate dropdown entries
            const deduplicatedDivisions = seasonDivisions.filter((division, index, self) => 
              index === self.findIndex(d => d._id === division._id)
            );
            
            // Sort divisions by their order field (ascending)
            this.divisions = deduplicatedDivisions.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            console.log('After deduplication - Divisions count:', this.divisions.length);
            console.log('After deduplication - Division names:', this.divisions.map(d => d.name));
            
            this.processStats(matches, clubs, divisions);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load data', err);
        this.isLoading = false;
      }
    });
  }
  
  onSeasonChange(): void {
    this.selectedDivisionId = 'all-divisions';
    
    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        season: this.selectedSeasonId, 
        division: this.selectedDivisionId,
        playoffs: this.includePlayoffs
      },
      queryParamsHandling: 'merge'
    });
    
    this.processStatsForCurrentSeason();
  }

  onDivisionChange(): void {
    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        season: this.selectedSeasonId, 
        division: this.selectedDivisionId,
        playoffs: this.includePlayoffs
      },
      queryParamsHandling: 'merge'
    });
    
    this.applyDivisionFilter();
  }
  
  getTotalPlayers(): number {
    return this.filteredGroupedStats.reduce((sum, group) => sum + group.stats.length, 0);
  }
  
  private processStatsForCurrentSeason(): void {
    if (!this.selectedSeasonId) return;
    
    combineLatest([
      this.allMatches$,
      this.allClubs$,
      this.divisions$
    ]).pipe(take(1)).subscribe(([matches, clubs, divisions]) => {
      // Filter divisions to only show those for the selected season, then deduplicate
      const seasonDivisions = this.selectedSeasonId 
        ? divisions.filter(d => d.seasonId === this.selectedSeasonId)
        : divisions;
      
      // Deduplicate divisions by _id to prevent duplicate dropdown entries
      const deduplicatedDivisions = seasonDivisions.filter((division, index, self) => 
        index === self.findIndex(d => d._id === division._id)
      );
      
      // Sort divisions by their order field (ascending)
      this.divisions = deduplicatedDivisions.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      this.processStats(matches, clubs, divisions);
    });
  }
  
  private processStats(matches: any[], clubs: Club[], divisions: Division[]): void {
    if (this.statsMode === 'tournament' && this.selectedTournamentId) {
      this.processTournamentStats(matches, clubs);
    } else if (this.selectedSeasonId) {
      this.processSpecificSeasonStats(matches, clubs, divisions);
    }
    
    this.applyDivisionFilter();
  }
  
  private processTournamentStats(matches: any[], clubs: Club[]): void {
    console.log('Processing tournament stats:', this.selectedTournamentId);
    
    // Filter matches to only include tournament games
    let filteredMatches = matches.filter(match => {
      return match.isTournament === true && match.tournamentId === this.selectedTournamentId;
    });
    
    // Tournaments don't have divisions, so use empty map
    const teamDivisionMap = new Map<string, string>();
    
    // Process stats for the filtered matches
    this.aggregatePlayerStats(filteredMatches, teamDivisionMap);
  }
  
  private processSpecificSeasonStats(matches: any[], clubs: Club[], divisions: Division[]): void {
    console.log('Processing specific season stats:', this.selectedSeasonId);
    
    // Filter matches to only include those from the specific season
    let filteredMatches = matches.filter(match => {
      return match.seasonId && match.seasonId === this.selectedSeasonId;
    });
    
    // Filter out playoff games unless includePlayoffs is true
    if (!this.includePlayoffs) {
      filteredMatches = filteredMatches.filter(match => !this.isPlayoffGame(match));
    }
    
    // Also filter out tournament games when in season mode
    filteredMatches = filteredMatches.filter(match => !match.isTournament);
    
    // Create team division map for the selected season
    const teamDivisionMap = new Map<string, string>();
    const divisionIdToNameMap = new Map<string, string>();
    divisions.forEach(d => divisionIdToNameMap.set(d._id, d.name));

    // First, try to get division info from club data
    clubs.forEach(club => {
      const seasonInfo = club.seasons?.find((s: any) => {
        if (typeof s.seasonId === 'object' && s.seasonId._id) {
          return s.seasonId._id === this.selectedSeasonId;
        } else if (typeof s.seasonId === 'string') {
          return s.seasonId === this.selectedSeasonId;
        }
        return false;
      });
      if (seasonInfo && seasonInfo.divisionIds && seasonInfo.divisionIds.length > 0) {
        const divisionId = seasonInfo.divisionIds[0];
        const divisionName = divisionIdToNameMap.get(divisionId);
        if (divisionName) {
          teamDivisionMap.set(club.name, divisionName);
        }
      }
    });

    // Then, try to get division info from match data as fallback
    filteredMatches.forEach(match => {
      // Check if home team division is available in match data
      if (match.homeClub?.name && !teamDivisionMap.has(match.homeClub.name)) {
        if (match.homeClub.divisionId) {
          const divisionName = divisionIdToNameMap.get(match.homeClub.divisionId);
          if (divisionName) {
            teamDivisionMap.set(match.homeClub.name, divisionName);
          }
        } else if (match.homeClub.division) {
          teamDivisionMap.set(match.homeClub.name, match.homeClub.division);
        }
      }
      
      // Check if away team division is available in match data
      if (match.awayClub?.name && !teamDivisionMap.has(match.awayClub.name)) {
        if (match.awayClub.divisionId) {
          const divisionName = divisionIdToNameMap.get(match.awayClub.divisionId);
          if (divisionName) {
            teamDivisionMap.set(match.awayClub.name, divisionName);
          }
        } else if (match.awayClub.division) {
          teamDivisionMap.set(match.awayClub.name, match.awayClub.division);
        }
      }
    });

    console.log('Team division mapping:', Array.from(teamDivisionMap.entries()));
    console.log('Looking for Flying Toasters in mapping:', teamDivisionMap.has('Flying Toasters'));
    console.log('Flying Toasters division:', teamDivisionMap.get('Flying Toasters'));
    
    // Check for case variations
    const allTeamNames = Array.from(teamDivisionMap.keys());
    const flyingToastersVariations = allTeamNames.filter(name => 
      name.toLowerCase().includes('flying') || name.toLowerCase().includes('toaster')
    );
    console.log('Teams containing "flying" or "toaster":', flyingToastersVariations);
    
    // Process stats for the filtered matches
    this.aggregatePlayerStats(filteredMatches, teamDivisionMap);
  }
  
  private aggregatePlayerStats(matches: any[], teamDivisionMap: Map<string, string>): void {
    console.log('Aggregating player stats for', matches.length, 'matches');
    
    // Fetch all players to build username-to-playerId map
    this.apiService.getAllPlayers().subscribe({
      next: (allPlayers) => {
        // Build username-to-playerId map from all players' usernames arrays
        const usernameToPlayerId = new Map<string, string>();
        const playerIdToPrimaryUsername = new Map<string, string>();
        
        allPlayers.forEach((player: any) => {
          const playerId = (player._id || player.id)?.toString();
          if (!playerId) return;
          
          let usernames: string[] = [];
          let primaryUsername = '';
          
          if (player.usernames && Array.isArray(player.usernames) && player.usernames.length > 0) {
            usernames = player.usernames.map((u: any) => {
              const username = typeof u === 'string' ? u : (u?.username || '');
              return username;
            }).filter(Boolean);
            primaryUsername = player.usernames.find((u: any) => u?.isPrimary)?.username || 
                             (typeof player.usernames[0] === 'string' ? player.usernames[0] : player.usernames[0]?.username) || 
                             '';
          } else if (player.gamertag) {
            usernames = [player.gamertag];
            primaryUsername = player.gamertag;
          }
          
          usernames.forEach(username => {
            if (username) {
              usernameToPlayerId.set(username.toLowerCase().trim(), playerId);
            }
          });
          
          if (primaryUsername) {
            playerIdToPrimaryUsername.set(playerId, primaryUsername);
          }
        });
        
        const statsMap = new Map<string, PlayerStats>(); // Key by playerId string
    const teamLogoMap = new Map<string, string | undefined>();

    // Create a map of team names to their logos from all matches
    matches.forEach(match => {
      if (match.homeTeam) teamLogoMap.set(match.homeTeam, this.getImageUrl(match.homeClub?.logoUrl));
      if (match.awayTeam) teamLogoMap.set(match.awayTeam, this.getImageUrl(match.awayClub?.logoUrl));
    });
    
    matches.forEach(match => {
          this.processMatchForPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap, usernameToPlayerId, playerIdToPrimaryUsername);
    });
    
    this.finalizePlayerStats(statsMap, teamDivisionMap);
      },
      error: (error) => {
        console.error('Error fetching players for username mapping:', error);
        // Fallback to old behavior if player fetch fails
        const statsMap = new Map<string, PlayerStats>();
        const teamLogoMap = new Map<string, string | undefined>();
        matches.forEach(match => {
          if (match.homeTeam) teamLogoMap.set(match.homeTeam, this.getImageUrl(match.homeClub?.logoUrl));
          if (match.awayTeam) teamLogoMap.set(match.awayTeam, this.getImageUrl(match.awayClub?.logoUrl));
        });
        matches.forEach(match => {
          this.processMatchForPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap, new Map(), new Map());
        });
        this.finalizePlayerStats(statsMap, teamDivisionMap);
      }
    });
  }
  
  private processMatchForPlayerStats(match: any, statsMap: Map<string, PlayerStats>, teamLogoMap: Map<string, string | undefined>, teamDivisionMap: Map<string, string>, usernameToPlayerId: Map<string, string>, playerIdToPrimaryUsername: Map<string, string>): void {
    // Skip if match has no relevant data
    if (!match.eashlData && !match.manualEntry) {
      return;
    }
    
    // Check for manual entry first
    if (match.manualEntry) {
      this.processManualPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap, usernameToPlayerId, playerIdToPrimaryUsername);
    } else if (match.eashlData?.players) {
      this.processEashlPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap, usernameToPlayerId, playerIdToPrimaryUsername);
    }
  }
  
  private processManualPlayerStats(match: any, statsMap: Map<string, PlayerStats>, teamLogoMap: Map<string, string | undefined>, teamDivisionMap: Map<string, string>, usernameToPlayerId: Map<string, string>, playerIdToPrimaryUsername: Map<string, string>): void {
    if (match.playerStats && match.playerStats.length > 0) {
      match.playerStats.forEach((playerData: any) => {
        if (!playerData.position || this.isGoalie(playerData.position)) {
          return; // Skip goalies
        }

        const teamName = playerData.team || 'Unknown';
        const playerName = playerData.name || 'Unknown';
        
        // Find playerId by matching username
        const normalizedName = playerName.toLowerCase().trim();
        const playerId = usernameToPlayerId.get(normalizedName) || playerName; // Fallback to name if not found
        const primaryUsername = playerIdToPrimaryUsername.get(playerId) || playerName;
        
        let existingStats = statsMap.get(playerId);

        if (!existingStats) {
          existingStats = this.createNewPlayerStats(playerId, primaryUsername, teamName, teamLogoMap, teamDivisionMap);
          statsMap.set(playerId, existingStats);
        }

        this.updatePlayerStats(existingStats, playerData);
      });
    }
  }
  
  private processEashlPlayerStats(match: any, statsMap: Map<string, PlayerStats>, teamLogoMap: Map<string, string | undefined>, teamDivisionMap: Map<string, string>, usernameToPlayerId: Map<string, string>, playerIdToPrimaryUsername: Map<string, string>): void {
    // Get the two teams from the match
    const homeTeam = match.homeClub?.name || match.homeTeam || 'Unknown';
    const awayTeam = match.awayClub?.name || match.awayTeam || 'Unknown';
    const homeEashlClubId = match.homeClub?.eashlClubId;
    const awayEashlClubId = match.awayClub?.eashlClubId;
    
    console.log('Processing EASHL stats for match:', {
      homeTeam,
      awayTeam,
      homeEashlClubId,
      awayEashlClubId,
      clubIds: Object.keys(match.eashlData.players)
    });
    
    // Process each club ID and assign players to teams
    Object.entries(match.eashlData.players).forEach(([clubId, clubPlayers]: [string, any]) => {
      if (typeof clubPlayers === 'object' && clubPlayers !== null) {
        // Determine which team this club ID belongs to
        let assignedTeam = this.determineTeamFromClubId(clubId, homeTeam, awayTeam, homeEashlClubId, awayEashlClubId);
        
        console.log(`Club ID ${clubId} assigned to team: ${assignedTeam}`);
        
        // Process all players in this club
        Object.entries(clubPlayers).forEach(([playerId, playerData]: [string, any]) => {
          if (!playerData.position || this.isGoalie(playerData.position)) {
            return; // Skip goalies
          }

          const playerName = playerData.playername || playerData.name || 'Unknown';
          
          // Find playerId by matching username
          const normalizedName = playerName.toLowerCase().trim();
          const dbPlayerId = usernameToPlayerId.get(normalizedName) || playerId; // Use EASHL playerId as fallback
          const primaryUsername = playerIdToPrimaryUsername.get(dbPlayerId) || playerName;
          
          let existingStats = statsMap.get(dbPlayerId);

          if (!existingStats) {
            existingStats = this.createNewPlayerStats(dbPlayerId, primaryUsername, assignedTeam, teamLogoMap, teamDivisionMap);
            statsMap.set(dbPlayerId, existingStats);
            
            // Debug logging for division assignment
            const assignedDivision = teamDivisionMap.get(assignedTeam) || 'Unknown';
            console.log(`Player ${primaryUsername} from team ${assignedTeam} assigned to division: ${assignedDivision}`);
          }

          this.updatePlayerStatsFromEashl(existingStats, playerData);
        });
      }
    });
  }
  
  private determineTeamFromClubId(clubId: string, homeTeam: string, awayTeam: string, homeEashlClubId?: string, awayEashlClubId?: string): string {
    // First try to match by EASHL club ID
    if (homeEashlClubId && clubId === homeEashlClubId) {
      console.log(`Club ID ${clubId} matches home team EASHL ID ${homeEashlClubId}`);
      return homeTeam;
    }
    
    if (awayEashlClubId && clubId === awayEashlClubId) {
      console.log(`Club ID ${clubId} matches away team EASHL ID ${awayEashlClubId}`);
      return awayTeam;
    }
    
    // If no EASHL club ID match, use a smarter fallback strategy
    console.log(`No EASHL club ID match for ${clubId}, using smart fallback assignment`);
    
    // Smart fallback: if we have one team that already matched and one that didn't,
    // assign the unmatched club ID to the team that didn't match
    if (homeEashlClubId && awayEashlClubId) {
      // Both teams have EASHL IDs, so this is an unknown club ID
      // Assign to away team as a default (since home team is often the "primary" team)
      console.log(`Unknown club ID ${clubId} assigned to away team ${awayTeam} as fallback`);
      return awayTeam;
    } else {
      // One or both teams don't have EASHL IDs, use simple fallback
      const clubIdNum = parseInt(clubId);
      if (clubIdNum % 2 === 0) {
        return homeTeam;
      } else {
        return awayTeam;
      }
    }
  }
  
  private createNewPlayerStats(playerKey: any, name: string, teamName: string, teamLogoMap: Map<string, string | undefined>, teamDivisionMap: Map<string, string>): PlayerStats {
    return {
      playerId: parseInt(playerKey) || 0,
      name: name,
      team: teamName,
      teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
      position: 'Unknown',
      division: teamDivisionMap.get(teamName) || 'Unknown',
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      points: 0,
      plusMinus: 0,
      shots: 0,
      hits: 0,
      blockedShots: 0,
      penaltyMinutes: 0,
      powerPlayGoals: 0,
      shortHandedGoals: 0,
      gameWinningGoals: 0,
      takeaways: 0,
      giveaways: 0,
      passAttempts: 0,
      passes: 0,
      passPercentage: 0,
      shotPercentage: 0,
      faceoffsWon: 0,
      faceoffsLost: 0,
      faceoffPercentage: 0,
      interceptions: 0
    };
  }
  
  private updatePlayerStats(existingStats: PlayerStats, playerData: any): void {
    existingStats.gamesPlayed++;
    
    // Track position frequency and update to most common position
    const currentPos = this.formatPosition(playerData.position);
    existingStats.position = currentPos;
    
    existingStats.goals += parseInt(playerData.goals) || 0;
    existingStats.assists += parseInt(playerData.assists) || 0;
    existingStats.points = existingStats.goals + existingStats.assists;
    existingStats.plusMinus += parseInt(playerData.plusMinus) || 0;
    
    existingStats.shots += parseInt(playerData.shots) || 0;
    existingStats.hits += parseInt(playerData.hits) || 0;
    existingStats.blockedShots += parseInt(playerData.blockedShots) || 0;
    existingStats.penaltyMinutes += parseInt(playerData.penaltyMinutes) || 0;
    existingStats.powerPlayGoals += parseInt(playerData.powerPlayGoals) || 0;
    existingStats.shortHandedGoals += parseInt(playerData.shortHandedGoals) || 0;
    existingStats.gameWinningGoals += parseInt(playerData.gameWinningGoals) || 0;
    existingStats.takeaways += parseInt(playerData.takeaways) || 0;
    existingStats.giveaways += parseInt(playerData.giveaways) || 0;
    existingStats.passAttempts += parseInt(playerData.passAttempts) || 0;
    existingStats.passes += parseInt(playerData.passes) || 0;
      existingStats.faceoffsWon += parseInt(playerData.faceoffsWon) || 0;
      existingStats.faceoffsLost += parseInt(playerData.faceoffsLost) || 0;
      existingStats.interceptions = (existingStats.interceptions ?? 0) + (parseInt(playerData.interceptions) || 0);
  }
  
  private updatePlayerStatsFromEashl(existingStats: PlayerStats, playerData: any): void {
    existingStats.gamesPlayed++;
    
    // Track position frequency and update to most common position
    const currentPos = this.formatPosition(playerData.position);
    existingStats.position = currentPos;
    
    existingStats.goals += parseInt(playerData.skgoals) || 0;
    existingStats.assists += parseInt(playerData.skassists) || 0;
    existingStats.points = existingStats.goals + existingStats.assists;
    existingStats.plusMinus += parseInt(playerData.skplusmin) || 0;
    
    existingStats.shots += parseInt(playerData.skshots) || 0;
    existingStats.hits += parseInt(playerData.skhits) || 0;
    existingStats.blockedShots += parseInt(playerData.skbs) || 0;
    existingStats.penaltyMinutes += parseInt(playerData.skpim) || 0;
    existingStats.powerPlayGoals += parseInt(playerData.skppg) || 0;
    existingStats.shortHandedGoals += parseInt(playerData.skshg) || 0;
    existingStats.gameWinningGoals += parseInt(playerData.skgwg) || 0;
    existingStats.takeaways += parseInt(playerData.sktakeaways) || 0;
    existingStats.giveaways += parseInt(playerData.skgiveaways) || 0;
    existingStats.passAttempts += parseInt(playerData.skpassattempts) || 0;
    existingStats.passes += parseInt(playerData.skpasses) || 0;
      existingStats.faceoffsWon += parseInt(playerData.skfow) || 0;
      existingStats.faceoffsLost += parseInt(playerData.skfol) || 0;
      existingStats.interceptions = (existingStats.interceptions ?? 0) + (parseInt(playerData.skint) || parseInt(playerData.skinterceptions) || 0);
  }
  
  private finalizePlayerStats(statsMap: Map<string, PlayerStats>, teamDivisionMap: Map<string, string>): void {
    console.log('Finalizing player stats for', statsMap.size, 'players');
    
    // Calculate percentages and ensure points are calculated correctly for all players
    statsMap.forEach(player => {
      player.points = player.goals + player.assists;
      
      // Calculate percentages
      if (player.shots > 0) {
        player.shotPercentage = parseFloat(((player.goals / player.shots) * 100).toFixed(1));
      }
      if (player.passAttempts > 0) {
        player.passPercentage = parseFloat(((player.passes / player.passAttempts) * 100).toFixed(1));
      }
      const totalFaceoffs = player.faceoffsWon + player.faceoffsLost;
      if (totalFaceoffs > 0) {
        player.faceoffPercentage = parseFloat(((player.faceoffsWon / totalFaceoffs) * 100).toFixed(1));
      }
    });
    
    // Convert stats map to grouped stats
    const allPlayerStats = Array.from(statsMap.values());
    
    // Group stats by division for the selected season
    const divisionStatsMap = new Map<string, PlayerStats[]>();
    allPlayerStats.forEach(stat => {
      const divisionName = stat.division || 'Unassigned';
      if (!divisionStatsMap.has(divisionName)) {
        divisionStatsMap.set(divisionName, []);
      }
      divisionStatsMap.get(divisionName)!.push(stat);
    });
    
    this.groupedStats = Array.from(divisionStatsMap.entries()).map(([division, stats]) => {
      const divisionData = this.divisions.find(d => d.name === division);
      return { 
        division, 
        divisionData,
        stats: [...stats].sort((a, b) => b.points - a.points || b.goals - a.goals) 
      };
    }).sort((a, b) => (a.divisionData?.order || 0) - (b.divisionData?.order || 0));
    
    console.log('Player stats finalized:', this.groupedStats.length, 'divisions');
    console.log('Division names:', this.groupedStats.map(g => g.division));
    
    // Check specifically for Flying Toasters players
    const flyingToastersPlayers = allPlayerStats.filter(p => p.team === 'Flying Toasters');
    if (flyingToastersPlayers.length > 0) {
      console.log('Flying Toasters players found:', flyingToastersPlayers.map(p => ({ name: p.name, team: p.team, division: p.division })));
    }
    
    // Apply division filter
    this.applyDivisionFilter();
    this.isLoading = false;
    // Force change detection for mobile rendering
    this.cdr.detectChanges();
    // Additional delayed change detection for mobile
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 500);
  }

  applyDivisionFilter(): void {
    if (this.selectedDivisionId === 'all-divisions') {
      this.filteredGroupedStats = [...this.groupedStats];
    } else {
      const selectedDivision = this.divisions.find(d => d._id === this.selectedDivisionId);
      if (selectedDivision) {
        this.filteredGroupedStats = this.groupedStats.filter(group => 
          group.division === selectedDivision.name
        );
      } else {
        this.filteredGroupedStats = [...this.groupedStats];
      }
    }
    
    console.log('Applied division filter:', {
      selectedDivisionId: this.selectedDivisionId,
      groupedStats: this.groupedStats.length,
      filteredStats: this.filteredGroupedStats.length,
      totalPlayers: this.filteredGroupedStats.reduce((sum, group) => sum + group.stats.length, 0)
    });
  }
  
  sortPlayerStats(stats: PlayerStats[], column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn = column;
    this.sortDirection = direction;
    
    stats.sort((a, b) => {
      let comparison = 0;
      
      switch (column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'team':
          comparison = a.team.localeCompare(b.team);
          break;
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
        case 'gamesPlayed':
          comparison = a.gamesPlayed - b.gamesPlayed;
          break;
        case 'goals':
          comparison = a.goals - b.goals;
          break;
        case 'assists':
          comparison = a.assists - b.assists;
          break;
        case 'points':
          comparison = a.points - b.points;
          break;
        case 'plusMinus':
          comparison = a.plusMinus - b.plusMinus;
          break;
        case 'shots':
          comparison = a.shots - b.shots;
          break;
        case 'hits':
          comparison = a.hits - b.hits;
          break;
        case 'blockedShots':
          comparison = a.blockedShots - b.blockedShots;
          break;
        case 'penaltyMinutes':
          comparison = a.penaltyMinutes - b.penaltyMinutes;
          break;
        case 'powerPlayGoals':
          comparison = a.powerPlayGoals - b.powerPlayGoals;
          break;
        case 'shortHandedGoals':
          comparison = a.shortHandedGoals - b.shortHandedGoals;
          break;
        case 'gameWinningGoals':
          comparison = a.gameWinningGoals - b.gameWinningGoals;
          break;
        case 'interceptions':
          comparison = (a.interceptions || 0) - (b.interceptions || 0);
          break;
        case 'takeaways':
          comparison = a.takeaways - b.takeaways;
          break;
        case 'giveaways':
          comparison = a.giveaways - b.giveaways;
          break;
        case 'passAttempts':
          comparison = a.passAttempts - b.passAttempts;
          break;
        case 'passes':
          comparison = a.passes - b.passes;
          break;
        case 'passPercentage':
          comparison = a.passPercentage - b.passPercentage;
          break;
        case 'shotPercentage':
          comparison = a.shotPercentage - b.shotPercentage;
          break;
        case 'faceoffsWon':
          comparison = a.faceoffsWon - b.faceoffsWon;
          break;
        case 'faceoffPercentage':
          comparison = a.faceoffPercentage - b.faceoffPercentage;
          break;
        default:
          comparison = a.points - b.points;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  }
  
  onSortColumn(column: string): void {
    const direction = this.sortColumn === column && this.sortDirection === 'desc' ? 'asc' : 'desc';
    
    this.groupedStats.forEach(group => {
      this.sortPlayerStats(group.stats, column, direction);
    });
  }
  
  getColumnSortClass(column: string): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'desc' ? 'sort-desc' : 'sort-asc';
  }

  private isGoalie(position: string | undefined | null): boolean {
    if (!position) return false;
    const lowerPos = position.toLowerCase().replace(/\s/g, '');
    return lowerPos === 'g' || lowerPos === 'goalie' || lowerPos === 'goaltender';
  }

  formatPosition(position: string): string {
    const positionMap: { [key: string]: string } = {
      'center': 'C',
      'leftwing': 'LW',
      'rightwing': 'RW',
      'defenseman': 'D',
      'defensemen': 'D',
      'goaltender': 'G',
      'goalie': 'G'
    };
    const key = position.toLowerCase().replace(/\s/g, '');
    return positionMap[key] || position;
  }

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl, 'assets/images/1ithlwords.png');
  }

  onImageError(event: any): void {
    console.log('Image failed to load, URL:', event.target.src);
    
    if (event.target.src.includes('square-default.png')) {
      console.log('Default image also failed to load, stopping error handling');
      return;
    }
    
    event.target.src = '/assets/images/square-default.png';
  }

  private isPlayoffGame(match: any): boolean {
    // Check if match is marked as playoff
    const isPlayoff = match.isPlayoff === true || match.isPlayoff === 'true' || match.isPlayoff === 1;
    
    // Check if match has playoff identifiers
    const hasPlayoffIds = match.playoffBracketId || match.playoffSeriesId || match.playoffRoundId;
    
    return isPlayoff || !!hasPlayoffIds;
  }

  onPlayoffFilterChange(): void {
    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        season: this.selectedSeasonId, 
        division: this.selectedDivisionId,
        playoffs: this.includePlayoffs
      },
      queryParamsHandling: 'merge'
    });
    
    // Reprocess stats with the new filter setting
    this.processStatsForCurrentSeason();
  }
}