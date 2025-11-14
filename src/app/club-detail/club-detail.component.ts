import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import * as ClubsActions from '../store/clubs.actions';
import * as MatchesActions from '../store/matches.actions';
// Import specific selectors for better tree-shaking
import { selectSelectedClub, selectAllClubs, selectClubsLoading, selectClubsError, selectClubRoster } from '../store/clubs.selectors';
import { selectAllMatches } from '../store/matches.selectors';
import { selectAllSeasons } from '../store/seasons.selectors';

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
  imports: [CommonModule, RouterModule, MatchHistoryComponent, ClubHeaderComponent, ClubStatsGridComponent, ClubRosterTablesComponent, ClubStatLegendComponent, AdSenseComponent],
  templateUrl: './club-detail.component.html',
  styleUrls: ['./club-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  loading: boolean = false;
  error: string | null = null;
  currentClubId: string = '';
  
  // Progressive loading states
  clubLoaded: boolean = false;
  matchesLoaded: boolean = false;
  rosterLoaded: boolean = false;
  gamesLoading: boolean = false; // Track games loading state
  
  // Additional properties for template
  signedPlayers: any[] = [];
      skaterStats: SkaterStats[] = [];
      goalieStats: GoalieStats[] = [];
  matches: any[] = [];
  clubMatches: any[] = [];
      
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
    // Initialize selectors using direct imports for better tree-shaking
    this.selectedClub$ = this.store.select(selectSelectedClub);
    this.allClubs$ = this.store.select(selectAllClubs);
    this.matches$ = this.store.select(selectAllMatches);
    this.seasons$ = this.store.select(selectAllSeasons);
    this.clubsLoading$ = this.store.select(selectClubsLoading);
    this.clubsError$ = this.store.select(selectClubsError);
    this.clubRoster$ = this.store.select(selectClubRoster(''));
  }

  ngOnInit(): void {
    // Read both route params and query params together to avoid race condition
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).pipe(takeUntil(this.destroy$)).subscribe(([params, queryParams]) => {
      const clubId = params['id'];
      const seasonFromQuery = queryParams['season'];
      
      // Set season from query params BEFORE loading club data
      if (seasonFromQuery && seasonFromQuery !== this.selectedSeasonId) {
        this.selectedSeasonId = seasonFromQuery;
      }
      
      if (clubId && clubId !== this.currentClubId) {
        console.log('Route params changed - new clubId:', clubId, 'current clubId:', this.currentClubId);
        console.log('Switching to different club, clearing data');
            console.log('Previous clubId:', this.currentClubId, 'New clubId:', clubId);
        console.log('Season from query params:', seasonFromQuery);
            
            // Set flag to prevent stale data processing
            this.isSwitchingClubs = true;
            
            // Clear stats immediately when switching clubs
            this.skaterStats = [];
            this.goalieStats = [];
            this.signedPlayers = [];
            this.clubMatches = [];
        this.cdr.markForCheck();
            
        // Clear previous club data when switching to a different club
        this.clearClubData();
        // Reset games loading state
        this.gamesLoading = false;
        this.matchesLoaded = false;
        this.loadClubData(clubId);
      } else if (clubId === this.currentClubId && seasonFromQuery && seasonFromQuery !== this.selectedSeasonId) {
        // Same club, but season changed - reload games for new season
        this.selectedSeasonId = seasonFromQuery;
        // Invalidate cache and clear matches to ensure fresh data with stats
        console.log('[ClubDetail] Route params - Season changed, loading matches with stats for season:', seasonFromQuery);
        this.apiService.invalidateGamesCache();
        this.store.dispatch(MatchesActions.clearMatches());
        this.ngrxApiService.loadMatchesBySeasonWithStats(seasonFromQuery);
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
          this.cdr.markForCheck();
        }
        
        this.backendClub = club as any;
        this.club = this.mapBackendClubToFrontend(club);
        
        // Update club roster selector for the new club
        this.clubRoster$ = this.store.select(selectClubRoster(club._id));
        
        // Set up roster subscription for the new club
        this.setupRosterSubscription();
        
        // Don't reset season if it was set from query params
        // Only reset if it wasn't set from query params
        if (!this.selectedSeasonId) {
        // Trigger season selection now that we have the club data
        this.selectSeasonForClub();
        } else {
          // Season already set (from query params) - ensure games are loaded
          // Invalidate cache and clear matches to ensure fresh data with stats
          console.log('[ClubDetail] setupDataSubscriptions - Season from query params, loading matches with stats for season:', this.selectedSeasonId);
          this.apiService.invalidateGamesCache();
          this.store.dispatch(MatchesActions.clearMatches());
          this.ngrxApiService.loadMatchesBySeasonWithStats(this.selectedSeasonId);
        }
        
        // Load roster for the selected season (or default season)
        if (this.selectedSeasonId) {
          this.ngrxApiService.loadClubRoster(club._id, this.selectedSeasonId);
        }
        
        // Set up combined observable to wait for all data
        this.setupCombinedDataSubscription();
      }
    });

    // Subscribe to all clubs for opponent name resolution
    this.allClubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
      this.allClubs = clubs as BackendClub[];
    });

    // Subscribe to seasons
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      this.seasons = seasons;
      
      // Only try to select a season if we don't have one selected yet
      if (!this.selectedSeasonId) {
        this.selectSeasonForClub();
      }
    });

    // Matches subscription is now handled by the combined data subscription

    // Subscribe to loading and error states
    this.clubsLoading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
      this.cdr.markForCheck();
    });

    this.clubsError$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.error = error;
      this.cdr.markForCheck();
    });

    // Subscribe to club roster data - this will be updated when club changes
    this.setupRosterSubscription();
  }

  private loadClubData(clubId: string) {
    this.loading = true;
    this.error = null;
    this.currentClubId = clubId;
    
    // Update the club roster selector with the current club ID
    this.clubRoster$ = this.store.select(selectClubRoster(clubId));
    
    // Load only essential data first - just the specific club
    this.ngrxApiService.loadClub(clubId);
    
    // Load other data in parallel (non-blocking)
    this.loadAdditionalDataInBackground();
  }

  private loadAdditionalDataInBackground() {
    // Load seasons first - DO NOT load games here
    // Games will be loaded after season is selected (from query params or auto-selection)
    // This prevents race condition where we load all games before season is known
    this.ngrxApiService.loadSeasons();
  }

  selectSeasonForClub() {
    // Only auto-select if we don't have a season selected yet
    // (season might already be set from query params)
    if (this.selectedSeasonId) {
      // Season already selected - ensure games are loaded for it
      // Invalidate cache and clear matches to ensure fresh data with stats
      console.log('[ClubDetail] selectSeasonForClub - Season already selected, loading matches with stats for season:', this.selectedSeasonId);
      this.apiService.invalidateGamesCache();
      this.store.dispatch(MatchesActions.clearMatches());
      this.ngrxApiService.loadMatchesBySeasonWithStats(this.selectedSeasonId);
      return;
    }
    
    // Get the filtered seasons for this club
    const clubSeasons = this.getClubSeasons(this.backendClub);
    
    if (clubSeasons.length > 0) {
      // Select the first season the club participates in
      const firstClubSeason = clubSeasons[0];
      this.onSeasonChange(firstClubSeason._id);
    } else if (this.seasons && this.seasons.length > 0) {
      // Fallback to first available season if club has no seasons
      const firstSeason = this.seasons[0];
      this.onSeasonChange(firstSeason._id);
    }
  }

  onSeasonChange(seasonId: string) {
    // Only load roster if the season actually changed
    if (this.selectedSeasonId === seasonId) {
      return;
    }
    
    this.selectedSeasonId = seasonId;
    this.gamesLoading = true; // Set loading state
    this.matchesLoaded = false;
    this.cdr.markForCheck();
    
    // Invalidate cache to ensure we get fresh data with stats
    // This prevents stale cached data without player stats from being used
    console.log('[ClubDetail] onSeasonChange - Invalidating games cache for season:', seasonId);
    this.apiService.invalidateGamesCache();
    
    // Clear matches from store to remove old data without player stats
    // This ensures we don't process stale matches before new data with stats arrives
    this.store.dispatch(MatchesActions.clearMatches());
    
    // Always load games for the selected season (never load all games)
    // This ensures we never fall back to the 7.3 MB all-games endpoint
    console.log('[ClubDetail] onSeasonChange - Calling loadMatchesBySeasonWithStats for season:', seasonId);
    this.ngrxApiService.loadMatchesBySeasonWithStats(seasonId);
    
    if (this.backendClub) {
      this.ngrxApiService.loadClubRoster(this.backendClub._id, seasonId);
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
        this.cdr.markForCheck();
      }
    });

    // Load additional data progressively
    // Only process when we have matches AND roster (games loading is tracked separately)
    combineLatest([
      this.matches$,
      this.clubRoster$
    ]).pipe(
      takeUntil(this.destroy$),
      debounceTime(50), // Reduced delay
      filter(([matches, roster]) => 
        matches !== null && 
        matches.length >= 0 && // Allow empty array (season might have no games)
        roster !== null && 
        !this.isSwitchingClubs
      )
    ).subscribe(([matches, roster]) => {
      console.log('Additional data loaded:', {
        matchesCount: matches?.length || 0,
        rosterCount: roster?.length || 0
      });
      
      // Debug: Check if matches have stats data
      if (matches && matches.length > 0) {
        const sampleMatch = matches[0];
        console.log('=== MATCHES DATA CHECK (from store) ===');
        console.log('Total matches in store:', matches.length);
        console.log('Sample match ID:', sampleMatch.id || sampleMatch._id);
        console.log('Sample match has eashlData:', !!sampleMatch.eashlData);
        console.log('Sample match has eashlData.players:', !!sampleMatch.eashlData?.players);
        console.log('Sample match has playerStats:', !!sampleMatch.playerStats);
        console.log('Sample match playerStats length:', sampleMatch.playerStats?.length || 0);
        console.log('Sample match eashlData keys:', sampleMatch.eashlData ? Object.keys(sampleMatch.eashlData) : 'no eashlData');
        if (sampleMatch.eashlData) {
          console.log('Sample match eashlData structure:', {
            hasClubs: !!sampleMatch.eashlData.clubs,
            hasPlayers: !!sampleMatch.eashlData.players,
            hasManualEntry: !!sampleMatch.eashlData.manualEntry,
            keys: Object.keys(sampleMatch.eashlData)
          });
        }
        console.log('=====================================');
      }
      
      this.gamesLoading = false; // Games have loaded
      this.matchesLoaded = true;
      
      // Process additional data without blocking UI
      this.processAdditionalData(matches, roster);
      this.cdr.markForCheck();
    });
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
    
    // Don't reset season if it was already set (from query params)
    // Only auto-select if no season is set
    if (!this.selectedSeasonId) {
    // Trigger season selection now that we have the club data
    this.selectSeasonForClub();
    } else {
      // Season already set - ensure games are loaded for it
      this.gamesLoading = true;
      // Invalidate cache and clear matches to ensure fresh data with stats
      console.log('[ClubDetail] processClubData - Season already set, loading matches with stats for season:', this.selectedSeasonId);
      this.apiService.invalidateGamesCache();
      this.store.dispatch(MatchesActions.clearMatches());
      this.ngrxApiService.loadMatchesBySeasonWithStats(this.selectedSeasonId);
      if (this.backendClub) {
        this.ngrxApiService.loadClubRoster(this.backendClub._id, this.selectedSeasonId);
      }
    }
  }

  private processAdditionalData(matches: any[], roster: any[]) {
    if (!matches || !roster || !this.backendClub) return;
    
    console.log('Processing additional data for club:', this.backendClub.name);
    
    // Update local data
    this.matches = matches;
    this.matchesLoaded = true;
    this.signedPlayers = roster.filter(player => player && player.gamertag);
    this.rosterLoaded = true;
    
    // Filter matches for current club
    // Check multiple ways to identify club matches:
    // 1. By populated club objects (homeClub/awayClub)
    // 2. By club IDs (homeClubId/awayClubId as strings or ObjectIds)
    // 3. By team names (homeTeam/awayTeam)
    const clubId = this.backendClub?._id;
    const clubName = this.backendClub?.name;
    
    // Debug: Log sample match structure
    if (matches.length > 0) {
      const sampleMatch = matches[0];
      console.log('=== MATCH FILTERING DEBUG ===');
      console.log('Looking for club:', clubName, 'ID:', clubId);
      console.log('Sample match structure:', {
        hasHomeClub: !!sampleMatch.homeClub,
        hasAwayClub: !!sampleMatch.awayClub,
        homeClubName: sampleMatch.homeClub?.name,
        awayClubName: sampleMatch.awayClub?.name,
        homeClubId: sampleMatch.homeClub?._id,
        awayClubId: sampleMatch.awayClub?._id,
        homeClubIdRaw: sampleMatch.homeClubId,
        awayClubIdRaw: sampleMatch.awayClubId,
        homeTeam: sampleMatch.homeTeam,
        awayTeam: sampleMatch.awayTeam
      });
      console.log('============================');
    }
    
    this.clubMatches = matches.filter(match => {
      // Check by populated club objects
      const homeMatch = match.homeClub?.name === clubName || match.homeClub?._id === clubId;
      const awayMatch = match.awayClub?.name === clubName || match.awayClub?._id === clubId;
      
      // Check by club IDs (could be string or ObjectId)
      const homeClubIdMatch = match.homeClubId === clubId || 
                              match.homeClubId?._id === clubId || 
                              match.homeClubId?.toString() === clubId?.toString();
      const awayClubIdMatch = match.awayClubId === clubId || 
                              match.awayClubId?._id === clubId || 
                              match.awayClubId?.toString() === clubId?.toString();
      
      // Check by team names (fallback)
      const homeTeamMatch = match.homeTeam === clubName;
      const awayTeamMatch = match.awayTeam === clubName;
      
      return homeMatch || awayMatch || homeTeamMatch || awayTeamMatch || homeClubIdMatch || awayClubIdMatch;
    });
    
    console.log('Filtered club matches:', this.clubMatches.length, 'out of', matches.length);
    
    console.log('Processed additional data:', {
      clubMatches: this.clubMatches.length,
      signedPlayers: this.signedPlayers.length,
      clubName: this.backendClub.name
    });
    
    // Debug: Check if club matches have stats
    if (this.clubMatches.length > 0) {
      const sampleClubMatch = this.clubMatches[0];
      console.log('=== CLUB MATCHES DATA CHECK ===');
      console.log('Sample club match has eashlData:', !!sampleClubMatch.eashlData);
      console.log('Sample club match has eashlData.players:', !!sampleClubMatch.eashlData?.players);
      console.log('Sample club match has playerStats:', !!sampleClubMatch.playerStats);
      console.log('Sample club match playerStats length:', sampleClubMatch.playerStats?.length || 0);
      console.log('==============================');
    }
    
    // Recalculate club stats now that we have matches data
    if (this.club) {
      const calculatedStats = this.calculateClubStats(this.backendClub._id, matches);
      this.club.stats = calculatedStats;
      console.log('Updated club stats:', calculatedStats);
    }
    
    // Now process stats with all data ready
    this.processPlayerStatsFromMatches(this.signedPlayers);
    this.cdr.markForCheck();
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
    this.selectedSeasonId = '';
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

  private triggerStatsProcessingIfReady() {
    // Check if we have all required data to process stats
    if (this.backendClub && this.clubMatches.length > 0 && this.signedPlayers.length > 0) {
      console.log('All data ready, processing player stats');
      // Clear stats before processing new ones
      this.skaterStats = [];
      this.goalieStats = [];
      this.cdr.markForCheck();
      this.processPlayerStatsFromMatches(this.signedPlayers);
    } else {
      console.log('Not ready for stats processing:', {
        hasBackendClub: !!this.backendClub,
        clubMatchesCount: this.clubMatches.length,
        signedPlayersCount: this.signedPlayers.length
      });
      // Clear stats if not ready
      this.skaterStats = [];
      this.goalieStats = [];
    }
  }

  private processPlayerStatsFromMatches(roster: any[]) {
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
        this.cdr.markForCheck();
        
        // Use the service to process stats
        const { skaterStats, goalieStats } = this.clubStatsService.processPlayerStatsFromMatches(
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
        this.cdr.markForCheck();
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

  getClubSeasons(club: any): any[] {
    if (!club || !club.seasons || !this.seasons) {
      console.log('ClubDetail: No club, club seasons, or all seasons available');
      return [];
    }
    
    // Extract season IDs from club seasons, handling both object and string formats
    const clubSeasonIds = club.seasons.map((clubSeason: any) => {
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
    
    console.log('ClubDetail: Filtered seasons for club:', filteredSeasons.map(s => ({ id: s._id, name: s.name })));
    
    return filteredSeasons;
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
    // Filter matches for this club
    // Use the same comprehensive filtering logic as processAdditionalData
    const currentClubId = this.backendClub?._id || clubId;
    const clubName = this.backendClub?.name;
    const clubMatches = matches.filter(match => {
      // Check by populated club objects
      const homeMatch = match.homeClub?.name === clubName || match.homeClub?._id === currentClubId;
      const awayMatch = match.awayClub?.name === clubName || match.awayClub?._id === currentClubId;
      
      // Check by club IDs (could be string or ObjectId)
      const homeClubIdMatch = match.homeClubId === currentClubId || 
                              match.homeClubId?._id === currentClubId || 
                              match.homeClubId?.toString() === currentClubId?.toString();
      const awayClubIdMatch = match.awayClubId === currentClubId || 
                              match.awayClubId?._id === currentClubId || 
                              match.awayClubId?.toString() === currentClubId?.toString();
      
      // Check by team names (fallback)
      const homeTeamMatch = match.homeTeam === clubName;
      const awayTeamMatch = match.awayTeam === clubName;
      
      return homeMatch || awayMatch || homeTeamMatch || awayTeamMatch || homeClubIdMatch || awayClubIdMatch;
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

    // Process each match
    clubMatches.forEach(match => {
      // Use comprehensive matching like the filter logic
      const isHomeTeam = match.homeClub?.name === clubName || 
                        match.homeClub?._id === currentClubId ||
                        match.homeClubId === currentClubId ||
                        match.homeClubId?._id === currentClubId ||
                        match.homeClubId?.toString() === currentClubId?.toString() ||
                        match.homeTeam === clubName;
      
      const isAwayTeam = match.awayClub?.name === clubName || 
                        match.awayClub?._id === currentClubId ||
                        match.awayClubId === currentClubId ||
                        match.awayClubId?._id === currentClubId ||
                        match.awayClubId?.toString() === currentClubId?.toString() ||
                        match.awayTeam === clubName;
      
      // Determine which team we are
      const ourIsHome = isHomeTeam && !isAwayTeam;
      const ourIsAway = isAwayTeam && !isHomeTeam;
      
      // Use the appropriate score based on which team we are
      const ourScore = ourIsHome ? match.homeScore : (ourIsAway ? match.awayScore : 0);
      const opponentScore = ourIsHome ? match.awayScore : (ourIsAway ? match.homeScore : 0);
      
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
          if ((ourIsHome && match.forfeit === 'forfeit-home') || 
              (ourIsAway && match.forfeit === 'forfeit-away')) {
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
