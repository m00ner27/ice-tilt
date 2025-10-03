import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ClubStatsService, SkaterStats, GoalieStats } from './services/club-stats.service';
import { MatchHistoryComponent } from './match-history/match-history.component';
import { ClubHeaderComponent } from './club-header/club-header.component';
import { ClubStatsGridComponent } from './club-stats-grid/club-stats-grid.component';
import { ClubRosterTablesComponent } from './club-roster-tables/club-roster-tables.component';
import { ClubStatLegendComponent } from './club-stat-legend/club-stat-legend.component';
import { Club } from '../store/models/models/club.interface';

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
  imports: [CommonModule, RouterModule, MatchHistoryComponent, ClubHeaderComponent, ClubStatsGridComponent, ClubRosterTablesComponent, ClubStatLegendComponent],
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
  loading: boolean = false;
  error: string | null = null;
  currentClubId: string = '';
  
  // Additional properties for template
  signedPlayers: any[] = [];
      skaterStats: SkaterStats[] = [];
      goalieStats: GoalieStats[] = [];
  matches: any[] = [];
  clubMatches: any[] = [];
      
      // Track if we're switching clubs to prevent stale data
      private isSwitchingClubs: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
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
        
        // Update club roster selector for the new club
        this.clubRoster$ = this.store.select(ClubsSelectors.selectClubRoster(club._id));
        
        // Set up roster subscription for the new club
        this.setupRosterSubscription();
        
        // Reset season selection for the new club
        this.selectedSeasonId = '';
        
        // Trigger season selection now that we have the club data
        this.selectSeasonForClub();
        
        // Load roster for the selected season (or default season)
        if (this.selectedSeasonId) {
          this.ngrxApiService.loadClubRoster(club._id, this.selectedSeasonId);
        }
        
        // Trigger stats processing if we already have matches loaded
        this.triggerStatsProcessingIfReady();
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

    // Subscribe to matches and recalculate stats when they change
    this.matches$.pipe(takeUntil(this.destroy$)).subscribe(matches => {
      this.matches = matches;
      console.log('All matches loaded:', matches.length);
      console.log('First few matches:', matches.slice(0, 3).map(m => ({ 
        id: m._id || m.id, 
        homeTeam: m.homeTeam, 
        awayTeam: m.awayTeam,
        homeClub: m.homeClub,
        awayClub: m.awayClub,
            seasonId: m.seasonId,
            homeClubType: typeof m.homeClub,
            awayClubType: typeof m.awayClub
      })));
          
          // Debug: Show a sample match structure
          if (matches.length > 0) {
            console.log('Sample match structure:', JSON.stringify(matches[0], null, 2));
          }
      
      // Filter matches for current club
          if (this.backendClub && !this.isSwitchingClubs) {
        console.log('Filtering matches for club:', this.backendClub.name);
        
        // Filter matches for the current club - be very strict about matching
        let clubMatches = matches.filter(match => {
          const homeMatch = match.homeClub?.name === this.backendClub?.name;
          const awayMatch = match.awayClub?.name === this.backendClub?.name;
          const homeTeamMatch = match.homeTeam === this.backendClub?.name;
          const awayTeamMatch = match.awayTeam === this.backendClub?.name;
          
          // Also check if homeClub or awayClub are objects with _id property
          const homeClubIdMatch = match.homeClub?._id === this.backendClub?._id;
          const awayClubIdMatch = match.awayClub?._id === this.backendClub?._id;
          
          const isMatch = homeMatch || awayMatch || homeTeamMatch || awayTeamMatch || homeClubIdMatch || awayClubIdMatch;
          
          console.log(`Match ${match._id || match.id}:`, {
            homeClub: match.homeClub?.name || match.homeClub?._id,
            awayClub: match.awayClub?.name || match.awayClub?._id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            homeMatch,
            awayMatch,
            homeTeamMatch,
            awayTeamMatch,
            homeClubIdMatch,
            awayClubIdMatch,
            ourClubId: this.backendClub?._id,
            ourClubName: this.backendClub?.name,
            isMatch
          });
          
          return isMatch;
        });
        
        console.log('Filtered club matches:', clubMatches.length);
        console.log('Club matches details:', clubMatches.map(m => ({ 
          id: m._id || m.id, 
          homeTeam: m.homeTeam, 
          awayTeam: m.awayTeam,
          homeClubId: m.homeClubId?.name,
          awayClubId: m.awayClubId?.name
        })));
        
        // Safety check: If no matches found, log a warning
        if (clubMatches.length === 0) {
          console.warn(`No matches found for club: ${this.backendClub?.name}`);
          console.warn('Available match teams:', matches.map(m => ({ 
            id: m._id || m.id, 
            homeTeam: m.homeTeam, 
            awayTeam: m.awayTeam,
            homeClubId: m.homeClubId?.name,
            awayClubId: m.awayClubId?.name
          })));
        }
        
        this.clubMatches = clubMatches;
        this.club = this.mapBackendClubToFrontend(this.backendClub);
        
        // Trigger stats processing if all data is ready
        this.triggerStatsProcessingIfReady();
      }
    });

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
    
    // Load club using NgRx
    this.ngrxApiService.loadClub(clubId);
    this.ngrxApiService.loadClubs();
    this.ngrxApiService.loadSeasons();
    this.ngrxApiService.loadMatches();
  }

  selectSeasonForClub() {
    // Only auto-select if we don't have a season selected yet
    if (this.selectedSeasonId) {
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
      this.processRosterData(roster);
    });
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
    if (this.backendClub && this.clubMatches.length > 0) {
      console.log('All data ready, processing player stats');
      // Clear stats before processing new ones
      this.skaterStats = [];
      this.goalieStats = [];
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
        console.log('========================');
        
        // Clear previous stats before processing new ones
        this.skaterStats = [];
        this.goalieStats = [];
        this.cdr.detectChanges();
        
        // Use the service to process stats
        const { skaterStats, goalieStats } = this.clubStatsService.processPlayerStatsFromMatches(
          this.clubMatches,
          roster,
          this.backendClub
        );
        
        this.skaterStats = skaterStats;
        this.goalieStats = goalieStats;
        
        console.log('Stats processing complete - triggering UI update');
        this.cdr.detectChanges();
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
    if (!club || !club.seasons) return [];
    
    // Filter seasons that this club is part of
    const filteredSeasons = this.seasons.filter(season => 
      club.seasons.includes(season._id)
    );
    
    console.log('ClubDetail: Club season IDs:', club.seasons);
    console.log('ClubDetail: All seasons:', this.seasons);
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
    
    // Calculate stats from matches
    const calculatedStats = this.calculateClubStats(backendClub._id);
    
    return {
      ...backendClub,
      clubName: backendClub.name,
      colour: backendClub.primaryColour,
      image: this.getImageUrl(backendClub.logoUrl),
      stats: calculatedStats
    };
  }

  calculateClubStats(clubId: string): any {
    // Filter matches for this club
    const clubMatches = this.matches.filter(match => 
      match.homeTeam === this.backendClub?.name || match.awayTeam === this.backendClub?.name
    );

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
      const isHomeTeam = match.homeTeam === this.backendClub?.name;
      const ourScore = isHomeTeam ? match.homeScore : match.awayScore;
      const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;
      
      goalsFor += ourScore;
      goalsAgainst += opponentScore;

      // Only count games that have been played (have EASHL data or actual scores > 0)
      const hasBeenPlayed = match.eashlData && match.eashlData.matchId || 
                           (ourScore > 0 || opponentScore > 0) ||
                           (match.isOvertime || match.isShootout);

      if (hasBeenPlayed) {
        // Determine result
        if (ourScore > opponentScore) {
          wins++;
          lastTenResults.push('W');
        } else if (ourScore < opponentScore) {
          losses++;
          lastTenResults.push('L');
        } else {
          // Only count as OTL if it was actually an overtime/shootout game
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
