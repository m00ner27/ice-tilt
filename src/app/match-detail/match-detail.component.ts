import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';

// Import selectors
import * as MatchesSelectors from '../store/matches.selectors';
import { filter } from 'rxjs/operators';

interface PlayerStatDisplay {
  playerId: number;
  name: string;
  number: number;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots?: number;
  shotPercentage?: number;
  hits?: number;
  blockedShots?: number;
  pim?: number;
  penaltyMinutes?: number;
  ppg?: number;
  powerPlayGoals?: number;
  shg?: number;
  shortHandedGoals?: number;
  gwg?: number;
  gameWinningGoals?: number;
  takeaways?: number;
  giveaways?: number;
  passes?: number;
  passAttempts?: number;
  passPercentage?: number;
  faceoffsWon?: number;
  faceoffsLost?: number;
  faceoffPercentage?: number;
  playerScore?: number;
  penaltyKillCorsiZone?: number;
  wins?: number;
  losses?: number;
  otLosses?: number;
  saves?: number;
  shotsAgainst?: number;
  savePercentage?: number;
  goalsAgainst?: number;
}

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.css']
})
export class MatchDetailComponent implements OnInit, OnDestroy {
  // Observable selectors
  selectedMatch$: Observable<any>;
  matchEashlData$: Observable<any>;
  matchesLoading$: Observable<boolean>;
  matchesError$: Observable<any>;
  
  // Local state
  match: any | null = null;
  viewingTeam: string | null = null;
  homeTeamPlayers: PlayerStatDisplay[] = [];
  awayTeamPlayers: PlayerStatDisplay[] = [];
  homeTeamGoalies: PlayerStatDisplay[] = [];
  awayTeamGoalies: PlayerStatDisplay[] = [];
  isMergedGame: boolean = false;
  noStatsMessage: string = '';
  
