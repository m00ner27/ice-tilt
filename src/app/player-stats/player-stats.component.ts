import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ApiService } from '../store/services/api.service';
import { ImageUrlService } from '../shared/services/image-url.service';

// Import selectors
import * as MatchesSelectors from '../store/matches.selectors';
import * as MatchesActions from '../store/matches.actions';
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
  imports: [CommonModule, FormsModule],
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
  selectedDivisionId: string = 'all-divisions';
  seasons: Season[] = [];
  divisions: Division[] = [];
  
  isLoading: boolean = true;
  sortColumn: string = 'points';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Subscription management
  private dataSubscription?: Subscription;
  
  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private apiService: ApiService,
    private imageUrlService: ImageUrlService
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
    console.log('[PlayerStats] ngOnInit - Component initialized, loading data with stats');
    this.loadInitialData();
  }
  
  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }
  
  loadInitialData(): void {
    this.isLoading = true;
    
    console.log('[PlayerStats] loadInitialData - STARTING - Component is loading data with stats');
    console.log('[PlayerStats] loadInitialData - Current time:', new Date().toISOString());
    
    // Clear old games cache to ensure we get fresh data with stats
    console.log('[PlayerStats] loadInitialData - Invalidating games cache...');
    this.apiService.invalidateGamesCache();
    console.log('[PlayerStats] loadInitialData - Games cache invalidated');
    
    // Clear matches from store to remove old data without player stats
    // This ensures we don't process stale matches before new data with stats arrives
    console.log('[PlayerStats] loadInitialData - Clearing matches from NgRx store...');
    this.store.dispatch(MatchesActions.clearMatches());
    console.log('[PlayerStats] loadInitialData - Matches cleared from store');
    
    // Load data using NgRx store
    // Use loadMatchesWithStats to get full player data needed for stats calculation
    console.log('[PlayerStats] loadInitialData - About to call ngrxApiService.loadMatchesWithStats()');
    console.log('[PlayerStats] loadInitialData - This should trigger the effect that calls /api/games?includeStats=true');
    this.ngrxApiService.loadMatchesWithStats();
    console.log('[PlayerStats] loadInitialData - Called ngrxApiService.loadMatchesWithStats() - action dispatched');
    this.ngrxApiService.loadClubs();
    this.ngrxApiService.loadSeasons();
    this.ngrxApiService.loadDivisions();
    
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
        console.log('[PlayerStats] Subscription - matches:', matches.length, 'loading:', loading, 'clubs:', clubs.length, 'seasons:', seasons.length);
        
        // Verify matches have player data before processing
        if (matches.length > 0) {
          const matchesWithPlayers = matches.filter(m => m.eashlData?.players);
          const matchesWithoutPlayers = matches.filter(m => !m.eashlData?.players && m.eashlData);
          console.log('[PlayerStats] Subscription - Matches with eashlData.players:', matchesWithPlayers.length);
          console.log('[PlayerStats] Subscription - Matches with eashlData but no players:', matchesWithoutPlayers.length);
          
          if (matches.length > 0 && matchesWithPlayers.length === 0 && matchesWithoutPlayers.length > 0) {
            console.warn('[PlayerStats] Subscription - WARNING: All matches lack player data! Sample match:', {
              id: matches[0].id || matches[0]._id,
              hasEashlData: !!matches[0].eashlData,
              hasPlayers: !!matches[0].eashlData?.players,
              eashlDataKeys: matches[0].eashlData ? Object.keys(matches[0].eashlData) : []
            });
            // Don't process if we don't have player data yet - wait for loadMatchesWithStats to complete
            if (loading) {
              console.log('[PlayerStats] Subscription - Still loading, waiting for matches with stats...');
              return;
            }
          }
        }
        
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
            
            // CRITICAL: Only process if we have matches with player data
            // If matches exist but none have player data, we're using stale data from store
            const matchesWithPlayers = matches.filter(m => m.eashlData?.players);
            const hasMatchesWithPlayers = matchesWithPlayers.length > 0;
            
            if (!hasMatchesWithPlayers && matches.length > 0) {
              console.error('[PlayerStats] Subscription - ERROR: Matches loaded but NONE have player data!');
              console.error('[PlayerStats] Subscription - This means loadMatchesWithStats() did not work or old data is in store');
              console.error('[PlayerStats] Subscription - Sample match structure:', {
                id: matches[0].id || matches[0]._id,
                hasEashlData: !!matches[0].eashlData,
                hasPlayers: !!matches[0].eashlData?.players,
                eashlDataKeys: matches[0].eashlData ? Object.keys(matches[0].eashlData) : [],
                eashlDataType: typeof matches[0].eashlData
              });
              // Don't process - wait for correct data
              console.warn('[PlayerStats] Subscription - Refusing to process stats without player data. Waiting for loadMatchesWithStats to complete...');
              return;
            }
            
            if (hasMatchesWithPlayers || matches.length === 0) {
              console.log('[PlayerStats] Subscription - Processing stats, matches with players:', matchesWithPlayers.length, 'out of', matches.length);
            this.processStats(matches, clubs, divisions);
            } else {
              console.warn('[PlayerStats] Subscription - Skipping stats processing - no matches with player data yet');
            }
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
    this.processStatsForCurrentSeason();
  }

  onDivisionChange(): void {
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
    console.log('[PlayerStats] processStats - Processing stats for season:', this.selectedSeasonId);
    console.log('[PlayerStats] processStats - Total matches:', matches.length);
    
    // Debug: Check sample matches for eashlData.players
    if (matches.length > 0) {
      const matchesWithPlayers = matches.filter(m => m.eashlData?.players);
      const matchesWithoutPlayers = matches.filter(m => !m.eashlData?.players && m.eashlData);
      console.log('[PlayerStats] processStats - Matches with eashlData.players:', matchesWithPlayers.length);
      console.log('[PlayerStats] processStats - Matches with eashlData but no players:', matchesWithoutPlayers.length);
      
      if (matches.length > 0) {
        const sampleMatch = matches[0];
        console.log('[PlayerStats] processStats - Sample match structure:', {
          id: sampleMatch.id || sampleMatch._id,
          hasEashlData: !!sampleMatch.eashlData,
          hasPlayers: !!sampleMatch.eashlData?.players,
          eashlDataKeys: sampleMatch.eashlData ? Object.keys(sampleMatch.eashlData) : []
        });
      }
    }
    
    if (this.selectedSeasonId) {
      this.processSpecificSeasonStats(matches, clubs, divisions);
    }
    
    this.applyDivisionFilter();
  }
  
  
  private processSpecificSeasonStats(matches: any[], clubs: Club[], divisions: Division[]): void {
    console.log('Processing specific season stats:', this.selectedSeasonId);
    
    // Filter matches to only include those from the specific season
    const filteredMatches = matches.filter(match => {
      return match.seasonId && match.seasonId === this.selectedSeasonId;
    });
    
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
    
    const statsMap = new Map<number, PlayerStats>();
    const teamLogoMap = new Map<string, string | undefined>();

    // Create a map of team names to their logos from all matches
    matches.forEach(match => {
      if (match.homeTeam) teamLogoMap.set(match.homeTeam, this.getImageUrl(match.homeClub?.logoUrl));
      if (match.awayTeam) teamLogoMap.set(match.awayTeam, this.getImageUrl(match.awayClub?.logoUrl));
    });
    
    matches.forEach(match => {
      this.processMatchForPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap);
    });
    
    this.finalizePlayerStats(statsMap, teamDivisionMap);
  }
  
  private processMatchForPlayerStats(match: any, statsMap: Map<number, PlayerStats>, teamLogoMap: Map<string, string | undefined>, teamDivisionMap: Map<string, string>): void {
    // Debug logging
    if (!match.eashlData && !match.manualEntry) {
      console.log('[PlayerStats] processMatchForPlayerStats - Skipping match (no eashlData or manualEntry):', match.id || match._id);
      return;
    }
    
    // Check for manual entry first
    if (match.manualEntry) {
      console.log('[PlayerStats] processMatchForPlayerStats - Processing manual entry match:', match.id || match._id);
      this.processManualPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap);
    } else if (match.eashlData?.players) {
      console.log('[PlayerStats] processMatchForPlayerStats - Processing EASHL match with players:', match.id || match._id, 'players count:', Object.keys(match.eashlData.players).length);
      this.processEashlPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap);
    } else {
      console.warn('[PlayerStats] processMatchForPlayerStats - Match has eashlData but no players:', match.id || match._id, 'eashlData keys:', match.eashlData ? Object.keys(match.eashlData) : 'no eashlData');
    }
  }
  
  private processManualPlayerStats(match: any, statsMap: Map<number, PlayerStats>, teamLogoMap: Map<string, string | undefined>, teamDivisionMap: Map<string, string>): void {
    if (match.playerStats && match.playerStats.length > 0) {
      match.playerStats.forEach((playerData: any) => {
        if (!playerData.position || this.isGoalie(playerData.position)) {
          return; // Skip goalies
        }

        const teamName = playerData.team || 'Unknown';
        const playerName = playerData.name || 'Unknown';
        
        // Try to find existing player by name first, then by ID
        let existingKey = null;
        for (const [key, stats] of Array.from(statsMap.entries())) {
          if (stats.name === playerName) {
            existingKey = key;
            break;
          }
        }
        
        const playerKey = existingKey || playerName;
        let existingStats = statsMap.get(playerKey);

        if (!existingStats) {
          existingStats = this.createNewPlayerStats(playerKey, playerName, teamName, teamLogoMap, teamDivisionMap);
          statsMap.set(playerKey, existingStats);
        }

        this.updatePlayerStats(existingStats, playerData);
      });
    }
  }
  
  private processEashlPlayerStats(match: any, statsMap: Map<number, PlayerStats>, teamLogoMap: Map<string, string | undefined>, teamDivisionMap: Map<string, string>): void {
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

          const playerName = playerData.playername || 'Unknown';
          const playerIdNum = parseInt(playerId);
          let existingStats = statsMap.get(playerIdNum);

          if (!existingStats) {
            existingStats = this.createNewPlayerStats(playerIdNum, playerName, assignedTeam, teamLogoMap, teamDivisionMap);
            statsMap.set(playerIdNum, existingStats);
            
            // Debug logging for division assignment
            const assignedDivision = teamDivisionMap.get(assignedTeam) || 'Unknown';
            console.log(`Player ${playerName} from team ${assignedTeam} assigned to division: ${assignedDivision}`);
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
      playerId: playerKey,
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
      faceoffPercentage: 0
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
  }
  
  private finalizePlayerStats(statsMap: Map<number, PlayerStats>, teamDivisionMap: Map<string, string>): void {
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
}