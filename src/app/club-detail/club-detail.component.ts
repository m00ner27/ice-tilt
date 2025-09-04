import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { MatchHistoryComponent } from './match-history/match-history.component';
import { ClubHeaderComponent } from './club-header/club-header.component';
import { ClubStatsGridComponent } from './club-stats-grid/club-stats-grid.component';
import { ClubRosterTablesComponent } from './club-roster-tables/club-roster-tables.component';
import { ClubStatLegendComponent } from './club-stat-legend/club-stat-legend.component';
import { Club } from '../store/models/models/club.interface';
import { environment } from '../../environments/environment';

// Import selectors
import * as ClubsSelectors from '../store/clubs.selectors';
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

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService
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
      if (clubId) {
        this.loadClubData(clubId);
      }
    });
    
    this.setupDataSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDataSubscriptions() {
    // Subscribe to selected club changes
    this.selectedClub$.pipe(takeUntil(this.destroy$)).subscribe(club => {
      console.log('=== CLUB SUBSCRIPTION ===');
      console.log('Club received:', club);
      console.log('Club type:', typeof club);
      console.log('Club keys:', club ? Object.keys(club) : 'null');
      
      if (club) {
        this.backendClub = club as any;
        console.log('Backend club set:', this.backendClub);
        console.log('Backend club _id:', this.backendClub?._id);
        console.log('Backend club name:', this.backendClub?.name);
        this.club = this.mapBackendClubToFrontend(club);
        // Filter matches for the new club
        this.clubMatches = this.matches.filter(match => 
          match.homeClubId?.name === club.name || match.awayClubId?.name === club.name
        );
        console.log('Filtered club matches after club change:', this.clubMatches);
        // Update club roster selector for the new club
        this.clubRoster$ = this.store.select(ClubsSelectors.selectClubRoster(club._id));
        
        // Trigger season selection now that we have the club data
        this.selectSeasonForClub();
      } else {
        console.log('No club received, backendClub remains:', this.backendClub);
      }
    });

    // Subscribe to all clubs for opponent name resolution
    this.allClubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
      this.allClubs = clubs as BackendClub[];
    });

    // Subscribe to seasons
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      console.log('=== SEASONS SUBSCRIPTION ===');
      console.log('Seasons received:', seasons);
      console.log('Seasons length:', seasons?.length || 0);
      
      this.seasons = seasons;
      
      // Try to select a season for the current club
      this.selectSeasonForClub();
    });

    // Subscribe to matches and recalculate stats when they change
    this.matches$.pipe(takeUntil(this.destroy$)).subscribe(matches => {
      console.log('=== MATCHES SUBSCRIPTION ===');
      console.log('Matches received:', matches);
      console.log('Matches length:', matches?.length || 0);
      
      this.matches = matches;
      // Filter matches for current club
      if (this.backendClub) {
        this.clubMatches = matches.filter(match => 
          match.homeClubId?.name === this.backendClub?.name || match.awayClubId?.name === this.backendClub?.name
        );
        console.log('Filtered club matches:', this.clubMatches);
        this.club = this.mapBackendClubToFrontend(this.backendClub);
      }
    });

    // Subscribe to loading and error states
    this.clubsLoading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });

    this.clubsError$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.error = error;
    });

    // Subscribe to club roster data
    this.clubRoster$.pipe(takeUntil(this.destroy$)).subscribe(roster => {
      this.processRosterData(roster);
    });
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
    if (this.seasons && this.seasons.length > 0 && !this.selectedSeasonId && this.backendClub) {
      const clubSeasons = this.backendClub.seasons || [];
      console.log('Club seasons for season selection:', clubSeasons);
      
      if (clubSeasons.length > 0) {
        // Find the first season that the club is active in
        const firstClubSeason = clubSeasons[0];
        const seasonId = firstClubSeason.seasonId;
        console.log('Auto-selecting club season:', seasonId);
        this.onSeasonChange(seasonId);
      } else {
        // Fallback to first available season
        const firstSeason = this.seasons[0];
        console.log('No club seasons found, auto-selecting first available season:', firstSeason);
        this.onSeasonChange(firstSeason._id);
      }
    } else if (this.selectedSeasonId && this.backendClub) {
      // Load roster data if we have a season selected
      console.log('Loading roster for club:', this.backendClub._id, 'season:', this.selectedSeasonId);
      this.ngrxApiService.loadClubRoster(this.backendClub._id, this.selectedSeasonId);
    } else {
      console.log('No season selected or no club available, not loading roster');
    }
  }

  onSeasonChange(seasonId: string) {
    console.log('=== SEASON CHANGE ===');
    console.log('Selected season ID:', seasonId);
    console.log('Backend club:', this.backendClub);
    console.log('Available seasons:', this.seasons);
    
    this.selectedSeasonId = seasonId;
    if (this.backendClub) {
      console.log('Loading club roster for club:', this.backendClub._id, 'season:', seasonId);
      console.log('API call will be made to:', `http://localhost:3001/api/clubs/${this.backendClub._id}/roster?seasonId=${seasonId}`);
      this.ngrxApiService.loadClubRoster(this.backendClub._id, seasonId);
    } else {
      console.log('No backend club available for roster loading');
    }
  }

  private processRosterData(roster: any[]) {
    console.log('=== PROCESSING ROSTER DATA ===');
    console.log('Roster data:', roster);
    console.log('Roster length:', roster?.length || 0);
    
    if (!roster || roster.length === 0) {
      console.log('No roster data available');
      this.signedPlayers = [];
      this.skaterStats = [];
      this.goalieStats = [];
      return;
    }

    // Process signed players
    this.signedPlayers = roster.filter(player => player && player.discordUsername);
    console.log('Signed players:', this.signedPlayers);

    // Process skater and goalie stats from matches
    this.processPlayerStatsFromMatches(roster);
  }

  private processPlayerStatsFromMatches(roster: any[]) {
    console.log('=== PROCESSING PLAYER STATS FROM MATCHES ===');
    console.log('Club matches:', this.clubMatches);
    console.log('Club matches length:', this.clubMatches?.length || 0);
    
    const skaterStatsMap = new Map<string, any>();
    const goalieStatsMap = new Map<string, any>();

    // Initialize stats for each player
    roster.forEach(player => {
      if (!player || !player.gamertag) return;

      const baseStats = {
        playerId: player._id || player.id,
        name: player.gamertag,
        number: player.number || 0,
        position: player.position || 'C',
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
        penaltyKillCorsiZone: 0
      };

      if (player.position === 'G') {
        goalieStatsMap.set(player.gamertag, {
          ...baseStats,
          saves: 0,
          shotsAgainst: 0,
          savePercentage: 0,
          goalsAgainstAverage: 0,
          shutouts: 0,
          otl: 0
        });
      } else {
        skaterStatsMap.set(player.gamertag, baseStats);
      }
    });

    // Process matches to calculate stats
    this.clubMatches.forEach(match => {
      if (!match.eashlData || !match.eashlData.players) return;

      const isHomeTeam = match.homeTeam === this.backendClub?.name;
      const ourScore = isHomeTeam ? match.homeScore : match.awayScore;
      const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;
      const won = ourScore > opponentScore;
      const lost = ourScore < opponentScore;
      const otLoss = ourScore === opponentScore;

      // Process player stats from match data
      Object.values(match.eashlData.players).forEach((clubPlayers: any) => {
        if (typeof clubPlayers === 'object' && clubPlayers !== null) {
          Object.values(clubPlayers).forEach((playerData: any) => {
            if (!playerData || !playerData.playername) return;

            const playerName = playerData.playername;
            const isGoalie = playerData.position === 'G';

            if (isGoalie && goalieStatsMap.has(playerName)) {
              const goalieStats = goalieStatsMap.get(playerName);
              goalieStats.gamesPlayed++;
              if (won) goalieStats.wins++;
              else if (lost) goalieStats.losses++;
              else if (otLoss) goalieStats.otl++;

              goalieStats.saves += Number(playerData.saves) || 0;
              goalieStats.shotsAgainst += Number(playerData.shotsAgainst) || 0;
              goalieStats.goalsAgainstAverage = goalieStats.shotsAgainst > 0 ? 
                (goalieStats.shotsAgainst - goalieStats.saves) / goalieStats.gamesPlayed : 0;
              goalieStats.savePercentage = goalieStats.shotsAgainst > 0 ? 
                (goalieStats.saves / goalieStats.shotsAgainst) * 100 : 0;
            } else if (!isGoalie && skaterStatsMap.has(playerName)) {
              const skaterStats = skaterStatsMap.get(playerName);
              skaterStats.gamesPlayed++;
              if (won) skaterStats.wins++;
              else if (lost) skaterStats.losses++;
              else if (otLoss) skaterStats.otLosses++;

              skaterStats.goals += Number(playerData.skgoals) || 0;
              skaterStats.assists += Number(playerData.skassists) || 0;
              skaterStats.points = skaterStats.goals + skaterStats.assists;
              skaterStats.plusMinus += Number(playerData.skplusmin) || 0;
              skaterStats.shots += Number(playerData.skshots) || 0;
              skaterStats.hits += Number(playerData.skhits) || 0;
              skaterStats.blockedShots += Number(playerData.skblockedshots) || 0;
              skaterStats.pim += Number(playerData.skpim) || 0;
              skaterStats.ppg += Number(playerData.skppg) || 0;
              skaterStats.shg += Number(playerData.skshg) || 0;
              skaterStats.gwg += Number(playerData.skgwg) || 0;
              skaterStats.takeaways += Number(playerData.sktakeaways) || 0;
              skaterStats.giveaways += Number(playerData.skgiveaways) || 0;
              skaterStats.passes += Number(playerData.skpasses) || 0;
              skaterStats.passAttempts += Number(playerData.skpassattempts) || 0;
              skaterStats.faceoffsWon += Number(playerData.skfaceoffswon) || 0;
              skaterStats.playerScore += Number(playerData.score) || 0;
              skaterStats.penaltyKillCorsiZone += Number(playerData.skpossession) || 0;
            }
          });
        }
      });
    });

    // Calculate derived stats
    skaterStatsMap.forEach(stats => {
      stats.shotPercentage = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
      stats.passPercentage = stats.passAttempts > 0 ? (stats.passes / stats.passAttempts) * 100 : 0;
      stats.faceoffPercentage = (stats.faceoffsWon + (stats.faceoffsWon || 0)) > 0 ? 
        (stats.faceoffsWon / (stats.faceoffsWon + (stats.faceoffsWon || 0))) * 100 : 0;
    });

    // Convert maps to arrays
    this.skaterStats = Array.from(skaterStatsMap.values());
    this.goalieStats = Array.from(goalieStatsMap.values());
    
    console.log('Final skater stats:', this.skaterStats);
    console.log('Final goalie stats:', this.goalieStats);
  }

  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/square-default.png';
    }
    
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    if (logoUrl.startsWith('/uploads/')) {
      return `${environment.apiUrl}${logoUrl}`;
    }
    
    return logoUrl;
  }

  getSelectedSeasonDivision(): any {
    // Return the division for the selected season
    // This is a placeholder implementation
    return null;
  }

  getClubSeasons(): any[] {
    // Return seasons that this club has participated in
    // For now, return all seasons as a placeholder
    return this.seasons;
  }

  private mapBackendClubToFrontend(backendClub: any): any {
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

  private calculateClubStats(clubId: string): any {
    console.log('=== CALCULATING CLUB STATS ===');
    console.log('Club ID:', clubId);
    console.log('Backend club name:', this.backendClub?.name);
    console.log('All matches:', this.matches);
    console.log('All matches length:', this.matches?.length || 0);
    
    // Filter matches for this club
    const clubMatches = this.matches.filter(match => 
      match.homeTeam === this.backendClub?.name || match.awayTeam === this.backendClub?.name
    );

    console.log('Filtered club matches:', clubMatches);
    console.log('Club matches length:', clubMatches.length);

    if (clubMatches.length === 0) {
      console.log('No matches found for club, returning default stats');
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

      // Determine result
      if (ourScore > opponentScore) {
        wins++;
        lastTenResults.push('W');
      } else if (ourScore < opponentScore) {
        losses++;
        lastTenResults.push('L');
      } else {
        otLosses++;
        lastTenResults.push('OTL');
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