  // Subscription management
  private routeParamsSubscription?: Subscription;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService
  ) {
    // Initialize selectors
    this.selectedMatch$ = this.store.select(MatchesSelectors.selectSelectedMatch);
    this.matchEashlData$ = this.store.select(MatchesSelectors.selectMatchEashlData(''));
    this.matchesLoading$ = this.store.select(MatchesSelectors.selectMatchesLoading);
    this.matchesError$ = this.store.select(MatchesSelectors.selectMatchesError);
  }
  
  ngOnInit(): void {
    // Try to get the match from the router state first (when coming from match-history)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.match = navigation.extras.state['match'];
      this.viewingTeam = navigation.extras.state['teamName'];
      if (this.match) {
        this.processMatchData();
      }
    }
    
    // Always listen to route parameter changes to handle navigation between matches
    this.routeParamsSubscription = this.route.params.subscribe(params => {
      console.log('=== MATCH DETAIL ROUTE PARAMS ===');
      console.log('Route params:', params);
      const matchId = params['id'];
      console.log('Match ID from params:', matchId);
      console.log('Match ID type:', typeof matchId);
      
      if (matchId && matchId !== 'undefined') {
        // Only load if we don't already have this match or if it's a different match
        if (!this.match || this.match.id !== matchId) {
          this.loadMatch(matchId);
        }
      } else {
        console.error('Invalid match ID provided:', matchId);
      }
    });
  }
  
  loadMatch(id: string): void {
    console.log('=== LOADING MATCH ===');
    console.log('Match ID to load:', id);
    console.log('Match ID type:', typeof id);
    
    // First check if the match is already in the store
    this.store.select(MatchesSelectors.selectAllMatches).pipe(take(1)).subscribe(matches => {
      const existingMatch = matches.find(match => match.id === id);
      if (existingMatch) {
        console.log('Match found in store:', existingMatch);
        this.match = existingMatch;
        this.processMatchData();
      } else {
        console.log('Match not in store, loading from API...');
        // If not in store, load from API
        this.ngrxApiService.loadMatch(id);
        
        // Subscribe to match changes
        this.selectedMatch$.pipe(
          filter(match => match !== null && match.id === id),
          take(1)
        ).subscribe(match => {
          console.log('Match loaded from API:', match);
          this.match = match;
          this.processMatchData();
        });
      }
    });
  }
  
  // Convert full position names to abbreviations
  getPositionAbbreviation(position: string): string {
    const positionMap: { [key: string]: string } = {
      'leftWing': 'LW',
      'rightWing': 'RW', 
      'center': 'C',
      'defenseMen': 'D',
      'goalie': 'G',
      'G': 'G',
      'LW': 'LW',
      'RW': 'RW',
      'C': 'C',
      'D': 'D'
    };
    
    return positionMap[position] || position;
  }

  processMatchData(): void {
    if (!this.match) return;

    // Check if this is a merged game
    this.isMergedGame = this.match.eashlMatchId?.includes('+') || false;
    
    this.homeTeamPlayers = [];
    this.awayTeamPlayers = [];
    this.homeTeamGoalies = [];
    this.awayTeamGoalies = [];

    // Check for manual stats first
    console.log('=== CHECKING FOR MANUAL STATS ===');
    console.log('Match EASHL Data:', this.match.eashlData);
    console.log('Manual Entry Flag:', this.match.eashlData?.manualEntry);
    console.log('EASHL Match ID:', this.match.eashlMatchId);
    
    if (this.match.eashlData && this.match.eashlData.manualEntry) {
      console.log('Manual stats detected for game:', this.match.id);
      this.processManualStats();
      return;
    }

    if (this.isMergedGame) {
      console.log('Merged game detected:', this.match.eashlMatchId);
      // Merged games should now have combined player stats
      if (!this.match.playerStats || this.match.playerStats.length === 0) {
        this.noStatsMessage = `This game was created by merging multiple EASHL games (${this.match.eashlMatchId}). Player statistics are being processed and should be available shortly.`;
        console.log('Merged game detected but no player stats yet');
        return;
      }
    }

    if (!this.match.playerStats || this.match.playerStats.length === 0) {
      this.noStatsMessage = 'No detailed player statistics are available for this game.';
      console.log('No player stats available for game:', this.match.id);
      return;
    }

    console.log('=== PROCESSING PLAYER STATS ===');
    console.log('Raw player stats:', this.match.playerStats);
    
    this.match.playerStats.forEach((playerStat: any) => {
      const statDisplay: PlayerStatDisplay = {
        playerId: playerStat.playerId || 0,
        name: playerStat.name || 'Unknown Player',
        number: playerStat.number || 0,
        position: this.getPositionAbbreviation(playerStat.position || 'Unknown'),
        gamesPlayed: playerStat.gamesPlayed || 0,
        goals: playerStat.goals || 0,
        assists: playerStat.assists || 0,
        points: (playerStat.goals || 0) + (playerStat.assists || 0),
        plusMinus: playerStat.plusMinus || 0,
        shots: playerStat.shots || 0,
        shotPercentage: playerStat.shotPercentage || 0,
        hits: playerStat.hits || 0,
        blockedShots: playerStat.blockedShots || 0,
        pim: playerStat.pim || 0,
        ppg: playerStat.ppg || 0,
        shg: playerStat.shg || 0,
        gwg: playerStat.gwg || 0,
        takeaways: playerStat.takeaways || 0,
        giveaways: playerStat.giveaways || 0,
        passes: playerStat.passes || 0,
        passAttempts: playerStat.passAttempts || 0,
        passPercentage: playerStat.passPercentage || 0,
        faceoffsWon: playerStat.faceoffsWon || 0,
        faceoffPercentage: playerStat.faceoffPercentage || 0,
        playerScore: playerStat.playerScore || 0,
        penaltyKillCorsiZone: playerStat.penaltyKillCorsiZone || 0,
        wins: playerStat.wins || 0,
        losses: playerStat.losses || 0,
        otLosses: playerStat.otLosses || 0,
        saves: playerStat.saves || 0,
        shotsAgainst: playerStat.shotsAgainst || 0,
        savePercentage: playerStat.savePercentage || 0,
        goalsAgainst: playerStat.goalsAgainst || 0
      };

      // Determine which team the player belongs to
      if (playerStat.team === this.match.homeTeam) {
        if (playerStat.position === 'G' || playerStat.position === 'goalie') {
          this.homeTeamGoalies.push(statDisplay);
        } else {
          this.homeTeamPlayers.push(statDisplay);
        }
      } else if (playerStat.team === this.match.awayTeam) {
        if (playerStat.position === 'G' || playerStat.position === 'goalie') {
          this.awayTeamGoalies.push(statDisplay);
        } else {
          this.awayTeamPlayers.push(statDisplay);
        }
      }
    });

    console.log('=== PROCESSED STATS ===');
    console.log('Home team players:', this.homeTeamPlayers);
    console.log('Away team players:', this.awayTeamPlayers);
    console.log('Home team goalies:', this.homeTeamGoalies);
    console.log('Away team goalies:', this.awayTeamGoalies);
  }

  processManualStats(): void {
    // Process manual stats if available
    if (this.match.eashlData && this.match.eashlData.manualEntry) {
      // Implementation for manual stats processing
      console.log('Processing manual stats for game:', this.match.id);
    }
  }

  goBack(): void {
    this.location.back();
  }

  getTeamName(team: string): string {
    return team || 'Unknown Team';
  }

  getScoreDisplay(): string {
    if (!this.match) return '0 - 0';
    
    const homeScore = this.match.homeScore || this.match.score?.home || 0;
    const awayScore = this.match.awayScore || this.match.score?.away || 0;
    
    return `${homeScore} - ${awayScore}`;
  }

  getDateDisplay(): string {
    if (!this.match || !this.match.date) return 'Unknown Date';
    
    return new Date(this.match.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getResultClass(teamName: string): string {
    if (!this.match) return '';
    
    const homeScore = this.match.homeScore || this.match.score?.home || 0;
    const awayScore = this.match.awayScore || this.match.score?.away || 0;
    
    if (teamName === this.match.homeTeam) {
      return homeScore > awayScore ? 'win' : homeScore < awayScore ? 'loss' : '';
    } else if (teamName === this.match.awayTeam) {
      return awayScore > homeScore ? 'win' : awayScore < homeScore ? 'loss' : '';
    }
    
    return '';
  }

  hasStats(): boolean {
    return this.homeTeamPlayers.length > 0 || this.awayTeamPlayers.length > 0 || 
           this.homeTeamGoalies.length > 0 || this.awayTeamGoalies.length > 0;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  isTeamWinner(teamName: string): boolean {
    if (!this.match) return false;
    
    const homeScore = this.match.homeScore || this.match.score?.home || 0;
    const awayScore = this.match.awayScore || this.match.score?.away || 0;
    
    if (teamName === this.match.homeTeam) {
      return homeScore > awayScore;
    } else if (teamName === this.match.awayTeam) {
      return awayScore > homeScore;
    }
    
    return false;
  }

  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) return '/assets/images/default-logo.png';
    
    // If it's a full URL, return as is
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }

  getTeamTotalGoals(team: 'home' | 'away'): number {
    if (!this.match) return 0;
    
    if (team === 'home') {
      return this.match.homeScore || this.match.score?.home || 0;
    } else {
      return this.match.awayScore || this.match.score?.away || 0;
    }
  }

  getTeamTotalAssists(team: 'home' | 'away'): number {
    if (!this.match) return 0;
    
    const players = team === 'home' ? this.homeTeamPlayers : this.awayTeamPlayers;
    return players.reduce((total, player) => total + (player.assists || 0), 0);
  }

  getTeamTotalShots(team: 'home' | 'away'): number {
    if (!this.match) return 0;
    
    const players = team === 'home' ? this.homeTeamPlayers : this.awayTeamPlayers;
    return players.reduce((total, player) => total + (player.shots || 0), 0);
  }

  getTeamTotalHits(team: 'home' | 'away'): number {
    if (!this.match) return 0;
    
    const players = team === 'home' ? this.homeTeamPlayers : this.awayTeamPlayers;
    return players.reduce((total, player) => total + (player.hits || 0), 0);
  }

  calculateSavePercentage(saves: number | undefined, shotsAgainst: number | undefined): string {
    if (!saves || !shotsAgainst || shotsAgainst === 0) return '0.000';
    const percentage = (saves / shotsAgainst) * 100;
    return percentage.toFixed(3);
  }

  ngOnDestroy(): void {
    if (this.routeParamsSubscription) {
      this.routeParamsSubscription.unsubscribe();
    }
  }
}