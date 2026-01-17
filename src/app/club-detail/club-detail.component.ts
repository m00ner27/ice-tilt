import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, filter, debounceTime, take } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ApiService } from '../store/services/api.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ClubStatsService, SkaterStats, GoalieStats } from './services/club-stats.service';
import { MatchHistoryComponent } from './match-history/match-history.component';
import { ClubHeaderComponent } from './club-header/club-header.component';
import { ClubStatsGridComponent } from './club-stats-grid/club-stats-grid.component';
import { ClubRosterTablesComponent } from './club-roster-tables/club-roster-tables.component';
import { ClubStatLegendComponent } from './club-stat-legend/club-stat-legend.component';
import { Club } from '../store/models/models/club.interface';
import { AdSenseComponent, AdSenseConfig } from '../components/adsense/adsense.component';

// Import selectors and actions
import * as ClubsSelectors from '../store/clubs.selectors';
import * as ClubsActions from '../store/clubs.actions';
import * as MatchesSelectors from '../store/matches.selectors';
import * as SeasonsSelectors from '../store/seasons.selectors';

// Updated interface to match backend Club model
interface BackendClub {
  _id: string;
  name: string;
  logoUrl?: string;
  manager: string;
  primaryColour?: string;
  seasons?: any[];
  roster?: any[];
  eashlClubId?: string;
}

