import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ApiService } from '../store/services/api.service';
import { ImageUrlService } from '../shared/services/image-url.service';

// Import selectors
import * as MatchesSelectors from '../store/matches.selectors';
import * as ClubsSelectors from '../store/clubs.selectors';
import * as SeasonsSelectors from '../store/seasons.selectors';
import * as DivisionsSelectors from '../store/divisions.selectors';

// Define interfaces
interface Season {
  _id: string;
  name: string;
  endDate: Date | string;
  startDate: Date | string;
  isActive: boolean;
  divisions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Division {
  _id: string;
  name: string;
  seasonId: string;
  logoUrl?: string;
  order?: number;
}

interface ClubSeasonInfo {
  seasonId: string | { _id: string; name: string };
  divisionIds?: string[];
  roster?: string[];
}

interface Club {
  name: string;
  seasons?: ClubSeasonInfo[];
}

interface PlayerStats {
  playerId: number;
  name: string;
  team: string;
  teamLogo?: string;
  number: number;
  position: string;
  positionCounts: { [position: string]: number };
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots: number;
  hits: number;
  blockedShots: number;
  penaltyMinutes: number;
  timeOnIce: string;
  powerPlayGoals: number;
  shortHandedGoals: number;
  gameWinningGoals: number;
  takeaways: number;
  giveaways: number;
  interceptions: number;
  passAttempts: number;
  passes: number;
  passPercentage: number;
  shotPercentage: number;
  faceoffsWon: number;
  faceoffsLost: number;
  faceoffPercentage: number;
  playerScore: number;
  possession: number;
  penaltyKillCorsiZone: number;
  penaltyAssists: number;
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
  imports: [CommonModule, RouterModule, FormsModule],
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
  isProcessing: boolean = false;
  processingProgress: number = 0;
  sortColumn: string = 'points';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Cache for processed stats
  private statsCache = new Map<string, GroupedPlayerStats[]>();
  private lastProcessedSeason: string | null = null;
  
  // Persistent cache using localStorage
  private readonly CACHE_KEY = 'player-stats-cache';
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  
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
    // Clear any invalid cache first
    this.clearInvalidCache();
    
    // Load from persistent cache first
    this.loadFromPersistentCache();
    
    this.loadInitialData();
    
    // Preload all-seasons data in background for instant switching
    setTimeout(() => {
      this.preloadAllSeasonsData();
    }, 2000); // Start preloading after 2 seconds
  }
  
