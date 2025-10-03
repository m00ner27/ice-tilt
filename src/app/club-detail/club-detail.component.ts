import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ImageUrlService } from '../shared/services/image-url.service';
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
      skaterStats: any[] = [];
      goalieStats: any[] = [];
      matches: any[] = [];
      clubMatches: any[] = [];
      
      // Track if we're switching clubs to prevent stale data
      private isSwitchingClubs: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private imageUrlService: ImageUrlService,
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
            homeClubId: m.homeClubId,
            awayClubId: m.awayClubId,
            seasonId: m.seasonId,
            homeClubIdType: typeof m.homeClubId,
            awayClubIdType: typeof m.awayClubId
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
          const homeMatch = match.homeClubId?.name === this.backendClub?.name;
          const awayMatch = match.awayClubId?.name === this.backendClub?.name;
          const homeTeamMatch = match.homeTeam === this.backendClub?.name;
          const awayTeamMatch = match.awayTeam === this.backendClub?.name;
          
          // Also check if homeClubId or awayClubId are objects with _id property
          const homeClubIdMatch = match.homeClubId?._id === this.backendClub?._id;
          const awayClubIdMatch = match.awayClubId?._id === this.backendClub?._id;
          
          const isMatch = homeMatch || awayMatch || homeTeamMatch || awayTeamMatch || homeClubIdMatch || awayClubIdMatch;
          
          console.log(`Match ${match._id || match.id}:`, {
            homeClubId: match.homeClubId?.name || match.homeClubId?._id,
            awayClubId: match.awayClubId?.name || match.awayClubId?._id,
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
    const clubSeasons = this.getClubSeasons();
    
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
    console.log('Club matches:', this.clubMatches.map(m => ({
      id: m.id || m._id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      hasEashlData: !!m.eashlData,
      isManualEntry: m.eashlData?.manualEntry,
      hasPlayerStats: !!m.playerStats,
      playerStatsCount: m.playerStats?.length || 0
    })));
    console.log('========================');
    
    // Clear previous stats before processing new ones
    this.skaterStats = [];
    this.goalieStats = [];
    this.cdr.detectChanges();
    
    const playerStatsMap = new Map<string, any>();

    // First, collect all players who played for this team from match data (including unsigned ones)
    const allPlayersWhoPlayed = new Set<string>();
    
    this.clubMatches.forEach(match => {
      console.log(`Processing match ${match._id || match.id} for club ${this.backendClub?.name}:`, {
        hasEashlData: !!match.eashlData,
        isManualEntry: match.eashlData?.manualEntry,
        hasPlayerStats: !!match.playerStats,
        hasPlayers: !!match.eashlData?.players,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam
      });
      
      if (!match.eashlData) {
        console.log(`Skipping match ${match._id || match.id}: no eashlData`);
        return; // Skip if no eashlData
      }

      if (match.eashlData.manualEntry && match.playerStats) {
        console.log(`Collecting manual entry players for match ${match._id || match.id}`);
        console.log('Manual entry playerStats:', match.playerStats);
        const ourPlayers = match.playerStats.filter((player: any) => {
          const matches = player.team === this.backendClub?.name;
          console.log(`Player ${player.name}: team="${player.team}" vs club="${this.backendClub?.name}" = ${matches}`);
          return matches;
        });
        console.log(`Found ${ourPlayers.length} players for ${this.backendClub?.name} in manual entry:`, ourPlayers.map((p: any) => p.name));
        ourPlayers.forEach((playerData: any) => {
          if (playerData && playerData.name) {
            allPlayersWhoPlayed.add(playerData.name);
          }
        });
      } else if (match.eashlData.players) {
        // Process EASHL data - players is an object, not an array
        console.log(`Collecting EASHL players for match ${match._id || match.id}`);
        console.log('EASHL players structure:', match.eashlData.players);
        console.log('Our team name:', this.backendClub?.name);
        
        // Try to identify which team key represents our team
        const teamKeys = Object.keys(match.eashlData.players);
        console.log('EASHL team keys for collection:', teamKeys);
        
        let ourTeamKey = null;
        for (const teamKey of teamKeys) {
          const teamPlayers = match.eashlData.players[teamKey];
          if (typeof teamPlayers === 'object' && teamPlayers !== null) {
            // Check if any player in this team is in our current roster
            const hasRosterPlayer = Object.values(teamPlayers).some((playerData: any) => 
              playerData && playerData.playername && 
              roster.some(rosterPlayer => 
                rosterPlayer.gamertag === playerData.playername
              )
            );
            
            if (hasRosterPlayer) {
              ourTeamKey = teamKey;
              console.log(`Found our team key for collection: ${teamKey} (has roster player)`);
              break;
            }
            
            // Fallback: Check if any player in this team has our club name in their data
            const hasClubNameMatch = Object.values(teamPlayers).some((playerData: any) => 
              playerData && (
                playerData.clubname === this.backendClub?.name ||
                playerData.team === this.backendClub?.name ||
                (playerData.ishome && match.homeTeam === this.backendClub?.name) ||
                (!playerData.ishome && match.awayTeam === this.backendClub?.name)
              )
            );
            
            // Debug: Log what we're checking for team identification
            console.log(`Team ${teamKey} player data sample:`, Object.values(teamPlayers).slice(0, 2).map((p: any) => ({
              playername: p.playername,
              clubname: p.clubname,
              team: p.team,
              ishome: p.ishome
            })));
            console.log(`Match teams: home=${match.homeTeam}, away=${match.awayTeam}`);
            console.log(`Our club: ${this.backendClub?.name}`);
            console.log(`Club name match: ${hasClubNameMatch}`);
            
            // Additional validation: Check if this team actually contains players from our club
            // by looking at the match result and seeing if the team's performance matches our club's result
            if (hasClubNameMatch) {
              // Double-check: If we're the away team, make sure this team's players are marked as away
              // If we're the home team, make sure this team's players are marked as home
              const isHomeTeam = match.homeTeam === this.backendClub?.name;
              const teamPlayersAreHome = Object.values(teamPlayers).some((playerData: any) => playerData && playerData.ishome === true);
              const teamPlayersAreAway = Object.values(teamPlayers).some((playerData: any) => playerData && playerData.ishome === false);
              
              console.log(`Team ${teamKey} validation: isHomeTeam=${isHomeTeam}, teamPlayersAreHome=${teamPlayersAreHome}, teamPlayersAreAway=${teamPlayersAreAway}`);
              
              // Only proceed if the home/away status matches
              if ((isHomeTeam && teamPlayersAreHome) || (!isHomeTeam && teamPlayersAreAway)) {
                ourTeamKey = teamKey;
                console.log(`Found our team key for collection: ${teamKey} (club name match with home/away validation)`);
                break;
              } else {
                console.log(`Team ${teamKey} failed home/away validation, continuing search...`);
              }
            }
          }
        }
        
        // Additional fallback: If no team found by club name, try to identify by home/away status only
        if (!ourTeamKey) {
          console.log('No team found by club name, trying home/away status fallback...');
          for (const teamKey of teamKeys) {
            const teamPlayers = match.eashlData.players[teamKey];
            if (typeof teamPlayers === 'object' && teamPlayers !== null) {
              const isHomeTeam = match.homeTeam === this.backendClub?.name;
              const teamPlayersAreHome = Object.values(teamPlayers).some((playerData: any) => playerData && playerData.ishome === true);
              const teamPlayersAreAway = Object.values(teamPlayers).some((playerData: any) => playerData && playerData.ishome === false);
              
              // Debug: Show actual ishome values
              const ishomeValues = Object.values(teamPlayers).map((playerData: any) => playerData?.ishome);
              console.log(`Team ${teamKey} home/away check: isHomeTeam=${isHomeTeam}, teamPlayersAreHome=${teamPlayersAreHome}, teamPlayersAreAway=${teamPlayersAreAway}`);
              console.log(`Team ${teamKey} actual ishome values:`, ishomeValues);
              
              // If we're the home team and this team's players are marked as home, it's our team
              // If we're the away team and this team's players are marked as away, it's our team
              if ((isHomeTeam && teamPlayersAreHome) || (!isHomeTeam && teamPlayersAreAway)) {
                ourTeamKey = teamKey;
                console.log(`Found our team key for collection: ${teamKey} (home/away status fallback)`);
                break;
              }
              
              // Additional fallback: If ishome field is not available, try to identify by team order
              // This is a last resort when EASHL data doesn't have proper home/away flags
              if (!teamPlayersAreHome && !teamPlayersAreAway) {
                console.log(`Team ${teamKey} has no ishome data, trying team order fallback...`);
                // If we're the home team and this is the first team we're checking, assume it's our team
                // If we're the away team and this is the second team we're checking, assume it's our team
                const teamIndex = teamKeys.indexOf(teamKey);
                console.log(`Team order check: isHomeTeam=${isHomeTeam}, teamIndex=${teamIndex}, teamKeys=${teamKeys.join(',')}`);
                
                // Try both possible team orders since EASHL data might not follow expected order
                // Based on the logs, it seems the EASHL data has teams in reverse order
                if ((isHomeTeam && teamIndex === 1) || (!isHomeTeam && teamIndex === 0)) {
                  // Try the reverse order first since that seems to be the actual order
                  ourTeamKey = teamKey;
                  console.log(`Found our team key for collection: ${teamKey} (team order fallback - reverse order - isHomeTeam=${isHomeTeam}, teamIndex=${teamIndex})`);
                  break;
                } else if ((isHomeTeam && teamIndex === 0) || (!isHomeTeam && teamIndex === 1)) {
                  // Try the normal order as fallback
                  ourTeamKey = teamKey;
                  console.log(`Found our team key for collection: ${teamKey} (team order fallback - normal order - isHomeTeam=${isHomeTeam}, teamIndex=${teamIndex})`);
                  break;
                }
              }
            }
          }
        }
        
        // Final fallback: If still no team found, try to identify by roster player matching
        if (!ourTeamKey && roster.length > 0) {
          console.log('No team found by other methods, trying roster player matching fallback...');
          const rosterGamertags = roster.map(player => player.gamertag).filter(Boolean);
          console.log('Looking for roster players in EASHL data:', rosterGamertags);
          
          for (const teamKey of teamKeys) {
            const teamPlayers = match.eashlData.players[teamKey];
            if (typeof teamPlayers === 'object' && teamPlayers !== null) {
              const teamPlayerNames = Object.values(teamPlayers).map((playerData: any) => playerData?.playername).filter(Boolean);
              console.log(`Team ${teamKey} players:`, teamPlayerNames);
              
              // Check if any roster player is in this team
              const hasRosterPlayer = teamPlayerNames.some(playerName => 
                rosterGamertags.some(gamertag => 
                  playerName.toLowerCase() === gamertag.toLowerCase()
                )
              );
              
              if (hasRosterPlayer) {
                ourTeamKey = teamKey;
                console.log(`Found our team key for collection: ${teamKey} (roster player matching fallback)`);
                break;
              }
            }
          }
        }
        
        // If we found our team key, collect all players from that team
        if (ourTeamKey) {
          const ourTeamPlayers = match.eashlData.players[ourTeamKey];
          if (typeof ourTeamPlayers === 'object' && ourTeamPlayers !== null) {
            console.log(`Collecting players from team ${ourTeamKey} for ${this.backendClub?.name}:`);
            console.log('Team players:', Object.values(ourTeamPlayers).map((p: any) => p.playername));
            
            // Debug: Show what team this actually is by checking if it contains roster players
            const rosterGamertags = roster.map(player => player.gamertag).filter(Boolean);
            const teamPlayerNames = Object.values(ourTeamPlayers).map((p: any) => p.playername);
            const hasRosterPlayer = teamPlayerNames.some(playerName => 
              rosterGamertags.some(gamertag => 
                playerName.toLowerCase() === gamertag.toLowerCase()
              )
            );
            console.log(`Team ${ourTeamKey} contains roster players: ${hasRosterPlayer}`);
            console.log(`Roster players: ${rosterGamertags.join(', ')}`);
            console.log(`Team players: ${teamPlayerNames.join(', ')}`);
            
            Object.values(ourTeamPlayers).forEach((playerData: any) => {
              if (!playerData || !playerData.playername) return;

              console.log('Adding EASHL player to collection:', {
                name: playerData.playername,
                team: playerData.team,
                clubname: playerData.clubname,
                ishome: playerData.ishome
              });

              console.log(`Adding player to collection: ${playerData.playername}`);
              allPlayersWhoPlayed.add(playerData.playername);
            });
          }
        } else {
          console.log(`No team key found for ${this.backendClub?.name}. Available teams:`, teamKeys);
          console.log('Available team players:');
          const rosterGamertags = roster.map(player => player.gamertag).filter(Boolean);
          teamKeys.forEach(teamKey => {
            const teamPlayers = match.eashlData.players[teamKey];
            if (typeof teamPlayers === 'object' && teamPlayers !== null) {
              const teamPlayerNames = Object.values(teamPlayers).map((p: any) => p.playername);
              const hasRosterPlayer = teamPlayerNames.some(playerName => 
                rosterGamertags.some(gamertag => 
                  playerName.toLowerCase() === gamertag.toLowerCase()
                )
              );
              console.log(`Team ${teamKey}:`, teamPlayerNames, `(contains roster players: ${hasRosterPlayer})`);
            }
          });
        }
      }
    });

    console.log('All players who played for this team:', Array.from(allPlayersWhoPlayed));

    // Create a map of signed players for quick lookup
    const signedPlayerNames = new Set(roster.map(player => player.gamertag).filter(Boolean));

    // Initialize stats for all players who played for this team (both signed and unsigned)
    allPlayersWhoPlayed.forEach(playerName => {
      const isSigned = signedPlayerNames.has(playerName);

      const baseSkaterStats = {
        playerId: isSigned ? roster.find(p => p.gamertag === playerName)?._id || roster.find(p => p.gamertag === playerName)?.id || 0 : 0,
        name: playerName,
        number: isSigned ? roster.find(p => p.gamertag === playerName)?.number || 0 : 0,
        position: 'Unknown', // Will be determined by game performance
        role: 'skater', // Track the role
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        otLosses: 0,
        goals: 0,
        assists: 0,
        points: 0,
        plusMinus: 0,
        shots: 0,
        shotPercentage: 0,
        hits: 0,
        blockedShots: 0,
        pim: 0,
        ppg: 0,
        shg: 0,
        gwg: 0,
        takeaways: 0,
        giveaways: 0,
        passes: 0,
        passAttempts: 0,
        passPercentage: 0,
        faceoffsWon: 0,
        faceoffPercentage: 0,
        playerScore: 0,
        penaltyKillCorsiZone: 0,
        isSigned: isSigned,
        // Goalie-specific stats (set to 0 for skater role)
        saves: 0,
        shotsAgainst: 0,
        goalsAgainst: 0,
        savePercentage: 0,
        goalsAgainstAverage: 0,
        shutouts: 0,
        otl: 0
      };

      const baseGoalieStats = {
        playerId: isSigned ? roster.find(p => p.gamertag === playerName)?._id || roster.find(p => p.gamertag === playerName)?.id || 0 : 0,
        name: playerName,
        number: isSigned ? roster.find(p => p.gamertag === playerName)?.number || 0 : 0,
        position: 'G',
        role: 'goalie', // Track the role
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        otLosses: 0,
        goals: 0, // Goalies don't score goals
        assists: 0,
        points: 0,
        plusMinus: 0, // Goalies don't have plus/minus
        shots: 0, // Goalies don't take shots
        shotPercentage: 0,
        hits: 0, // Goalies don't hit
        blockedShots: 0, // Goalies don't block shots
        pim: 0,
        ppg: 0, // Goalies don't have power play goals
        shg: 0, // Goalies don't have short handed goals
        gwg: 0, // Goalies don't have game winning goals
        takeaways: 0, // Goalies don't have takeaways
        giveaways: 0, // Goalies don't have giveaways
        passes: 0, // Goalies don't have passes
        passAttempts: 0, // Goalies don't have pass attempts
        faceoffsWon: 0, // Goalies don't take faceoffs
        faceoffPercentage: 0,
        playerScore: 0,
        penaltyKillCorsiZone: 0, // Goalies don't have PKC
        // Goalie-specific stats
        saves: 0,
        shotsAgainst: 0,
        goalsAgainst: 0,
        savePercentage: 0,
        goalsAgainstAverage: 0,
        shutouts: 0,
        otl: 0,
        isSigned: isSigned
      };

      // Create separate entries for skater and goalie roles
      playerStatsMap.set(`${playerName}_skater`, baseSkaterStats);
      playerStatsMap.set(`${playerName}_goalie`, baseGoalieStats);
    });

    // Create a set of roster player names for quick lookup
    const rosterPlayerNames = new Set(roster.map(p => p.gamertag).filter(Boolean));
    console.log('Roster player names for stats processing:', Array.from(rosterPlayerNames));

    // Also initialize stats for roster players who might not have played yet
    roster.forEach(player => {
      if (!player || !player.gamertag) return;

      const baseSkaterStats = {
        playerId: player._id || player.id,
        name: player.gamertag,
        number: player.number || 0,
        position: 'Unknown', // Will be determined by game performance
        role: 'skater', // Track the role
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        otLosses: 0,
        goals: 0,
        assists: 0,
        points: 0,
        plusMinus: 0,
        shots: 0,
        shotPercentage: 0,
        hits: 0,
        blockedShots: 0,
        pim: 0,
        ppg: 0,
        shg: 0,
        gwg: 0,
        takeaways: 0,
        giveaways: 0,
        passes: 0,
        passAttempts: 0,
        passPercentage: 0,
        faceoffsWon: 0,
        faceoffPercentage: 0,
        playerScore: 0,
        penaltyKillCorsiZone: 0,
        // Goalie-specific stats (set to 0 for skater role)
        saves: 0,
        shotsAgainst: 0,
        goalsAgainst: 0,
        savePercentage: 0,
        goalsAgainstAverage: 0,
        shutouts: 0,
        otl: 0,
        isSigned: true
      };

      const baseGoalieStats = {
        playerId: player._id || player.id,
        name: player.gamertag,
        number: player.number || 0,
        position: 'G',
        role: 'goalie', // Track the role
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        otLosses: 0,
        goals: 0, // Goalies don't score goals
        assists: 0,
        points: 0,
        plusMinus: 0, // Goalies don't have plus/minus
        shots: 0, // Goalies don't take shots
        shotPercentage: 0,
        hits: 0, // Goalies don't hit
        blockedShots: 0, // Goalies don't block shots
        pim: 0,
        ppg: 0, // Goalies don't have power play goals
        shg: 0, // Goalies don't have short handed goals
        gwg: 0, // Goalies don't have game winning goals
        takeaways: 0, // Goalies don't have takeaways
        giveaways: 0, // Goalies don't have giveaways
        passes: 0, // Goalies don't have passes
        passAttempts: 0, // Goalies don't have pass attempts
        passPercentage: 0,
        faceoffsWon: 0, // Goalies don't take faceoffs
        faceoffPercentage: 0,
        playerScore: 0,
        penaltyKillCorsiZone: 0, // Goalies don't have PKC
        // Goalie-specific stats
        saves: 0,
        shotsAgainst: 0,
        goalsAgainst: 0,
        savePercentage: 0,
        goalsAgainstAverage: 0,
        shutouts: 0,
        otl: 0,
        isSigned: true
      };

      // Create separate entries for skater and goalie roles
      playerStatsMap.set(`${player.gamertag}_skater`, baseSkaterStats);
      playerStatsMap.set(`${player.gamertag}_goalie`, baseGoalieStats);
    });


    // Process matches to calculate stats
    console.log('Processing', this.clubMatches.length, 'club matches for stats calculation');
    console.log('Player stats map before processing matches:', Array.from(playerStatsMap.keys()));
    this.clubMatches.forEach((match, index) => {
      console.log(`Match ${index + 1}:`, {
        id: match._id || match.id,
        hasEashlData: !!match.eashlData,
        hasPlayers: !!(match.eashlData && match.eashlData.players),
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore
      });
      
      if (!match.eashlData || !match.eashlData.players) {
        console.log(`Skipping match ${match._id || match.id}: no eashlData or players`);
        return;
      }

      const isHomeTeam = match.homeTeam === this.backendClub?.name;
      const ourScore = isHomeTeam ? match.homeScore : match.awayScore;
      const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;
      const won = ourScore > opponentScore;
      const lost = ourScore < opponentScore;
      const otLoss = ourScore === opponentScore;

      // Process player stats from match data
      if (match.eashlData.manualEntry && match.playerStats) {
        // Process manual stats: players are processed by match service and stored in match.playerStats
        const ourPlayers = match.playerStats.filter((player: any) => 
          player.team === this.backendClub?.name
        );
        
        ourPlayers.forEach((playerData: any) => {
          if (!playerData || !playerData.name) return;

          const playerName = playerData.name;
          
          console.log(`Processing manual stats player: ${playerName}, game position: ${playerData.position}`);
          console.log('Available players:', Array.from(playerStatsMap.keys()));

          // Determine if this is a goalie based on position
          const isGoalie = playerData.position === 'G' || playerData.position === 'goalie';
          const roleSuffix = isGoalie ? '_goalie' : '_skater';
          
          // Try to find a matching player by name with the correct role
          let matchingKey = null;
          
          if (playerStatsMap.has(`${playerName}${roleSuffix}`)) {
            matchingKey = `${playerName}${roleSuffix}`;
          } else {
            // Try partial match with role suffix
            for (const [key, stats] of playerStatsMap.entries()) {
              if (key.endsWith(roleSuffix) && (stats.name === playerName || 
                  stats.name.includes(playerName) || 
                  playerName.includes(stats.name))) {
                matchingKey = key;
                break;
              }
            }
          }

          if (matchingKey) {
            console.log(`Found matching player: ${playerName} -> ${matchingKey}`);
            const playerStats = playerStatsMap.get(matchingKey);
            playerStats.gamesPlayed++;
            if (won) playerStats.wins++;
            else if (lost) playerStats.losses++;
            else if (otLoss) playerStats.otLosses++;

            if (isGoalie) {
              // Process as goalie - update goalie-specific stats
              playerStats.saves += Number(playerData.saves) || 0;
              playerStats.shotsAgainst += Number(playerData.shotsAgainst) || 0;
              playerStats.goalsAgainst += Number(playerData.goalsAgainst) || 0;
              playerStats.goalsAgainstAverage = playerStats.gamesPlayed > 0 ? 
                playerStats.goalsAgainst / playerStats.gamesPlayed : 0;
              playerStats.savePercentage = playerStats.shotsAgainst > 0 ? 
                playerStats.saves / playerStats.shotsAgainst : 0;
              
              // Update position to G
              playerStats.position = 'G';
            } else {
              // Process as skater - update skater-specific stats
              playerStats.goals += Number(playerData.goals) || 0;
              playerStats.assists += Number(playerData.assists) || 0;
              playerStats.points = playerStats.goals + playerStats.assists;
              playerStats.plusMinus += Number(playerData.plusMinus) || 0;
              playerStats.shots += Number(playerData.shots) || 0;
              playerStats.hits += Number(playerData.hits) || 0;
              playerStats.blockedShots += Number(playerData.blockedShots) || 0;
              playerStats.pim += Number(playerData.penaltyMinutes) || 0;
              playerStats.ppg += Number(playerData.powerPlayGoals) || 0;
              playerStats.shg += Number(playerData.shortHandedGoals) || 0;
              playerStats.gwg += Number(playerData.gameWinningGoals) || 0;
              playerStats.takeaways += Number(playerData.takeaways) || 0;
              playerStats.giveaways += Number(playerData.giveaways) || 0;
              playerStats.passes += Number(playerData.passesCompleted) || 0;
              playerStats.passAttempts += Number(playerData.passAttempts) || 0;
              playerStats.faceoffsWon += Number(playerData.faceoffsWon) || 0;
              playerStats.playerScore += Number(playerData.score) || 0;
              playerStats.penaltyKillCorsiZone += Number(playerData.penaltyKillCorsiZone) || 0;
              
              // Update position to skater position
              playerStats.position = playerData.position || 'C';
            }
          } else {
            console.log(`No matching player found for: ${playerName}`);
          }
        });
      } else {
        // Process EASHL data
        // First, identify which team key represents our team
        const teamKeys = Object.keys(match.eashlData.players);
        console.log('EASHL team keys for processing:', teamKeys);

        let ourTeamKey = null;
        for (const teamKey of teamKeys) {
          const teamPlayers = match.eashlData.players[teamKey];
          if (typeof teamPlayers === 'object' && teamPlayers !== null) {
            // Check if any player in this team is in our current roster
            const hasRosterPlayer = Object.values(teamPlayers).some((playerData: any) =>
              playerData && playerData.playername &&
              roster.some(rosterPlayer =>
                rosterPlayer.gamertag === playerData.playername
              )
            );

            if (hasRosterPlayer) {
              ourTeamKey = teamKey;
              console.log(`Found our team key for processing: ${teamKey} (has roster player)`);
              break;
            }
            
            // Fallback: Check if any player in this team has our club name in their data
            const hasClubNameMatch = Object.values(teamPlayers).some((playerData: any) => 
              playerData && (
                playerData.clubname === this.backendClub?.name ||
                playerData.team === this.backendClub?.name ||
                (playerData.ishome && match.homeTeam === this.backendClub?.name) ||
                (!playerData.ishome && match.awayTeam === this.backendClub?.name)
              )
            );
            
            // Debug: Log what we're checking for team identification
            console.log(`Team ${teamKey} player data sample:`, Object.values(teamPlayers).slice(0, 2).map((p: any) => ({
              playername: p.playername,
              clubname: p.clubname,
              team: p.team,
              ishome: p.ishome
            })));
            console.log(`Match teams: home=${match.homeTeam}, away=${match.awayTeam}`);
            console.log(`Our club: ${this.backendClub?.name}`);
            console.log(`Club name match: ${hasClubNameMatch}`);
            
            // Additional validation: Check if this team actually contains players from our club
            // by looking at the match result and seeing if the team's performance matches our club's result
            if (hasClubNameMatch) {
              // Double-check: If we're the away team, make sure this team's players are marked as away
              // If we're the home team, make sure this team's players are marked as home
              const isHomeTeam = match.homeTeam === this.backendClub?.name;
              const teamPlayersAreHome = Object.values(teamPlayers).some((playerData: any) => playerData && playerData.ishome === true);
              const teamPlayersAreAway = Object.values(teamPlayers).some((playerData: any) => playerData && playerData.ishome === false);
              
              console.log(`Team ${teamKey} validation: isHomeTeam=${isHomeTeam}, teamPlayersAreHome=${teamPlayersAreHome}, teamPlayersAreAway=${teamPlayersAreAway}`);
              
              // Only proceed if the home/away status matches
              if ((isHomeTeam && teamPlayersAreHome) || (!isHomeTeam && teamPlayersAreAway)) {
                ourTeamKey = teamKey;
                console.log(`Found our team key for processing: ${teamKey} (club name match with home/away validation)`);
                break;
              } else {
                console.log(`Team ${teamKey} failed home/away validation, continuing search...`);
              }
            }
          }
        }

        // Additional fallback: If no team found by club name, try to identify by home/away status only
        if (!ourTeamKey) {
          console.log('No team found by club name for processing, trying home/away status fallback...');
          for (const teamKey of teamKeys) {
            const teamPlayers = match.eashlData.players[teamKey];
            if (typeof teamPlayers === 'object' && teamPlayers !== null) {
              const isHomeTeam = match.homeTeam === this.backendClub?.name;
              const teamPlayersAreHome = Object.values(teamPlayers).some((playerData: any) => playerData && playerData.ishome === true);
              const teamPlayersAreAway = Object.values(teamPlayers).some((playerData: any) => playerData && playerData.ishome === false);
              
              // Debug: Show actual ishome values
              const ishomeValues = Object.values(teamPlayers).map((playerData: any) => playerData?.ishome);
              console.log(`Team ${teamKey} home/away check for processing: isHomeTeam=${isHomeTeam}, teamPlayersAreHome=${teamPlayersAreHome}, teamPlayersAreAway=${teamPlayersAreAway}`);
              console.log(`Team ${teamKey} actual ishome values for processing:`, ishomeValues);
              
              // If we're the home team and this team's players are marked as home, it's our team
              // If we're the away team and this team's players are marked as away, it's our team
              if ((isHomeTeam && teamPlayersAreHome) || (!isHomeTeam && teamPlayersAreAway)) {
                ourTeamKey = teamKey;
                console.log(`Found our team key for processing: ${teamKey} (home/away status fallback)`);
                break;
              }
              
              // Additional fallback: If ishome field is not available, try to identify by team order
              // This is a last resort when EASHL data doesn't have proper home/away flags
              if (!teamPlayersAreHome && !teamPlayersAreAway) {
                console.log(`Team ${teamKey} has no ishome data for processing, trying team order fallback...`);
                // If we're the home team and this is the first team we're checking, assume it's our team
                // If we're the away team and this is the second team we're checking, assume it's our team
                const teamIndex = teamKeys.indexOf(teamKey);
                console.log(`Team order check for processing: isHomeTeam=${isHomeTeam}, teamIndex=${teamIndex}, teamKeys=${teamKeys.join(',')}`);
                
                // Try both possible team orders since EASHL data might not follow expected order
                // Based on the logs, it seems the EASHL data has teams in reverse order
                if ((isHomeTeam && teamIndex === 1) || (!isHomeTeam && teamIndex === 0)) {
                  // Try the reverse order first since that seems to be the actual order
                  ourTeamKey = teamKey;
                  console.log(`Found our team key for processing: ${teamKey} (team order fallback - reverse order - isHomeTeam=${isHomeTeam}, teamIndex=${teamIndex})`);
                  break;
                } else if ((isHomeTeam && teamIndex === 0) || (!isHomeTeam && teamIndex === 1)) {
                  // Try the normal order as fallback
                  ourTeamKey = teamKey;
                  console.log(`Found our team key for processing: ${teamKey} (team order fallback - normal order - isHomeTeam=${isHomeTeam}, teamIndex=${teamIndex})`);
                  break;
                }
              }
            }
          }
        }
        
        // Final fallback: If still no team found, try to identify by roster player matching
        if (!ourTeamKey && roster.length > 0) {
          console.log('No team found by other methods for processing, trying roster player matching fallback...');
          const rosterGamertags = roster.map(player => player.gamertag).filter(Boolean);
          console.log('Looking for roster players in EASHL data for processing:', rosterGamertags);
          
          for (const teamKey of teamKeys) {
            const teamPlayers = match.eashlData.players[teamKey];
            if (typeof teamPlayers === 'object' && teamPlayers !== null) {
              const teamPlayerNames = Object.values(teamPlayers).map((playerData: any) => playerData?.playername).filter(Boolean);
              console.log(`Team ${teamKey} players for processing:`, teamPlayerNames);
              
              // Check if any roster player is in this team
              const hasRosterPlayer = teamPlayerNames.some(playerName => 
                rosterGamertags.some(gamertag => 
                  playerName.toLowerCase() === gamertag.toLowerCase()
                )
              );
              
              if (hasRosterPlayer) {
                ourTeamKey = teamKey;
                console.log(`Found our team key for processing: ${teamKey} (roster player matching fallback)`);
                break;
              }
            }
          }
        }

        // Only process players from our team
        if (ourTeamKey) {
          const ourTeamPlayers = match.eashlData.players[ourTeamKey];
          if (typeof ourTeamPlayers === 'object' && ourTeamPlayers !== null) {
            Object.values(ourTeamPlayers).forEach((playerData: any) => {
            if (!playerData || !playerData.playername) return;

            const playerName = playerData.playername;
            
            console.log(`Processing player: ${playerName}, game position: ${playerData.position}`);
            console.log('Available players:', Array.from(playerStatsMap.keys()));

            // Check if this player has goalie stats (saves, shots against)
            // Try both possible field names for goalie stats
            const hasGoalieStats = (playerData.saves && playerData.saves > 0) || 
                                 (playerData.shotsAgainst && playerData.shotsAgainst > 0) ||
                                 (playerData.glsaves && playerData.glsaves > 0) ||
                                 (playerData.glshots && playerData.glshots > 0);
            
            // Determine role based on goalie stats or position
            const isGoalie = hasGoalieStats || playerData.position === 'goalie';
            const roleSuffix = isGoalie ? '_goalie' : '_skater';
            
            // Try to find a matching player by name with the correct role
            let matchingKey = null;
            
            if (playerStatsMap.has(`${playerName}${roleSuffix}`)) {
              matchingKey = `${playerName}${roleSuffix}`;
            } else {
              // Try partial match with role suffix
              for (const [key, stats] of playerStatsMap.entries()) {
                if (key.endsWith(roleSuffix) && (stats.name === playerName || 
                    stats.name.includes(playerName) || 
                    playerName.includes(stats.name))) {
                  matchingKey = key;
                  break;
                }
              }
            }

            if (matchingKey) {
              console.log(`Found matching player: ${playerName} -> ${matchingKey}`);
              const playerStats = playerStatsMap.get(matchingKey);
              playerStats.gamesPlayed++;
              if (won) playerStats.wins++;
              else if (lost) playerStats.losses++;
              else if (otLoss) playerStats.otLosses++;
              
              console.log(`Player ${playerName} goalie check:`, {
                saves: playerData.saves,
                shotsAgainst: playerData.shotsAgainst,
                hasGoalieStats: hasGoalieStats,
                allPlayerData: playerData
              });
              
              if (isGoalie) {
                console.log(`Player ${playerName} has goalie stats - processing as goalie`);
                playerStats.position = 'G';
                
                // Use the correct field names for goalie stats (matching goalie stats component)
                const saves = Number(playerData.glsaves) || Number(playerData.saves) || 0;
                const shotsAgainst = Number(playerData.glshots) || Number(playerData.shotsAgainst) || 0;
                const goalsAgainst = Number(playerData.glga) || 0;
                
                playerStats.saves += saves;
                playerStats.shotsAgainst += shotsAgainst;
                playerStats.goalsAgainst += goalsAgainst;
                playerStats.goalsAgainstAverage = playerStats.gamesPlayed > 0 ? 
                  playerStats.goalsAgainst / playerStats.gamesPlayed : 0;
                playerStats.savePercentage = shotsAgainst > 0 ? 
                  saves / shotsAgainst : 0;
                
                // Add other goalie-specific stats if available
                playerStats.shutouts += Number(playerData.glshutouts) || 0;
                playerStats.otl += Number(playerData.glotl) || 0;
              } else {
                console.log(`Player ${playerName} has skater stats - processing as skater`);
                playerStats.position = playerData.position || 'C';
                playerStats.goals += Number(playerData.skgoals) || 0;
                playerStats.assists += Number(playerData.skassists) || 0;
                playerStats.points = playerStats.goals + playerStats.assists;
                playerStats.plusMinus += Number(playerData.skplusmin) || 0;
                playerStats.shots += Number(playerData.skshots) || 0;
                playerStats.hits += Number(playerData.skhits) || 0;
                playerStats.blockedShots += Number(playerData.skblockedshots) || 0;
                playerStats.pim += Number(playerData.skpim) || 0;
                playerStats.ppg += Number(playerData.skppg) || 0;
                playerStats.shg += Number(playerData.skshg) || 0;
                playerStats.gwg += Number(playerData.skgwg) || 0;
                playerStats.takeaways += Number(playerData.sktakeaways) || 0;
                playerStats.giveaways += Number(playerData.skgiveaways) || 0;
                playerStats.passes += Number(playerData.skpasses) || 0;
                playerStats.passAttempts += Number(playerData.skpassattempts) || 0;
                playerStats.faceoffsWon += Number(playerData.skfaceoffswon) || 0;
                playerStats.playerScore += Number(playerData.score) || 0;
                playerStats.penaltyKillCorsiZone += Number(playerData.skpkcorsi) || 0;
              }
            } else {
              console.log(`No matching player found for: ${playerName}`);
            }
          });
        }
        } else {
          console.log(`No team key found for club: ${this.backendClub?.name}`);
        }
      }
    });

    // Calculate derived stats and categorize players
    const allPlayers = Array.from(playerStatsMap.values());
    
    allPlayers.forEach(stats => {
      // Calculate skater stats
      stats.shotPercentage = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
      stats.passPercentage = stats.passAttempts > 0 ? (stats.passes / stats.passAttempts) * 100 : 0;
      stats.faceoffPercentage = (stats.faceoffsWon + (stats.faceoffsWon || 0)) > 0 ? 
        (stats.faceoffsWon / (stats.faceoffsWon + (stats.faceoffsWon || 0))) * 100 : 0;
    });

        // Categorize players based on their role
        // ONLY include players who are on the current roster
        this.skaterStats = allPlayers.filter(player => 
          player.role === 'skater' && player.gamesPlayed > 0 && player.isSigned
        );
        
        this.goalieStats = allPlayers.filter(player => 
          player.role === 'goalie' && player.gamesPlayed > 0 && player.isSigned
        );
    
        console.log('Player categorization:');
        const allPlayersWithGames = allPlayers.filter(p => p.gamesPlayed > 0);
        console.log('All players with games:', allPlayersWithGames.map(p => ({ 
          name: p.name, 
          position: p.position, 
          gp: p.gamesPlayed,
          saves: p.saves,
          shotsAgainst: p.shotsAgainst,
          onRoster: rosterPlayerNames.has(p.name),
          isSigned: p.isSigned
        })));
        console.log('Skaters (roster only):', this.skaterStats.map(s => ({ name: s.name, position: s.position, gp: s.gamesPlayed, onRoster: rosterPlayerNames.has(s.name), isSigned: s.isSigned })));
        console.log('Goalies (roster only):', this.goalieStats.map(g => ({ name: g.name, position: g.position, gp: g.gamesPlayed, saves: g.saves, onRoster: rosterPlayerNames.has(g.name), isSigned: g.isSigned })));
    
    console.log('Final skater stats:', this.skaterStats.length, 'players');
    console.log('Final goalie stats:', this.goalieStats.length, 'players');
    console.log('Goalie stats details:', this.goalieStats);
    
    // Force change detection to update the UI
    console.log('Stats processing complete - triggering UI update');
    this.cdr.detectChanges();
    
    // Debug: Check if goalies have any stats
    if (this.goalieStats.length > 0) {
      console.log('Goalie stats breakdown:');
      this.goalieStats.forEach(goalie => {
        console.log(`- ${goalie.name}: GP=${goalie.gamesPlayed}, Saves=${goalie.saves}, SA=${goalie.shotsAgainst}`);
      });
    } else {
      console.log('No goalie stats found - checking why...');
      console.log('All players:', allPlayers.map(p => ({ name: p.name, position: p.position, gp: p.gamesPlayed })));
    }
  }

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  getSelectedSeasonDivision(): any {
    // Return the division for the selected season
    // This is a placeholder implementation
    return null;
  }

  getClubSeasons(): any[] {
    // Return only seasons that this club has participated in
    if (!this.backendClub || !this.backendClub.seasons || !this.seasons) {
      console.log('ClubDetail: No club, club seasons, or all seasons available');
      return [];
    }
    
    const clubSeasonIds = this.backendClub.seasons.map((clubSeason: any) => {
      // Handle both object and string seasonId formats
      return typeof clubSeason.seasonId === 'object' && clubSeason.seasonId._id 
        ? clubSeason.seasonId._id 
        : clubSeason.seasonId;
    });
    
    console.log('ClubDetail: Club season IDs:', clubSeasonIds);
    console.log('ClubDetail: All seasons:', this.seasons.map(s => ({ id: s._id, name: s.name })));
    
    // Filter seasons to only include those the club participates in
    const filteredSeasons = this.seasons.filter(season => 
      clubSeasonIds.includes(season._id)
    );
    
    console.log('ClubDetail: Filtered seasons for club:', filteredSeasons.map(s => ({ id: s._id, name: s.name })));
    
    return filteredSeasons;
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