// Season interface for the selector
interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-club-detail-simple',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatchHistoryComponent, ClubHeaderComponent, ClubStatsGridComponent, ClubRosterTablesComponent, ClubStatLegendComponent, AdSenseComponent],
  templateUrl: './club-detail.component.html',
  styleUrls: ['./club-detail.component.css']
})
export class ClubDetailSimpleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private rosterSubscription$ = new Subject<void>();
  
  // Observable selectors
  selectedClub$: Observable<Club | null>;
  allClubs$: Observable<any[]>;
  matches$: Observable<any[]>;
  seasons$: Observable<any[]>;
  clubsLoading$: Observable<boolean>;
  clubsError$: Observable<any>;
  clubRoster$: Observable<any[]>;
  
  // Local state
  club: Club | undefined;
  backendClub: BackendClub | null = null;
  allClubs: BackendClub[] = [];
  seasons: any[] = [];
  selectedSeasonId: string = '';
  cachedClubSeasons: any[] = []; // Cache sorted seasons to avoid re-sorting on every change detection
  loading: boolean = false;
  error: string | null = null;
  currentClubId: string = '';
  
  // Progressive loading states
  clubLoaded: boolean = false;
  matchesLoaded: boolean = false;
  rosterLoaded: boolean = false;
  
  // Additional properties for template
  signedPlayers: any[] = [];
      skaterStats: SkaterStats[] = [];
      goalieStats: GoalieStats[] = [];
  matches: any[] = [];
  clubMatches: any[] = [];
  // Playoff stats arrays
  playoffClubMatches: any[] = [];
  playoffSkaterStats: SkaterStats[] = [];
  playoffGoalieStats: GoalieStats[] = [];
  
  // Loading state for stats processing
  isProcessingStats: boolean = false;
      
  // Track if we're switching clubs to prevent stale data
  private isSwitchingClubs: boolean = false;

  // AdSense configuration
  rectangleAdConfig: AdSenseConfig = {
    adSlot: '8840984486', // Your actual ad unit ID
    adFormat: 'rectangle',
    adStyle: {
      display: 'block',
      width: '300px',
      height: '250px'
    },
    responsive: true,
    className: 'rectangle-ad'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private apiService: ApiService,
    private imageUrlService: ImageUrlService,
    private clubStatsService: ClubStatsService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize selectors
    this.selectedClub$ = this.store.select(ClubsSelectors.selectSelectedClub);
    this.allClubs$ = this.store.select(ClubsSelectors.selectAllClubs);
    this.matches$ = this.store.select(MatchesSelectors.selectAllMatches);
    this.seasons$ = this.store.select(SeasonsSelectors.selectAllSeasons);
    this.clubsLoading$ = this.store.select(ClubsSelectors.selectClubsLoading);
    this.clubsError$ = this.store.select(ClubsSelectors.selectClubsError);
    this.clubRoster$ = this.store.select(ClubsSelectors.selectClubRoster(''));
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const clubId = params['id'];
      console.log('Route params changed - new clubId:', clubId, 'current clubId:', this.currentClubId);
      if (clubId && clubId !== this.currentClubId) {
        console.log('Switching to different club, clearing data');
            console.log('Previous clubId:', this.currentClubId, 'New clubId:', clubId);
            
            // Set flag to prevent stale data processing
            this.isSwitchingClubs = true;
            
            // Clear stats immediately when switching clubs
            this.skaterStats = [];
            this.goalieStats = [];
            this.signedPlayers = [];
            this.clubMatches = [];
            this.cdr.detectChanges();
            
        // Clear previous club data when switching to a different club
        this.clearClubData();
        this.loadClubData(clubId);
      }
    });
    
    this.setupDataSubscriptions();
    
    // Listen for storage events (when players are added/removed from other components)
    window.addEventListener('storage', (event) => {
      if (event.key === 'admin-data-updated' || event.key === 'roster-updated') {
        console.log('Roster data updated, refreshing...');
        this.refreshRoster();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    // Get the season from query parameters if available
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      const season = params['season'];
      if (season) {
        this.router.navigate(['/standings'], { queryParams: { season: season } });
      } else {
        this.router.navigate(['/standings']);
      }
    });
  }

  private setupDataSubscriptions() {
    // Subscribe to selected club changes
    this.selectedClub$.pipe(takeUntil(this.destroy$)).subscribe(club => {
      if (club) {
        console.log('Selected club changed:', club.name);
        
        // Clear previous data when switching clubs
        if (this.isSwitchingClubs) {
          console.log('Switching clubs - clearing previous data');
        this.skaterStats = [];
        this.goalieStats = [];
          this.signedPlayers = [];
          this.clubMatches = [];
          this.isSwitchingClubs = false;
          // Force UI update after clearing data
          this.cdr.detectChanges();
        }
        
        this.backendClub = club as any;
        this.club = this.mapBackendClubToFrontend(club);
        
        // Update cached club seasons when club changes
        this.updateCachedClubSeasons();
        
        // Update club roster selector for the new club
        this.clubRoster$ = this.store.select(ClubsSelectors.selectClubRoster(club._id));
        
        // Set up roster subscription for the new club
        this.setupRosterSubscription();
        
        // Reset season selection for the new club
        this.selectedSeasonId = '';
        
        // Set up combined observable to wait for roster data
        this.setupCombinedDataSubscription();
        
        // Trigger season selection now that we have the club data
        this.selectSeasonForClub();
      }
    });

    // Subscribe to all clubs for opponent name resolution
    this.allClubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
      this.allClubs = clubs as BackendClub[];
    });

    // Subscribe to seasons
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      this.seasons = seasons;
      
      // Update cached club seasons when seasons change
      this.updateCachedClubSeasons();
      
      // Only try to select a season if we don't have one selected yet
      if (!this.selectedSeasonId) {
        this.selectSeasonForClub();
      }
    });

    // Matches subscription is now handled by the combined data subscription

    // Subscribe to loading and error states
    this.clubsLoading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });

    this.clubsError$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.error = error;
    });

    // Subscribe to club roster data - this will be updated when club changes
    this.setupRosterSubscription();
  }

  private loadClubData(clubId: string) {
    this.loading = true;
    this.error = null;
    this.currentClubId = clubId;
    
    // Update the club roster selector with the current club ID
    this.clubRoster$ = this.store.select(ClubsSelectors.selectClubRoster(clubId));
    
    // Load only essential data first - just the specific club
    this.ngrxApiService.loadClub(clubId);
    
    // Load other data in parallel (non-blocking)
    this.loadAdditionalDataInBackground();
  }

  private loadAdditionalDataInBackground() {
    // Load seasons (still needed for season selector)
    this.ngrxApiService.loadSeasons();
    // Don't load all matches anymore - we'll use optimized endpoints
  }

  selectSeasonForClub() {
    // Only auto-select if we don't have a season selected yet
    if (this.selectedSeasonId) {
      return;
    }
    
    // Update cached seasons first
    this.updateCachedClubSeasons();
    
    // Get the filtered seasons for this club (from cache)
    const clubSeasons = this.cachedClubSeasons;
    
    if (clubSeasons.length > 0) {
      // Select the first season the club participates in (newest first)
      const firstClubSeason = clubSeasons[0];
      this.selectedSeasonId = firstClubSeason._id;
      console.log('Auto-selected season:', firstClubSeason.name, firstClubSeason._id);
      if (this.backendClub) {
        this.ngrxApiService.loadClubRoster(this.backendClub._id, this.selectedSeasonId);
        // Load optimized data for auto-selected season
        this.loadOptimizedClubData(this.backendClub._id, this.selectedSeasonId);
      }
      // Force change detection to update dropdown
      this.cdr.detectChanges();
    } else if (this.seasons && this.seasons.length > 0) {
      // Fallback to first available season if club has no seasons
      const firstSeason = this.seasons[0];
      this.selectedSeasonId = firstSeason._id;
      if (this.backendClub) {
        this.ngrxApiService.loadClubRoster(this.backendClub._id, this.selectedSeasonId);
        // Load optimized data for auto-selected season
        this.loadOptimizedClubData(this.backendClub._id, this.selectedSeasonId);
      }
      // Force change detection to update dropdown
      this.cdr.detectChanges();
    }
  }

  onSeasonChange(seasonId: string) {
    // Validate seasonId
    if (!seasonId || seasonId === '') {
      console.log('Season change: Invalid season ID');
      return;
    }
    
    // Note: selectedSeasonId is already updated by ngModel binding before this method is called
    console.log('Season change triggered, loading data for season:', seasonId);
    
    // Load data for the selected season
    if (this.backendClub && seasonId) {
      this.ngrxApiService.loadClubRoster(this.backendClub._id, seasonId);
      // Load optimized stats and matches for this season
      this.loadOptimizedClubData(this.backendClub._id, seasonId);
    }
  }

  // Method to refresh roster data (can be called when players are added/removed)
  refreshRoster() {
    if (this.backendClub && this.selectedSeasonId) {
      this.ngrxApiService.loadClubRoster(this.backendClub._id, this.selectedSeasonId);
    }
  }

  // Method to set up roster subscription for the current club
  private setupRosterSubscription() {
    // Unsubscribe from previous roster subscription
    this.rosterSubscription$.next();
    this.rosterSubscription$.complete();
    this.rosterSubscription$ = new Subject<void>();
    
    // Set up new roster subscription
    this.clubRoster$.pipe(
      takeUntil(this.destroy$),
      takeUntil(this.rosterSubscription$),
      filter(roster => roster !== undefined)
    ).subscribe(roster => {
      console.log('Roster subscription triggered for club:', this.backendClub?.name);
      // Roster processing is now handled by the combined data subscription
    });
  }

  private setupCombinedDataSubscription() {
    // Show club immediately when it loads
    this.selectedClub$.pipe(
      takeUntil(this.destroy$),
      filter(club => club !== null && !this.isSwitchingClubs)
    ).subscribe(club => {
      if (club) {
        console.log('Club loaded immediately:', club.name);
        this.loading = false; // Show club header immediately
        this.processClubData(club);
      }
    });

    // Load roster and then trigger optimized data loading
    this.clubRoster$.pipe(
      takeUntil(this.destroy$),
      filter(roster => roster !== null && roster !== undefined && !this.isSwitchingClubs)
    ).subscribe(roster => {
      if (this.backendClub && this.selectedSeasonId) {
        console.log('Roster loaded, loading optimized club data');
        this.signedPlayers = roster.filter(player => player && player.gamertag);
        this.rosterLoaded = true;
        // Load optimized stats and matches
        this.loadOptimizedClubData(this.backendClub._id, this.selectedSeasonId);
      }
    });

    // Keep old subscription as fallback for when optimized endpoint doesn't work
    // This will trigger if matches are loaded but stats are still empty
    combineLatest([
      this.matches$,
      this.clubRoster$
    ]).pipe(
      takeUntil(this.destroy$),
      debounceTime(200), // Small delay to let optimized endpoint finish first
      filter(([matches, roster]) => 
        matches !== null && 
        matches.length > 0 &&
        roster !== null && 
        !this.isSwitchingClubs &&
        this.backendClub !== null
      )
    ).subscribe(([matches, roster]) => {
      // Only use fallback if stats are still empty (optimized endpoint failed or returned empty)
      if (this.skaterStats.length === 0 && this.goalieStats.length === 0) {
        console.log('Fallback: Processing matches with old method (optimized endpoint returned no stats)');
        const regularSeasonMatches = (matches || []).filter(match => {
          const isPlayoff = match.isPlayoff === true || match.isPlayoff === 'true' || match.isPlayoff === 1;
          const hasPlayoffIds = match.playoffBracketId || match.playoffSeriesId || match.playoffRoundId;
          return !isPlayoff && !hasPlayoffIds;
        });
        this.processAdditionalData(regularSeasonMatches, roster);
      }
    });
  }

  private loadOptimizedClubData(clubId: string, seasonId: string) {
    if (!clubId || !seasonId) {
      console.warn('Cannot load optimized club data - missing clubId or seasonId');
      return;
    }

    console.log('Loading optimized club data for:', clubId, seasonId);
    this.isProcessingStats = true;

    // Load stats and matches in parallel
    combineLatest([
      this.apiService.getClubStats(clubId, seasonId),
      this.apiService.getClubMatches(clubId, seasonId, 50, 0, false)
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([statsData, matchesData]) => {
        console.log('Optimized club data loaded:', { 
          stats: statsData, 
          matches: matchesData,
          skaterStatsCount: statsData?.skaterStats?.length || 0,
          goalieStatsCount: statsData?.goalieStats?.length || 0,
          matchesCount: matchesData?.matches?.length || 0,
          hasTeamRecord: !!statsData?.teamRecord
        });
        
        // Debug: Log the full statsData structure
        console.log('Full statsData structure:', JSON.stringify(statsData, null, 2));
        console.log('statsData keys:', Object.keys(statsData || {}));
        
        // Check if we got valid stats data
        const hasStats = (statsData?.skaterStats?.length > 0) || (statsData?.goalieStats?.length > 0);
        
        if (!hasStats) {
          console.warn('Backend returned empty stats - this might be normal if no games have been played yet');
          console.warn('statsData:', statsData);
          // Set empty arrays so UI shows "No stats available" instead of loading forever
          this.skaterStats = [];
          this.goalieStats = [];
          this.isProcessingStats = false;
          this.cdr.detectChanges();
          return;
        }
        
        // Update player stats
        this.skaterStats = statsData.skaterStats || [];
        this.goalieStats = statsData.goalieStats || [];
        
        // Debug: Log first skater and goalie to verify structure
        if (this.skaterStats.length > 0) {
          console.log('First skater stat:', this.skaterStats[0]);
        }
        if (this.goalieStats.length > 0) {
          console.log('First goalie stat:', this.goalieStats[0]);
        }

        // Update matches - transform _id to id and map score fields for compatibility
        if (matchesData?.matches) {
          this.clubMatches = matchesData.matches.map((match: any) => ({
            ...match,
            id: match._id || match.id,
            // Map backend score fields to frontend expected fields
            homeScore: match.homeTeamScore ?? match.homeScore ?? match.score?.home ?? 0,
            awayScore: match.awayTeamScore ?? match.awayScore ?? match.score?.away ?? 0,
            // Extract team names from populated club objects
            homeTeam: match.homeClubId?.name || match.homeTeam || 'Unknown',
            awayTeam: match.awayClubId?.name || match.awayTeam || 'Unknown',
            // Set homeClub and awayClub objects with logo URLs for match history display
            homeClub: match.homeClubId ? {
              _id: match.homeClubId._id || match.homeClubId,
              name: match.homeClubId.name,
              logoUrl: match.homeClubId.logoUrl,
              eashlClubId: match.homeClubId.eashlClubId
            } : undefined,
            awayClub: match.awayClubId ? {
              _id: match.awayClubId._id || match.awayClubId,
              name: match.awayClubId.name,
              logoUrl: match.awayClubId.logoUrl,
              eashlClubId: match.awayClubId.eashlClubId
            } : undefined,
            // Also preserve original fields for backwards compatibility
            homeTeamScore: match.homeTeamScore,
            awayTeamScore: match.awayTeamScore
          }));
          this.matchesLoaded = true;
        }

        // Calculate full club stats from matches (points, goalsFor, goalsAgainst, streak, etc.)
        if (this.club && this.backendClub && this.clubMatches && this.clubMatches.length > 0) {
          const calculatedStats = this.calculateClubStats(this.backendClub._id.toString(), this.clubMatches);
          // Merge with teamRecord from backend to ensure consistency
          if (statsData?.teamRecord) {
            this.club.stats = {
              ...calculatedStats,
              // Use backend teamRecord values as source of truth for wins/losses/gamesPlayed
              wins: statsData.teamRecord.wins,
              losses: statsData.teamRecord.losses,
              otLosses: statsData.teamRecord.otLosses,
              gamesPlayed: statsData.teamRecord.gamesPlayed
            };
          } else {
            this.club.stats = calculatedStats;
          }
          console.log('Calculated and set club stats:', this.club.stats);
        } else if (statsData?.teamRecord && this.club) {
          // Fallback: if no matches, use teamRecord but initialize other fields
          this.club.stats = {
            ...statsData.teamRecord,
            points: statsData.teamRecord.wins * 2 + statsData.teamRecord.otLosses,
            winPercentage: statsData.teamRecord.gamesPlayed > 0 
              ? (statsData.teamRecord.wins / statsData.teamRecord.gamesPlayed) * 100 
              : 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifferential: 0,
            streakCount: 0,
            streakType: '-' as 'W' | 'L' | 'OTL' | '-',
            lastTen: []
          };
        }

        console.log('Stats updated:', {
          skaterStats: this.skaterStats.length,
          goalieStats: this.goalieStats.length,
          clubStats: this.club?.stats
        });

        this.isProcessingStats = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading optimized club data:', error);
        this.isProcessingStats = false;
        // Fallback to old method if optimized endpoint fails
        console.warn('Falling back to old method');
        this.fallbackToOldMethod(clubId, seasonId);
      }
    });
  }

  private fallbackToOldMethod(clubId: string, seasonId: string) {
    console.warn('Falling back to old method for loading club data');
    // Clear stats to trigger fallback subscription
    this.skaterStats = [];
    this.goalieStats = [];
    // Load all matches as fallback
    this.ngrxApiService.loadMatches();
    // The old subscription will handle processing when matches load
  }

  private processClubData(club: any) {
    if (!club) return;
    
    console.log('Processing club data immediately:', club.name);
    
    // Update local data immediately
    this.backendClub = club as any;
    this.club = this.mapBackendClubToFrontend(club);
    this.clubLoaded = true;
    
    // Set up roster subscription for the new club
    this.setupRosterSubscription();
    
        // Reset season selection for the new club
        this.selectedSeasonId = '';
        this.cachedClubSeasons = [];
        
        // Trigger season selection now that we have the club data
        this.selectSeasonForClub();
  }

  private processAdditionalData(matches: any[], roster: any[]) {
    if (!matches || !roster || !this.backendClub) return;
    
    console.log('Processing additional data for club:', this.backendClub.name);
    
    // Update local data
    this.matches = matches;
    this.matchesLoaded = true;
    this.signedPlayers = roster.filter(player => player && player.gamertag);
    this.rosterLoaded = true;
    
    // Debug: Check for playoff games in matches
    const playoffGamesInMatches = matches.filter(m => m.isPlayoff === true || m.isPlayoff === 'true');
    console.log('Total matches:', matches.length);
    console.log('Playoff games found in matches:', playoffGamesInMatches.length);
    if (playoffGamesInMatches.length > 0) {
      console.log('Sample playoff game:', {
        id: playoffGamesInMatches[0]._id || playoffGamesInMatches[0].id,
        isPlayoff: playoffGamesInMatches[0].isPlayoff,
        homeTeam: playoffGamesInMatches[0].homeTeam,
        awayTeam: playoffGamesInMatches[0].awayTeam
      });
    }
    
    // Separate regular season and playoff matches
    const regularSeasonMatches: any[] = [];
    const playoffMatches: any[] = [];
    
    matches.forEach(match => {
      // Comprehensive playoff game detection
      const isPlayoff = match.isPlayoff === true || match.isPlayoff === 'true' || match.isPlayoff === 1;
      const hasPlayoffIds = match.playoffBracketId || match.playoffSeriesId || match.playoffRoundId;
      
      // Check if match belongs to this club
      const homeMatch = match.homeClub?.name === this.backendClub?.name || match.homeClubId?.name === this.backendClub?.name;
      const awayMatch = match.awayClub?.name === this.backendClub?.name || match.awayClubId?.name === this.backendClub?.name;
      const homeTeamMatch = match.homeTeam === this.backendClub?.name;
      const awayTeamMatch = match.awayTeam === this.backendClub?.name;
      const homeClubIdMatch = match.homeClub?._id === this.backendClub?._id || match.homeClubId?._id === this.backendClub?._id;
      const awayClubIdMatch = match.awayClub?._id === this.backendClub?._id || match.awayClubId?._id === this.backendClub?._id;
      
      const belongsToClub = homeMatch || awayMatch || homeTeamMatch || awayTeamMatch || homeClubIdMatch || awayClubIdMatch;
      
      if (!belongsToClub) return;
      
      if (isPlayoff || hasPlayoffIds) {
        console.log('[SEPARATE TABLES] Adding playoff game to playoff matches:', {
          id: match._id || match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          isPlayoff: match.isPlayoff,
          playoffBracketId: match.playoffBracketId
        });
        playoffMatches.push(match);
      } else {
        regularSeasonMatches.push(match);
      }
    });
    
    // Set regular season matches (excluded from playoff stats)
    this.clubMatches = regularSeasonMatches;
    
    // Set playoff matches (for separate tables)
    this.playoffClubMatches = playoffMatches;
    
    console.log('Processed additional data:', {
      clubMatches: this.clubMatches.length,
      playoffClubMatches: this.playoffClubMatches.length,
      signedPlayers: this.signedPlayers.length,
      clubName: this.backendClub.name
    });
    
    // Recalculate club stats now that we have matches data (excluding playoff games)
    if (this.club) {
      // Filter out playoff games before calculating stats - check multiple possible formats
      const regularSeasonMatches = matches.filter(match => {
        const isPlayoff = match.isPlayoff === true || match.isPlayoff === 'true' || match.isPlayoff === 1;
        const hasPlayoffIds = match.playoffBracketId || match.playoffSeriesId || match.playoffRoundId;
        return !isPlayoff && !hasPlayoffIds;
      });
      const calculatedStats = this.calculateClubStats(this.backendClub._id, regularSeasonMatches);
      this.club.stats = calculatedStats;
      console.log('Updated club stats:', calculatedStats);
    }
    
    // Now process stats with all data ready (regular season only)
    this.processPlayerStatsFromMatches(this.signedPlayers);
    
    // Process playoff stats separately for separate tables
    if (this.playoffClubMatches.length > 0) {
      this.processPlayoffStatsFromMatches(this.signedPlayers);
    } else {
      // Clear playoff stats if no playoff matches
      this.playoffSkaterStats = [];
      this.playoffGoalieStats = [];
    }
  }

  private processAllData(club: any, matches: any[], roster: any[]) {
    // This method is now deprecated - using progressive loading instead
    this.processClubData(club);
    this.processAdditionalData(matches, roster);
  }

  // Method to clear club data when switching clubs
  private clearClubData() {
    console.log('Clearing club data for clubId:', this.currentClubId);
    
    // Clear roster data from NgRx store
    if (this.currentClubId) {
      this.store.dispatch(ClubsActions.clearClubRoster({ clubId: this.currentClubId }));
    }
    
    // Clear local component data
    this.club = undefined;
    this.backendClub = null;
    this.signedPlayers = [];
    this.skaterStats = [];
    this.goalieStats = [];
    this.matches = [];
    this.clubMatches = [];
    this.playoffClubMatches = [];
    this.playoffSkaterStats = [];
    this.playoffGoalieStats = [];
    this.selectedSeasonId = '';
    this.cachedClubSeasons = [];
    this.currentClubId = '';
    this.loading = false;
    
    // Reset loading states
    this.clubLoaded = false;
    this.matchesLoaded = false;
    this.rosterLoaded = false;
    this.error = null;
    
    console.log('Club data cleared, signedPlayers length:', this.signedPlayers.length);
    console.log('Stats cleared - skaterStats:', this.skaterStats.length, 'goalieStats:', this.goalieStats.length);
  }

  private processRosterData(roster: any[]) {
    console.log('Processing roster data for club:', this.backendClub?.name, 'Roster:', roster);
    
    // Always clear previous stats when processing new roster data
    this.skaterStats = [];
    this.goalieStats = [];
    
    if (!roster || roster.length === 0) {
      console.log('No roster data, clearing arrays');
      this.signedPlayers = [];
      return;
    }

    // Process signed players - filter for players with gamertag (new player system)
    this.signedPlayers = roster.filter(player => player && player.gamertag);
    console.log('Signed players for', this.backendClub?.name, ':', this.signedPlayers.map(p => p.gamertag));

    // Trigger stats processing if all data is ready
    this.triggerStatsProcessingIfReady();
  }

  private async triggerStatsProcessingIfReady() {
    // Check if we have all required data to process stats
    if (this.backendClub && (this.clubMatches.length > 0 || this.playoffClubMatches.length > 0) && this.signedPlayers.length > 0) {
      console.log('All data ready, processing player stats');
      this.isProcessingStats = true;
      // Clear stats before processing new ones
      this.skaterStats = [];
      this.goalieStats = [];
      this.playoffSkaterStats = [];
      this.playoffGoalieStats = [];
      this.cdr.detectChanges();
      
      try {
        // Process regular season stats if we have regular season matches
        if (this.clubMatches.length > 0) {
          await this.processPlayerStatsFromMatches(this.signedPlayers);
        }
        
        // Process playoff stats if we have playoff matches
        if (this.playoffClubMatches.length > 0) {
          await this.processPlayoffStatsFromMatches(this.signedPlayers);
        }
        
        this.isProcessingStats = false;
        // Force change detection for mobile rendering
        this.cdr.detectChanges();
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 500);
      } catch (error) {
        console.error('Error in triggerStatsProcessingIfReady:', error);
        this.isProcessingStats = false;
        // Force change detection even on error
        this.cdr.detectChanges();
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 500);
      }
    } else {
      console.log('Not ready for stats processing:', {
        hasBackendClub: !!this.backendClub,
        clubMatchesCount: this.clubMatches.length,
        playoffClubMatchesCount: this.playoffClubMatches.length,
        signedPlayersCount: this.signedPlayers.length
      });
      this.isProcessingStats = false;
      // Clear stats if not ready
      this.skaterStats = [];
      this.goalieStats = [];
      this.playoffSkaterStats = [];
      this.playoffGoalieStats = [];
      this.cdr.detectChanges();
    }
  }

  private async processPlayerStatsFromMatches(roster: any[]) {
        console.log('=== CLUB DETAIL DEBUG ===');
    console.log('Processing player stats from matches for club:', this.backendClub?.name);
    console.log('Club matches available:', this.clubMatches.length);
    console.log('Roster players:', roster.length);
        console.log('Selected season ID:', this.selectedSeasonId);
        console.log('Sample match data:', this.clubMatches[0]);
        console.log('Sample match has playerStats:', !!this.clubMatches[0]?.playerStats);
        console.log('Sample match playerStats length:', this.clubMatches[0]?.playerStats?.length);
        console.log('========================');
        
        // Clear previous stats before processing new ones
        this.skaterStats = [];
        this.goalieStats = [];
        this.cdr.detectChanges();
        
        try {
          // Use the service to process stats (now async)
          const { skaterStats, goalieStats } = await this.clubStatsService.processPlayerStatsFromMatches(
          this.clubMatches,
          roster,
          this.backendClub
        );
        
        this.skaterStats = skaterStats;
        this.goalieStats = goalieStats;
        
        console.log('Stats processing complete - triggering UI update');
        console.log('=== CLUB DETAIL COMPONENT - SKATER STATS ===');
        this.skaterStats.slice(0, 3).forEach(player => {
          console.log(`${player.name}: passes=${player.passes}, passAttempts=${player.passAttempts}, passPercentage=${player.passPercentage}%`);
        });
        console.log('=== END CLUB DETAIL COMPONENT - SKATER STATS ===');
        
        // Debug goalie stats, especially Vxxlle
        console.log('=== CLUB DETAIL COMPONENT - GOALIE STATS ===');
        this.goalieStats.forEach(goalie => {
          console.log(`${goalie.name}: GP=${goalie.gamesPlayed}, SO=${goalie.shutouts}, GA=${goalie.goalsAgainst}, Saves=${goalie.saves}`);
          if (goalie.name.includes('Vxxlle')) {
            console.log('🔍 VXXLLE GOALIE STATS:', goalie);
          }
        });
        console.log('=== END CLUB DETAIL COMPONENT - GOALIE STATS ===');
        // Force change detection for mobile rendering - use multiple calls
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        // Additional delayed change detection for mobile
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 50);
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 100);
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 300);
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 500);
        } catch (error) {
          console.error('Error processing player stats:', error);
          this.skaterStats = [];
          this.goalieStats = [];
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          // Additional delayed change detection for mobile
          setTimeout(() => {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }, 100);
        }
      }

  private async processPlayoffStatsFromMatches(roster: any[]) {
    console.log('=== CLUB DETAIL PLAYOFF STATS DEBUG ===');
    console.log('Processing playoff player stats from matches for club:', this.backendClub?.name);
    console.log('Playoff club matches available:', this.playoffClubMatches.length);
    console.log('Roster players:', roster.length);
    console.log('========================');
    
    // Clear previous playoff stats before processing new ones
    this.playoffSkaterStats = [];
    this.playoffGoalieStats = [];
    this.cdr.detectChanges();
    
    // Only process if we have playoff matches
    if (this.playoffClubMatches.length === 0) {
      console.log('No playoff matches found, skipping playoff stats processing');
      return;
    }
    
    try {
      // Use the service to process playoff stats (now async)
      const { skaterStats, goalieStats } = await this.clubStatsService.processPlayerStatsFromMatches(
      this.playoffClubMatches,
      roster,
      this.backendClub
    );
    
    this.playoffSkaterStats = skaterStats;
    this.playoffGoalieStats = goalieStats;
    
    console.log('Playoff stats processing complete - triggering UI update');
    console.log('=== CLUB DETAIL COMPONENT - PLAYOFF SKATER STATS ===');
    this.playoffSkaterStats.slice(0, 3).forEach(player => {
      console.log(`${player.name}: G=${player.goals}, A=${player.assists}, PTS=${player.points}`);
    });
    console.log('=== END CLUB DETAIL COMPONENT - PLAYOFF SKATER STATS ===');
    
    console.log('=== CLUB DETAIL COMPONENT - PLAYOFF GOALIE STATS ===');
    this.playoffGoalieStats.forEach(goalie => {
      console.log(`${goalie.name}: GP=${goalie.gamesPlayed}, SO=${goalie.shutouts}, GAA=${goalie.goalsAgainstAverage}`);
    });
      console.log('=== END CLUB DETAIL COMPONENT - PLAYOFF GOALIE STATS ===');
      // Force change detection for mobile rendering - use multiple calls
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      // Additional delayed change detection for mobile
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 50);
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 100);
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 300);
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 500);
    } catch (error) {
      console.error('Error processing playoff stats:', error);
      this.playoffSkaterStats = [];
      this.playoffGoalieStats = [];
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      // Additional delayed change detection for mobile
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 100);
    }
  }

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  onImageError(event: any): void {
    console.log('Image failed to load, URL:', event.target.src);
    if (event.target.src.includes('square-default.png')) {
      console.log('Default image also failed to load, stopping error handling');
        return;
      }
    event.target.src = '/assets/images/square-default.png';
  }

  // Update cached club seasons when club or seasons change
  private updateCachedClubSeasons() {
    if (!this.backendClub || !this.backendClub.seasons || !this.seasons || this.seasons.length === 0) {
      this.cachedClubSeasons = [];
      return;
    }
    
    // Extract season IDs from club seasons, handling both object and string formats
    const clubSeasonIds = this.backendClub.seasons.map((clubSeason: any) => {
      // Handle both object and string seasonId formats
      return typeof clubSeason.seasonId === 'object' && clubSeason.seasonId._id 
        ? clubSeason.seasonId._id 
        : clubSeason.seasonId;
    });
    
    console.log('ClubDetail: Club season IDs:', clubSeasonIds);
    console.log('ClubDetail: All seasons:', this.seasons.map(s => ({ id: s._id, name: s.name })));
    
    // Filter seasons that this club is part of
    const filteredSeasons = this.seasons.filter(season => 
      clubSeasonIds.includes(season._id)
    );
    
    // Sort seasons by endDate in descending order (newest first) - matching other components
    const sortedSeasons = [...filteredSeasons].sort((a, b) => {
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
    
    console.log('ClubDetail: Filtered and sorted seasons for club:', sortedSeasons.map(s => ({ id: s._id, name: s.name })));
    
    this.cachedClubSeasons = sortedSeasons;
  }

  getClubSeasons(club: any): any[] {
    // Return cached seasons instead of recalculating on every change detection
    return this.cachedClubSeasons;
  }

  getSelectedSeasonDivision(): any {
    if (!this.selectedSeasonId) return null;
    
    const selectedSeason = this.seasons.find(season => season._id === this.selectedSeasonId);
    return selectedSeason?.division || null;
  }

  mapBackendClubToFrontend(backendClub: any): any {
    if (!backendClub) return null;
    
    // Calculate stats from matches - use this.matches if available, otherwise return empty stats
    const calculatedStats = this.matches && this.matches.length > 0 
      ? this.calculateClubStats(backendClub._id, this.matches)
      : {
          wins: 0,
          losses: 0,
          otLosses: 0,
          points: 0,
          gamesPlayed: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          winPercentage: 0,
          goalDifferential: 0,
          streakCount: 0,
          streakType: '-' as 'W' | 'L' | 'OTL' | '-',
          lastTen: []
        };
    
    return {
      ...backendClub,
      clubName: backendClub.name,
      colour: backendClub.primaryColour,
      image: this.getImageUrl(backendClub.logoUrl),
      stats: calculatedStats
    };
  }

  calculateClubStats(clubId: string, matches: any[] = this.matches): any {
    if (!this.backendClub) {
      console.warn('Cannot calculate club stats - backendClub not set');
      return {
        wins: 0,
        losses: 0,
        otLosses: 0,
        points: 0,
        gamesPlayed: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        winPercentage: 0,
        goalDifferential: 0,
        streakCount: 0,
        streakType: '-' as 'W' | 'L' | 'OTL' | '-',
        lastTen: []
      };
    }

    // Matches from backend are already filtered by club, but filter out playoff games if needed
    // and ensure we only process matches for this club
    const clubMatches = matches.filter(match => {
      // Comprehensive playoff game detection (should already be filtered by backend, but double-check)
      const isPlayoff = match.isPlayoff === true || match.isPlayoff === 'true' || match.isPlayoff === 1;
      const hasPlayoffIds = match.playoffBracketId || match.playoffSeriesId || match.playoffRoundId;
      
      if (isPlayoff || hasPlayoffIds) {
        return false;
      }
      
      // Verify match belongs to this club (backend should already filter, but verify)
      const homeMatch = match.homeTeam === this.backendClub?.name ||
                       match.homeClub?.name === this.backendClub?.name ||
                       match.homeClubId?.name === this.backendClub?.name ||
                       (match.homeClubId?._id && match.homeClubId._id.toString() === this.backendClub?._id?.toString()) ||
                       (match.homeClub?._id && match.homeClub._id.toString() === this.backendClub?._id?.toString());
      
      const awayMatch = match.awayTeam === this.backendClub?.name ||
                       match.awayClub?.name === this.backendClub?.name ||
                       match.awayClubId?.name === this.backendClub?.name ||
                       (match.awayClubId?._id && match.awayClubId._id.toString() === this.backendClub?._id?.toString()) ||
                       (match.awayClub?._id && match.awayClub._id.toString() === this.backendClub?._id?.toString());
      
      return homeMatch || awayMatch;
    });

    if (clubMatches.length === 0) {
      return {
        wins: 0,
        losses: 0,
        otLosses: 0,
        points: 0,
        gamesPlayed: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        winPercentage: 0,
        goalDifferential: 0,
        streakCount: 0,
        streakType: '-' as 'W' | 'L' | 'OTL' | '-',
        lastTen: []
      };
    }

    let wins = 0;
    let losses = 0;
    let otLosses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    const lastTenResults: Array<'W' | 'L' | 'OTL'> = [];

    // Sort matches by date (oldest first) to ensure streak calculation is correct
    const sortedMatches = [...clubMatches].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.date ? new Date(b.date).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return dateA - dateB;
    });

    // Process each match
    sortedMatches.forEach(match => {
      // Determine if we're the home team - check multiple possible field formats
      const isHomeTeam = match.homeTeam === this.backendClub?.name ||
                        match.homeClub?.name === this.backendClub?.name ||
                        match.homeClubId?.name === this.backendClub?.name ||
                        (match.homeClubId?._id && match.homeClubId._id.toString() === this.backendClub?._id?.toString()) ||
                        (match.homeClub?._id && match.homeClub._id.toString() === this.backendClub?._id?.toString());
      
      const ourScore = Number(isHomeTeam ? (match.homeScore ?? match.homeTeamScore ?? 0) : (match.awayScore ?? match.awayTeamScore ?? 0));
      const opponentScore = Number(isHomeTeam ? (match.awayScore ?? match.awayTeamScore ?? 0) : (match.homeScore ?? match.homeTeamScore ?? 0));
      
      goalsFor += ourScore;
      goalsAgainst += opponentScore;

      // Only count games that have been played (have EASHL data or actual scores > 0) or are forfeit games
      const hasBeenPlayed = match.eashlData && match.eashlData.matchId || 
                           (ourScore > 0 || opponentScore > 0) ||
                           (match.isOvertime || match.isShootout);
      const isForfeitGame = match.forfeit && match.forfeit !== 'none';

      if (hasBeenPlayed || isForfeitGame) {
        // Determine result
        if (isForfeitGame) {
          // Handle forfeit games
          if ((isHomeTeam && match.forfeit === 'forfeit-home') || 
              (!isHomeTeam && match.forfeit === 'forfeit-away')) {
            wins++;
            lastTenResults.push('W');
            // For forfeit wins, use default scores
            goalsFor = goalsFor - ourScore + 1;
            goalsAgainst = goalsAgainst - opponentScore + 0;
          } else {
            losses++;
            lastTenResults.push('L');
            // For forfeit losses, use default scores
            goalsFor = goalsFor - ourScore + 0;
            goalsAgainst = goalsAgainst - opponentScore + 1;
          }
        } else if (ourScore > opponentScore) {
          wins++;
          lastTenResults.push('W');
        } else if (ourScore < opponentScore) {
          // Check if this was an overtime/shootout loss
          if (match.isOvertime || match.isShootout) {
            otLosses++;
            lastTenResults.push('OTL');
          } else {
            losses++;
            lastTenResults.push('L');
          }
        } else {
          // Tied score - check if it was overtime/shootout
          if (match.isOvertime || match.isShootout) {
            otLosses++;
            lastTenResults.push('OTL');
          } else {
            // Regular tie - count as loss
            losses++;
            lastTenResults.push('L');
          }
        }
      }
    });

    const gamesPlayed = wins + losses + otLosses;
    const points = wins * 2 + otLosses;
    const winPercentage = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
    const goalDifferential = goalsFor - goalsAgainst;

    // Calculate streak (last 10 games)
    const lastTen = lastTenResults.slice(-10);

    // Calculate current streak
    let streakCount = 0;
    let streakType: 'W' | 'L' | 'OTL' | '-' = '-';
    
    if (lastTen.length > 0) {
      const currentResult = lastTen[lastTen.length - 1];
      streakType = currentResult;
      
      for (let i = lastTen.length - 1; i >= 0; i--) {
        if (lastTen[i] === currentResult) {
          streakCount++;
        } else {
          break;
        }
      }
    }

    return {
      wins,
      losses,
      otLosses,
      points,
      gamesPlayed,
      goalsFor,
      goalsAgainst,
      winPercentage,
      goalDifferential,
      streakCount,
      streakType,
      lastTen
    };
  }

  // Additional methods for club detail functionality would go here
  // This is a simplified version focusing on the NgRx integration
}