  ngOnDestroy(): void {
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
      tap(([matches, clubs, seasons, divisions, matchesLoading, clubsLoading, seasonsLoading, divisionsLoading]) => {
        console.log('📊 Data loaded:', {
          matches: matches.length,
          clubs: clubs.length,
          seasons: seasons.length,
          divisions: divisions.length,
          loading: { matches: matchesLoading, clubs: clubsLoading, seasons: seasonsLoading, divisions: divisionsLoading }
        });
        
        // Debug matches specifically
        if (matches.length === 0 && !matchesLoading) {
          console.log('⚠️ No matches in store, checking store state...');
          this.store.select(MatchesSelectors.selectMatchesLoadingState).pipe(take(1)).subscribe(state => {
            console.log('🔍 Matches loading state:', state);
          });
        }
      }),
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
        console.log('📊 Data check:', { 
          loading, 
          matchesCount: matches.length, 
          clubsCount: clubs.length, 
          seasonsCount: seasons.length,
          divisionsCount: divisions.length 
        });
        
        if (!loading && clubs.length > 0 && seasons.length > 0) {
          this.isLoading = false;
          
          if (this.seasons.length === 0) {
            this.seasons = seasons;
            this.divisions = divisions;
            this.selectedSeasonId = 'all-seasons';
            
            // If no matches in store, try to load them directly
            if (matches.length === 0) {
              console.log('⚠️ No matches found in store, attempting direct load...');
              this.loadMatchesDirectly();
            } else {
              this.processStats(matches, clubs, divisions);
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
  
  // Method to manually clear cache (can be called from browser console)
  clearCache(): void {
    console.log('🗑️ Manually clearing all caches...');
    localStorage.removeItem(this.CACHE_KEY);
    this.statsCache.clear();
    this.groupedStats = [];
    this.filteredGroupedStats = [];
    this.isLoading = true;
    this.loadInitialData();
  }
  
  private loadFromPersistentCache(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid AND has actual data
        if (data.timestamp && (now - data.timestamp) < this.CACHE_EXPIRY && data.stats && data.stats.length > 0) {
          // Check if the cached data has actual players
          const hasPlayers = data.stats.some((group: any) => group.stats && group.stats.length > 0);
          if (hasPlayers) {
            console.log('📦 Loading from persistent cache');
            this.statsCache.set('all-seasons', data.stats);
            this.groupedStats = data.stats;
            this.applyDivisionFilter();
            this.isLoading = false;
            return;
          } else {
            console.log('🗑️ Cache has no players, clearing...');
            localStorage.removeItem(this.CACHE_KEY);
          }
        } else {
          console.log('⏰ Cache expired or invalid, clearing...');
          localStorage.removeItem(this.CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
      localStorage.removeItem(this.CACHE_KEY);
    }
  }
  
  private saveToPersistentCache(): void {
    try {
      const data = {
        timestamp: Date.now(),
        stats: this.groupedStats
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      console.log('💾 Saved to persistent cache');
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }
  
  private clearInvalidCache(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache has no players or invalid data
        const hasValidPlayers = data.stats && data.stats.some((group: any) => 
          group.stats && group.stats.length > 0
        );
        
        if (!hasValidPlayers) {
          console.log('🗑️ Clearing invalid cache with no players');
          localStorage.removeItem(this.CACHE_KEY);
          this.statsCache.clear();
        }
      }
    } catch (error) {
      console.error('Error checking cache validity:', error);
      localStorage.removeItem(this.CACHE_KEY);
      this.statsCache.clear();
    }
  }
  
  private preloadAllSeasonsData(): void {
    // Only preload if not already cached
    if (!this.statsCache.has('all-seasons')) {
      console.log('🔄 Preloading all-seasons data in background...');
      combineLatest([this.allMatches$, this.allClubs$, this.divisions$]).pipe(take(1)).subscribe(([matches, clubs, divisions]) => {
        if (matches.length > 0 && clubs.length > 0 && divisions.length > 0) {
          // Process in background without showing loading states
          this.processAllSeasonsStats(matches, clubs, divisions);
          this.statsCache.set('all-seasons', this.groupedStats);
          console.log('✅ All-seasons data preloaded and cached');
        }
      });
    }
  }
  
  private loadMatchesDirectly(): void {
    console.log('🔄 Loading matches directly from API...');
    this.apiService.getGames().subscribe({
      next: (matches: any[]) => {
        console.log('📊 Direct matches loaded:', matches.length);
        if (matches.length > 0) {
          // Get current data from observables
          combineLatest([this.allClubs$, this.divisions$]).pipe(take(1)).subscribe(([clubs, divisions]) => {
            this.processStats(matches, clubs, divisions);
          });
        } else {
          console.log('⚠️ Still no matches found after direct load');
          combineLatest([this.allClubs$, this.divisions$]).pipe(take(1)).subscribe(([clubs, divisions]) => {
            this.processStats([], clubs, divisions);
          });
        }
      },
      error: (err: any) => {
        console.error('Failed to load matches directly', err);
        combineLatest([this.allClubs$, this.divisions$]).pipe(take(1)).subscribe(([clubs, divisions]) => {
          this.processStats([], clubs, divisions);
        });
      }
    });
  }
  
  private processStatsForCurrentSeason(): void {
    if (!this.selectedSeasonId) return;
    
    // Check cache first
    if (this.statsCache.has(this.selectedSeasonId) && this.lastProcessedSeason === this.selectedSeasonId) {
      console.log('📋 Using cached stats for season:', this.selectedSeasonId);
      this.groupedStats = this.statsCache.get(this.selectedSeasonId)!;
      this.applyDivisionFilter();
      return;
    }
    
    // Get fresh data
    combineLatest([
      this.allMatches$,
      this.allClubs$,
      this.divisions$
    ]).pipe(take(1)).subscribe(([matches, clubs, divisions]) => {
      this.processStats(matches, clubs, divisions);
    });
  }
  
  private processStats(matches: any[], clubs: Club[], divisions: Division[]): void {
    console.log('🔄 Processing stats for season:', this.selectedSeasonId);
    
    // Check cache first
    const cacheKey = this.selectedSeasonId || 'all-seasons';
    if (this.statsCache.has(cacheKey)) {
      const cachedStats = this.statsCache.get(cacheKey)!;
      // Verify cached data has actual players
      const hasPlayers = cachedStats.some(group => group.stats && group.stats.length > 0);
      if (hasPlayers) {
        console.log('📦 Using cached stats for season:', cacheKey);
        this.groupedStats = cachedStats;
        this.applyDivisionFilter();
        this.isLoading = false;
        return;
      } else {
        console.log('🗑️ Cached stats are empty, reprocessing...');
        this.statsCache.delete(cacheKey);
      }
    }
    
    if (this.selectedSeasonId === 'all-seasons') {
      this.processAllSeasonsStats(matches, clubs, divisions);
    } else {
      this.processSpecificSeasonStats(matches, clubs, divisions);
    }
    
    // Cache the results
    this.statsCache.set(this.selectedSeasonId!, this.groupedStats);
    this.lastProcessedSeason = this.selectedSeasonId;
    
    this.applyDivisionFilter();
  }
  
  private processAllSeasonsStats(matches: any[], clubs: Club[], divisions: Division[]): void {
    console.log('🌍 Processing ALL SEASONS stats');
    
    // Create team division map for all seasons
    const teamDivisionMap = new Map<string, string>();
    const divisionIdToNameMap = new Map<string, string>();
    divisions.forEach(d => divisionIdToNameMap.set(d._id, d.name));

    clubs.forEach(club => {
      if (club.seasons && club.seasons.length > 0) {
        const firstSeason = club.seasons[0];
        if (firstSeason.divisionIds && firstSeason.divisionIds.length > 0) {
          const divisionId = firstSeason.divisionIds[0];
          const divisionName = divisionIdToNameMap.get(divisionId);
          if (divisionName) {
            teamDivisionMap.set(club.name, divisionName);
          }
        }
      }
    });
    
    // Filter matches for all seasons
    const filteredMatches = matches.filter(match => {
      // Check if match has any player data (either eashlData or manualEntry)
      return (match.eashlData && match.eashlData.players && match.eashlData.players.length > 0) ||
             (match.manualEntry && match.manualEntry.players && match.manualEntry.players.length > 0);
    });
    
    
    // For initial load, show a smaller subset for faster display
    if (this.isLoading && filteredMatches.length > 20) {
      const subsetMatches = filteredMatches.slice(0, 20); // Process first 20 matches
      this.aggregatePlayerStats(subsetMatches, teamDivisionMap);
      
      // Process remaining matches in background
      setTimeout(() => {
        this.aggregatePlayerStats(filteredMatches, teamDivisionMap);
      }, 500);
    } else {
      // Process all matches normally
      this.aggregatePlayerStats(filteredMatches, teamDivisionMap);
    }
  }
  
  private processSpecificSeasonStats(matches: any[], clubs: Club[], divisions: Division[]): void {
    console.log('🎯 Processing specific season stats:', this.selectedSeasonId);
    
    // Filter matches and clubs for the specific season
    const seasonTeams = new Set<string>();
    clubs.forEach(club => {
      const seasonInfo = club.seasons?.find((s: ClubSeasonInfo) => {
        if (typeof s.seasonId === 'object' && s.seasonId._id) {
          return s.seasonId._id === this.selectedSeasonId;
        } else if (typeof s.seasonId === 'string') {
          return s.seasonId === this.selectedSeasonId;
        }
        return false;
      });
      if (seasonInfo) {
        seasonTeams.add(club.name);
      }
    });
    
    // Filter matches to only include those from the specific season
    const filteredMatches = matches.filter(match => {
      if (match.seasonId && match.seasonId === this.selectedSeasonId) {
        const homeTeamInSeason = match.homeClub?.name && seasonTeams.has(match.homeClub.name);
        const awayTeamInSeason = match.awayClub?.name && seasonTeams.has(match.awayClub.name);
        return homeTeamInSeason || awayTeamInSeason;
      }
      return false;
    });
    
    // Create team division map for the selected season
    const teamDivisionMap = new Map<string, string>();
    const divisionIdToNameMap = new Map<string, string>();
    divisions.forEach(d => divisionIdToNameMap.set(d._id, d.name));

    clubs.forEach(club => {
      if (!seasonTeams.has(club.name)) return;

      const seasonInfo = club.seasons?.find((s: ClubSeasonInfo) => {
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
    
    // Process stats for the filtered matches
    this.aggregatePlayerStats(filteredMatches, teamDivisionMap);
  }
  
  private aggregatePlayerStats(matches: any[], teamDivisionMap: Map<string, string>): void {
    console.log('⚡ Aggregating player stats for', matches.length, 'matches');
    
    const statsMap = new Map<number, PlayerStats>();
    const teamLogoMap = new Map<string, string | undefined>();

    // Create a map of team names to their logos from all matches
    matches.forEach(match => {
      if (match.homeTeam) teamLogoMap.set(match.homeTeam, this.getImageUrl(match.homeClub?.logoUrl));
      if (match.awayTeam) teamLogoMap.set(match.awayTeam, this.getImageUrl(match.awayClub?.logoUrl));
    });
    
    // For small datasets, process immediately
    if (matches.length <= 20) {
      console.log('⚡ Small dataset, processing immediately');
      matches.forEach(match => {
        this.processMatchForPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap);
      });
      this.finalizePlayerStats(statsMap, teamDivisionMap);
    } else {
      // Process matches in batches to avoid blocking the UI
      this.processMatchesInBatches(matches, statsMap, teamLogoMap, teamDivisionMap);
    }
  }
  
  private processMatchesInBatches(matches: any[], statsMap: Map<number, PlayerStats>, teamLogoMap: Map<string, string | undefined>, teamDivisionMap: Map<string, string>): void {
    const batchSize = 20; // Process 20 matches at a time for maximum performance
    let currentIndex = 0;
    let updateCounter = 0;
    
    console.log(`🔄 Starting batch processing: ${matches.length} matches in batches of ${batchSize}`);
    this.isProcessing = true;
    this.processingProgress = 0;
    
    const processBatch = () => {
      const batch = matches.slice(currentIndex, currentIndex + batchSize);
      const progress = Math.round((currentIndex / matches.length) * 100);
      
      console.log(`📊 Processing batch ${Math.floor(currentIndex / batchSize) + 1}: matches ${currentIndex + 1}-${Math.min(currentIndex + batchSize, matches.length)} (${progress}%)`);
      
      // Update progress for UI
      this.processingProgress = progress;
      
      // Process batch
      batch.forEach(match => {
        this.processMatchForPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap);
      });
      
      currentIndex += batchSize;
      updateCounter++;
      
      // Update UI with partial results every batch for maximum responsiveness
      if (currentIndex < matches.length) {
        this.updatePartialResults(statsMap, teamDivisionMap);
        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
          setTimeout(processBatch, 0); // No delay for maximum speed
        });
      } else {
        // All matches processed, finalize stats
        console.log('✅ All batches processed, finalizing stats...');
        this.isProcessing = false;
        this.processingProgress = 100;
        this.finalizePlayerStats(statsMap, teamDivisionMap);
      }
    };
    
    // Start processing immediately
    processBatch();
  }
  
  private updatePartialResults(statsMap: Map<number, PlayerStats>, teamDivisionMap: Map<string, string>): void {
    // Create a temporary stats array for partial results
    const tempStats = Array.from(statsMap.values());
    
    if (tempStats.length > 0) {
      // Show partial results with a limited number of players for better performance
      const limitedStats = tempStats.slice(0, 200); // Show first 200 players
      
      this.groupedStats = [{
        division: 'All Seasons (Loading...)',
        divisionData: undefined,
        stats: [...limitedStats].sort((a, b) => b.points - a.points || b.goals - a.goals)
      }];
      
      this.applyDivisionFilter();
    }
  }
  
  private processMatchForPlayerStats(match: any, statsMap: Map<number, PlayerStats>, teamLogoMap: Map<string, string | undefined>, teamDivisionMap: Map<string, string>): void {
    // Skip if match has no relevant data
    if (!match.eashlData && !match.manualEntry) {
      return;
    }
    
    
    // Check for manual entry first
    if (match.manualEntry) {
      this.processManualPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap);
    } else if (match.eashlData?.players) {
      this.processEashlPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap);
    } else if (match.eashlData?.manualEntry) {
      // Handle eashlData with manualEntry flag
      this.processManualPlayerStats(match, statsMap, teamLogoMap, teamDivisionMap);
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
    Object.entries(match.eashlData.players).forEach(([clubId, clubPlayers]: [string, any]) => {
      // Map club ID to team name
      let teamName = 'Unknown';
      if (match.homeClub?.eashlClubId === clubId) {
        teamName = match.homeClub.name;
      } else if (match.awayClub?.eashlClubId === clubId) {
        teamName = match.awayClub.name;
      }
      
      if (typeof clubPlayers === 'object' && clubPlayers !== null) {
        Object.entries(clubPlayers).forEach(([playerId, playerData]: [string, any]) => {
          if (!playerData.position || this.isGoalie(playerData.position)) {
            return; // Skip goalies
          }

          const playerIdNum = parseInt(playerId);
          let existingStats = statsMap.get(playerIdNum);

          if (!existingStats) {
            existingStats = this.createNewPlayerStats(playerIdNum, playerData.playername || 'Unknown', teamName, teamLogoMap, teamDivisionMap);
            statsMap.set(playerIdNum, existingStats);
          }

          this.updatePlayerStatsFromEashl(existingStats, playerData);
        });
      }
    });
  }
  
  private createNewPlayerStats(playerKey: any, name: string, teamName: string, teamLogoMap: Map<string, string | undefined>, teamDivisionMap: Map<string, string>): PlayerStats {
    return {
      playerId: playerKey,
      name: name,
      team: teamName,
      teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
      number: 0,
      position: 'Unknown',
      positionCounts: {},
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
      timeOnIce: '0:00',
      powerPlayGoals: 0,
      shortHandedGoals: 0,
      gameWinningGoals: 0,
      takeaways: 0,
      giveaways: 0,
      interceptions: 0,
      passAttempts: 0,
      passes: 0,
      passPercentage: 0,
      shotPercentage: 0,
      faceoffsWon: 0,
      faceoffsLost: 0,
      faceoffPercentage: 0,
      playerScore: 0,
      possession: 0,
      penaltyKillCorsiZone: 0,
      penaltyAssists: 0
    };
  }
  
  private updatePlayerStats(existingStats: PlayerStats, playerData: any): void {
    existingStats.gamesPlayed++;
    
    // Track position frequency and update to most common position
    const currentPos = this.formatPosition(playerData.position);
    existingStats.positionCounts[currentPos] = (existingStats.positionCounts[currentPos] || 0) + 1;
    existingStats.position = this.getMostCommonPosition(existingStats.positionCounts);
    
    existingStats.goals += parseInt(playerData.goals) || 0;
    existingStats.assists += parseInt(playerData.assists) || 0;
    existingStats.points = existingStats.goals + existingStats.assists;
    existingStats.plusMinus += parseInt(playerData.plusMinus) || 0;
    
    existingStats.shots += parseInt(playerData.shots) || 0;
    existingStats.hits += parseInt(playerData.hits) || 0;
    existingStats.blockedShots += parseInt(playerData.blockedShots) || 0;
    existingStats.penaltyMinutes += parseInt(playerData.penaltyMinutes) || 0;
    existingStats.timeOnIce = playerData.timeOnIce || '0:00';
    existingStats.powerPlayGoals += parseInt(playerData.powerPlayGoals) || 0;
    existingStats.shortHandedGoals += parseInt(playerData.shortHandedGoals) || 0;
    existingStats.gameWinningGoals += parseInt(playerData.gameWinningGoals) || 0;
    existingStats.takeaways += parseInt(playerData.takeaways) || 0;
    existingStats.giveaways += parseInt(playerData.giveaways) || 0;
    existingStats.interceptions += parseInt(playerData.interceptions) || 0;
    existingStats.passAttempts += parseInt(playerData.passAttempts) || 0;
    existingStats.passes += parseInt(playerData.passes) || 0;
    existingStats.playerScore += parseInt(playerData.score) || 0;
    existingStats.possession += parseInt(playerData.possession) || 0;
    existingStats.faceoffsWon += parseInt(playerData.faceoffsWon) || 0;
    existingStats.faceoffsLost += parseInt(playerData.faceoffsLost) || 0;
    existingStats.penaltyKillCorsiZone += parseInt(playerData.penaltyKillCorsiZone) || 0;
    existingStats.penaltyAssists += parseInt(playerData.penaltyAssists) || 0;
  }
  
  private updatePlayerStatsFromEashl(existingStats: PlayerStats, playerData: any): void {
    existingStats.gamesPlayed++;
    
    // Track position frequency and update to most common position
    const currentPos = this.formatPosition(playerData.position);
    existingStats.positionCounts[currentPos] = (existingStats.positionCounts[currentPos] || 0) + 1;
    existingStats.position = this.getMostCommonPosition(existingStats.positionCounts);
    
    existingStats.goals += parseInt(playerData.skgoals) || 0;
    existingStats.assists += parseInt(playerData.skassists) || 0;
    existingStats.points = existingStats.goals + existingStats.assists;
    existingStats.plusMinus += parseInt(playerData.skplusmin) || 0;
    
    existingStats.shots += parseInt(playerData.skshots) || 0;
    existingStats.hits += parseInt(playerData.skhits) || 0;
    existingStats.blockedShots += parseInt(playerData.skbs) || 0;
    existingStats.penaltyMinutes += parseInt(playerData.skpim) || 0;
    existingStats.timeOnIce = playerData.sktoi || '0:00';
    existingStats.powerPlayGoals += parseInt(playerData.skppg) || 0;
    existingStats.shortHandedGoals += parseInt(playerData.skshg) || 0;
    existingStats.gameWinningGoals += parseInt(playerData.skgwg) || 0;
    existingStats.takeaways += parseInt(playerData.sktakeaways) || 0;
    existingStats.giveaways += parseInt(playerData.skgiveaways) || 0;
    existingStats.interceptions += parseInt(playerData.skint) || 0;
    existingStats.passAttempts += parseInt(playerData.skpassattempts) || 0;
    existingStats.passes += parseInt(playerData.skpasses) || 0;
    existingStats.playerScore += parseInt(playerData.score) || 0;
    existingStats.possession += parseInt(playerData.skpossession) || 0;
    existingStats.faceoffsWon += parseInt(playerData.skfow) || 0;
    existingStats.faceoffsLost += parseInt(playerData.skfol) || 0;
    existingStats.penaltyKillCorsiZone += parseInt(playerData.skpkc) || 0;
    existingStats.penaltyAssists += 0; // Not available in EASHL data
  }
  
  private finalizePlayerStats(statsMap: Map<number, PlayerStats>, teamDivisionMap: Map<string, string>): void {
    console.log('🏁 Finalizing player stats for', statsMap.size, 'players');
    
    // Use requestAnimationFrame to ensure UI updates smoothly
    requestAnimationFrame(() => {
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
      
      if (this.selectedSeasonId === 'all-seasons') {
        // For "All Seasons", show as one combined table
        this.groupedStats = [{
          division: 'All Seasons',
          divisionData: undefined,
          stats: [...allPlayerStats].sort((a, b) => b.points - a.points || b.goals - a.goals)
        }];
      } else {
        // Group stats by division for specific season
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
      }
      
      console.log('✅ Player stats finalized:', this.groupedStats.length, 'divisions');
      console.log('📊 Sample stats:', this.groupedStats[0]?.stats.slice(0, 3));
      
      // Save to persistent cache
      this.saveToPersistentCache();
      
      // Apply division filter and trigger change detection
      this.applyDivisionFilter();
      this.isLoading = false;
    });
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
    
    console.log('🔍 Applied division filter:', {
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
        case 'interceptions':
          comparison = a.interceptions - b.interceptions;
          break;
        case 'timeOnIce':
          const timeA = this.parseTimeToMinutes(a.timeOnIce);
          const timeB = this.parseTimeToMinutes(b.timeOnIce);
          comparison = timeA - timeB;
          break;
        case 'penaltyAssists':
          comparison = a.penaltyAssists - b.penaltyAssists;
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

  private getMostCommonPosition(positionCounts: { [position: string]: number }): string {
    let mostCommon = '';
    let maxCount = 0;
    
    for (const [position, count] of Object.entries(positionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = position;
      }
    }
    
    return mostCommon || 'Unknown';
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

  private parseTimeToMinutes(timeStr: string): number {
    if (!timeStr || timeStr === '0:00' || timeStr === 'N/A') {
      return 0;
    }
    
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes + (seconds / 60);
    }
    
    return 0;
  }
}