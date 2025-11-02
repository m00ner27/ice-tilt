import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ImageUrlService } from '../shared/services/image-url.service';

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
  penaltyAssists?: number;
  penaltyPercentage?: number;
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
  interceptions?: number;
  playerScore?: number;
  penaltyKillCorsiZone?: number;
  wins?: number;
  losses?: number;
  otLosses?: number;
  saves?: number;
  shotsAgainst?: number;
  savePercentage?: number;
  goalsAgainst?: number;
  goalsAgainstAverage?: number;
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
    private ngrxApiService: NgRxApiService,
    private imageUrlService: ImageUrlService
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
      const matchId = params['id'];
      
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
    
    // First check if the match is already in the store
    this.store.select(MatchesSelectors.selectAllMatches).pipe(take(1)).subscribe(matches => {
      const existingMatch = matches.find(match => match.id === id);
      if (existingMatch) {
        this.match = existingMatch;
        this.processMatchData();
      } else {
        // If not in store, load from API
        this.ngrxApiService.loadMatch(id);
        
        // Subscribe to match changes
        this.selectedMatch$.pipe(
          filter(match => match !== null && match.id === id),
          take(1)
        ).subscribe(match => {
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

  // Helper method to get interceptions from player stats or EASHL data
  getInterceptions(playerStat: any): number {
    console.log(`Getting interceptions for ${playerStat.name}:`, {
      playerStatInterceptions: playerStat.interceptions,
      hasEashlData: !!this.match.eashlData,
      hasPlayers: !!(this.match.eashlData && this.match.eashlData.players)
    });
    
    // First try to get from player stats
    if (playerStat.interceptions !== undefined) {
      const result = parseInt(playerStat.interceptions) || 0;
      console.log(`Using player stat interceptions: ${result}`);
      return result;
    }
    
    // If not available in player stats, try to get from EASHL data
    if (this.match.eashlData && this.match.eashlData.players) {
      const homeClubId = this.match.homeClub?.eashlClubId;
      const awayClubId = this.match.awayClub?.eashlClubId;
      
      if (homeClubId && awayClubId) {
        const teamIds = [homeClubId.toString(), awayClubId.toString()];
        
        for (const teamId of teamIds) {
          const teamPlayers = this.match.eashlData.players[teamId];
          if (!teamPlayers) continue;

          const playersArray = Array.isArray(teamPlayers) ? teamPlayers : Object.values(teamPlayers);
          
          const eashlPlayer = playersArray.find((p: any) => 
            p.playername === playerStat.name || p.name === playerStat.name
          );
          
          if (eashlPlayer) {
            const result = parseInt(eashlPlayer.skint) || 0;
            console.log(`Found EASHL interceptions: ${result} for ${playerStat.name}`);
            return result;
          }
        }
      }
    }
    
    console.log(`No interceptions found for ${playerStat.name}, returning 0`);
    return 0;
  }

  // Helper method to get blocked shots from player stats or EASHL data
  getBlockedShots(playerStat: any): number {
    console.log(`Getting blocked shots for ${playerStat.name}:`, {
      playerStatBlockedShots: playerStat.blockedShots,
      hasEashlData: !!this.match.eashlData,
      hasPlayers: !!(this.match.eashlData && this.match.eashlData.players)
    });
    
    // First try to get from player stats
    if (playerStat.blockedShots !== undefined) {
      const result = parseInt(playerStat.blockedShots) || 0;
      console.log(`Using player stat blocked shots: ${result}`);
      return result;
    }
    
    // If not available in player stats, try to get from EASHL data
    if (this.match.eashlData && this.match.eashlData.players) {
      const homeClubId = this.match.homeClub?.eashlClubId;
      const awayClubId = this.match.awayClub?.eashlClubId;
      
      if (homeClubId && awayClubId) {
        const teamIds = [homeClubId.toString(), awayClubId.toString()];
        
        for (const teamId of teamIds) {
          const teamPlayers = this.match.eashlData.players[teamId];
          if (!teamPlayers) continue;

          const playersArray = Array.isArray(teamPlayers) ? teamPlayers : Object.values(teamPlayers);
          
          const eashlPlayer = playersArray.find((p: any) => 
            p.playername === playerStat.name || p.name === playerStat.name
          );
          
          if (eashlPlayer) {
            const result = parseInt(eashlPlayer.skbs) || 0;
            console.log(`Found EASHL blocked shots: ${result} for ${playerStat.name}`);
            return result;
          }
        }
      }
    }
    
    console.log(`No blocked shots found for ${playerStat.name}, returning 0`);
    return 0;
  }

  processMatchData(): void {
    if (!this.match) return;

    // Check if this is a merged game
    this.isMergedGame = this.match.eashlMatchId?.includes('+') || false;
    
    this.homeTeamPlayers = [];
    this.awayTeamPlayers = [];
    this.homeTeamGoalies = [];
    this.awayTeamGoalies = [];

    // Debug: Log the raw EASHL data structure
    console.log('=== RAW EASHL DATA DEBUG ===');
    console.log('Match EASHL Data:', this.match.eashlData);
    if (this.match.eashlData?.clubs) {
      console.log('EASHL Clubs:', this.match.eashlData.clubs);
      console.log('Club IDs in EASHL data:', Object.keys(this.match.eashlData.clubs));
    }
    if (this.match.eashlData?.players) {
      console.log('EASHL Players:', this.match.eashlData.players);
      console.log('Player Club IDs in EASHL data:', Object.keys(this.match.eashlData.players));
    }
    console.log('Match Player Stats:', this.match.playerStats);
    console.log('=== END RAW EASHL DATA DEBUG ===');

    // Check for manual stats first
    if (this.match.eashlData && this.match.eashlData.manualEntry) {
      this.processManualStats();
      return;
    }

    // Check if we have EASHL data or player stats
    // Prioritize EASHL data for regular games since it has all stat categories
    if (this.match.eashlData && this.match.eashlData.players) {
      this.processEashlData();
    } else if (this.match.playerStats && this.match.playerStats.length > 0) {
      this.processPlayerStats();
    } else {
      if (this.isMergedGame) {
        this.noStatsMessage = `This game was created by merging multiple EASHL games (${this.match.eashlMatchId}). Player statistics are being processed and should be available shortly.`;
      } else {
        this.noStatsMessage = 'No detailed player statistics are available for this game.';
      }
      return;
    }
    
    // Fix goalie stats after processing data
    this.fixGoalieStats();
  }

  processPlayerStats(): void {
    
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
        blockedShots: this.getBlockedShots(playerStat),
        pim: playerStat.penaltyMinutes || 0,
        penaltyAssists: playerStat.penaltyAssists || 0,
        penaltyPercentage: (playerStat.penaltyMinutes || 0) + (playerStat.penaltyAssists || 0) > 0 ? 
          ((playerStat.penaltyMinutes || 0) / ((playerStat.penaltyMinutes || 0) + (playerStat.penaltyAssists || 0)) * 100) : 0,
        ppg: playerStat.powerPlayGoals || 0,
        shg: playerStat.shortHandedGoals || 0,
        gwg: playerStat.gameWinningGoals || 0,
        gameWinningGoals: playerStat.gameWinningGoals || 0,
        takeaways: playerStat.takeaways || 0,
        giveaways: playerStat.giveaways || 0,
        passes: playerStat.passes || 0,
        passAttempts: playerStat.passAttempts || 0,
        passPercentage: playerStat.passPercentage || 0,
        faceoffsWon: playerStat.faceoffsWon || 0,
        faceoffsLost: playerStat.faceoffsLost || 0,
        faceoffPercentage: (playerStat.faceoffsWon || 0) + (playerStat.faceoffsLost || 0) > 0 ? 
          ((playerStat.faceoffsWon || 0) / ((playerStat.faceoffsWon || 0) + (playerStat.faceoffsLost || 0)) * 100) : 0,
        interceptions: this.getInterceptions(playerStat),
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
    
    // Recalculate goalie shots against to match opposing team's total shots
    this.recalculateGoalieShotsAgainst();
  }

  processEashlData(): void {
    
    if (!this.match.eashlData || !this.match.eashlData.players) {
      this.noStatsMessage = 'No EASHL player data available for this game.';
      return;
    }

    // Debug logging for merged games
    if (this.isMergedGame) {
      console.log('=== PROCESSING MERGED GAME EASHL DATA ===');
      console.log('EASHL Match ID:', this.match.eashlMatchId);
      console.log('Players data structure:', this.match.eashlData.players);
    }

    // Get team IDs from EASHL data
    const homeClubId = this.match.homeClub?.eashlClubId;
    const awayClubId = this.match.awayClub?.eashlClubId;
    
    console.log('Expected club IDs:', { homeClubId, awayClubId });
    console.log('Expected club ID types:', { 
      homeClubIdType: typeof homeClubId, 
      awayClubIdType: typeof awayClubId 
    });
    console.log('Available player club IDs in EASHL data:', Object.keys(this.match.eashlData.players));
    console.log('Available club ID types:', Object.keys(this.match.eashlData.players).map(id => ({ id, type: typeof id })));
    
    if (!homeClubId || !awayClubId) {
      this.noStatsMessage = 'Team information not available for this game.';
      return;
    }

    // Process players from both teams
    const teamIds = [homeClubId.toString(), awayClubId.toString()];
    
    teamIds.forEach(teamId => {
      console.log(`Looking for players for team ID: ${teamId} (type: ${typeof teamId})`);
      const teamPlayers = this.match.eashlData.players[teamId];
      console.log(`Found team players:`, teamPlayers);
      if (!teamPlayers) {
        console.log(`No players found for team ID: ${teamId}`);
        console.log('Available team IDs in EASHL data:', Object.keys(this.match.eashlData.players));
        console.log('Checking if team ID exists with different type...');
        // Try to find the team with different type conversion
        const stringTeamId = teamId.toString();
        const numberTeamId = parseInt(teamId);
        console.log(`Trying string version: ${stringTeamId}`, this.match.eashlData.players[stringTeamId]);
        console.log(`Trying number version: ${numberTeamId}`, this.match.eashlData.players[numberTeamId]);
        return;
      }

      const playersArray = Array.isArray(teamPlayers) ? teamPlayers : Object.values(teamPlayers);
      
      playersArray.forEach((playerData: any) => {
        const isGoalie = playerData.position === 'G' || playerData.position === 'goalie';
        const isHomeTeam = teamId === homeClubId.toString();
        
        // Debug logging for merged games
        if (this.isMergedGame) {
          console.log(`Processing player: ${playerData.playername || playerData.name}`, {
            skpasses: playerData.skpasses,
            skpassattempts: playerData.skpassattempts,
            skfow: playerData.skfow,
            skfol: playerData.skfol,
            skint: playerData.skint,
            sktakeaways: playerData.sktakeaways,
            skgiveaways: playerData.skgiveaways,
            skshots: playerData.skshots,
            skgoals: playerData.skgoals,
            skassists: playerData.skassists,
            skhits: playerData.skhits,
            skbs: playerData.skbs
          });
        }
        
        const statDisplay: PlayerStatDisplay = {
          playerId: playerData.playerId || 0,
          name: playerData.playername || playerData.name || 'Unknown Player',
          number: playerData.number || 0,
          position: this.getPositionAbbreviation(playerData.position || 'Unknown'),
          gamesPlayed: 1,
          goals: isGoalie ? 0 : (parseInt(playerData.skgoals) || 0),
          assists: isGoalie ? 0 : (parseInt(playerData.skassists) || 0),
          points: isGoalie ? (parseInt(playerData.skassists) || 0) : 
            ((parseInt(playerData.skgoals) || 0) + (parseInt(playerData.skassists) || 0)),
          plusMinus: isGoalie ? 0 : (parseInt(playerData.skplusmin) || 0),
          shots: isGoalie ? 0 : (parseInt(playerData.skshots) || 0),
          shotPercentage: isGoalie ? 0 : 
            (parseInt(playerData.skshots) > 0 ? ((parseInt(playerData.skgoals) || 0) / parseInt(playerData.skshots) * 100) : 0),
          hits: isGoalie ? 0 : (parseInt(playerData.skhits) || 0),
          blockedShots: isGoalie ? 0 : (parseInt(playerData.skbs) || 0),
          pim: parseInt(playerData.skpim) || 0,
          penaltyAssists: isGoalie ? 0 : 0, // Not available in EASHL data
          penaltyPercentage: 0, // Not applicable for EASHL data
          ppg: isGoalie ? 0 : (parseInt(playerData.skppg) || 0),
          shg: isGoalie ? 0 : (parseInt(playerData.skshg) || 0),
          gwg: isGoalie ? 0 : (parseInt(playerData.skgwg) || 0),
          gameWinningGoals: isGoalie ? 0 : (parseInt(playerData.skgwg) || 0),
          takeaways: isGoalie ? 0 : (parseInt(playerData.sktakeaways) || 0),
          giveaways: isGoalie ? 0 : (parseInt(playerData.skgiveaways) || 0),
          passes: isGoalie ? 0 : (parseInt(playerData.skpasses) || 0),
          passAttempts: isGoalie ? 0 : (parseInt(playerData.skpassattempts) || 0),
          passPercentage: isGoalie ? 0 : 
            (parseInt(playerData.skpassattempts) > 0 ? ((parseInt(playerData.skpasses) || 0) / parseInt(playerData.skpassattempts) * 100) : 0),
          faceoffsWon: isGoalie ? 0 : (parseInt(playerData.skfow) || 0),
          faceoffsLost: isGoalie ? 0 : (parseInt(playerData.skfol) || 0),
          faceoffPercentage: isGoalie ? 0 : 
            ((parseInt(playerData.skfow) || 0) + (parseInt(playerData.skfol) || 0) > 0 ? 
              ((parseInt(playerData.skfow) || 0) / ((parseInt(playerData.skfow) || 0) + (parseInt(playerData.skfol) || 0)) * 100) : 0),
          interceptions: isGoalie ? 0 : (parseInt(playerData.skint) || 0),
          playerScore: parseInt(playerData.score) || 0,
          penaltyKillCorsiZone: isGoalie ? 0 : (parseInt(playerData.skpkc) || 0),
          // Goalie-specific stats
          saves: isGoalie ? (parseInt(playerData.glsaves) || 0) : 0,
          shotsAgainst: isGoalie ? (parseInt(playerData.glshots) || 0) : 0,
          savePercentage: isGoalie ? 
            (parseInt(playerData.glshots) > 0 ? ((parseInt(playerData.glsaves) || 0) / parseInt(playerData.glshots)) : 0) : 0,
          goalsAgainst: isGoalie ? (parseInt(playerData.glga) || 0) : 0
        };

        // Debug logging for merged games - show final processed stats
        if (this.isMergedGame) {
          console.log(`Final processed stats for ${playerData.playername || playerData.name}:`, {
            shots: statDisplay.shots,
            passes: statDisplay.passes,
            passAttempts: statDisplay.passAttempts,
            passPercentage: statDisplay.passPercentage,
            faceoffsWon: statDisplay.faceoffsWon,
            faceoffsLost: statDisplay.faceoffsLost,
            faceoffPercentage: statDisplay.faceoffPercentage,
            interceptions: statDisplay.interceptions,
            goals: statDisplay.goals,
            assists: statDisplay.assists,
            hits: statDisplay.hits,
            blockedShots: statDisplay.blockedShots
          });
        }

        // Add to appropriate team
        if (isHomeTeam) {
          if (isGoalie) {
            this.homeTeamGoalies.push(statDisplay);
          } else {
            this.homeTeamPlayers.push(statDisplay);
          }
        } else {
          if (isGoalie) {
            this.awayTeamGoalies.push(statDisplay);
          } else {
            this.awayTeamPlayers.push(statDisplay);
          }
        }
      });
    });
  }

  processManualStats(): void {
    // Process manual stats if available - they are processed by match service and stored in match.playerStats
    if (this.match.eashlData && this.match.eashlData.manualEntry && this.match.playerStats) {
      console.log('Processing manual stats from match.playerStats:', this.match.playerStats);
      
      // Process all players from match.playerStats
      this.match.playerStats.forEach((player: any) => {
        // Process both skaters and goalies
        const isGoaliePlayer = this.isGoalie(player.position);
        
        // Determine team based on player.team
        const isHomeTeam = player.team === this.match.homeTeam;
        const isAwayTeam = player.team === this.match.awayTeam;
        
        console.log('Player team matching:', {
          playerTeam: player.team,
          homeTeam: this.match.homeTeam,
          awayTeam: this.match.awayTeam,
          isHomeTeam,
          isAwayTeam
        });
        
        if (!isHomeTeam && !isAwayTeam) {
          console.log('Skipping player - team does not match:', player.name, player.team);
          return; // Skip if team doesn't match
        }
        
        const statDisplay: PlayerStatDisplay = {
          playerId: player.playerId || 0,
          name: player.name || 'Unknown Player',
          number: player.number || 0,
          position: this.getPositionAbbreviation(player.position || 'Unknown'),
          gamesPlayed: 1,
          goals: isGoaliePlayer ? 0 : (player.goals || 0), // Goalies don't score goals
          assists: player.assists || 0,
          points: isGoaliePlayer ? (player.assists || 0) : ((player.goals || 0) + (player.assists || 0)),
          plusMinus: isGoaliePlayer ? 0 : (player.plusMinus || 0), // Goalies don't have plus/minus
          shots: isGoaliePlayer ? 0 : (player.shots || 0), // Goalies don't take shots
          shotPercentage: isGoaliePlayer ? 0 : (player.shots > 0 ? ((player.goals || 0) / player.shots * 100) : 0),
          hits: isGoaliePlayer ? 0 : (player.hits || 0), // Goalies don't hit
          blockedShots: isGoaliePlayer ? 0 : (player.blockedShots || 0), // Goalies don't block shots
          pim: player.penaltyMinutes || 0,
          penaltyAssists: isGoaliePlayer ? 0 : (player.penaltyAssists || 0),
          penaltyPercentage: isGoaliePlayer ? 0 : ((player.penaltyMinutes || 0) + (player.penaltyAssists || 0) > 0 ? 
            ((player.penaltyMinutes || 0) / ((player.penaltyMinutes || 0) + (player.penaltyAssists || 0)) * 100) : 0),
          ppg: isGoaliePlayer ? 0 : (player.powerPlayGoals || 0),
          shg: isGoaliePlayer ? 0 : (player.shortHandedGoals || 0),
          gwg: isGoaliePlayer ? 0 : (player.gameWinningGoals || 0),
          takeaways: isGoaliePlayer ? 0 : (player.takeaways || 0),
          giveaways: isGoaliePlayer ? 0 : (player.giveaways || 0),
          faceoffsWon: isGoaliePlayer ? 0 : (player.faceoffsWon || 0),
          faceoffsLost: isGoaliePlayer ? 0 : (player.faceoffsLost || 0),
          faceoffPercentage: isGoaliePlayer ? 0 : ((player.faceoffsWon || 0) + (player.faceoffsLost || 0) > 0 ? 
            ((player.faceoffsWon || 0) / ((player.faceoffsWon || 0) + (player.faceoffsLost || 0)) * 100) : 0),
          passAttempts: isGoaliePlayer ? 0 : (player.passAttempts || 0),
          passes: isGoaliePlayer ? 0 : (player.passesCompleted || 0),
          passPercentage: isGoaliePlayer ? 0 : (player.passAttempts > 0 ? ((player.passesCompleted || 0) / player.passAttempts * 100) : 0),
          interceptions: isGoaliePlayer ? 0 : (player.interceptions || 0),
          playerScore: this.calculatePlayerScore(player),
          // Goalie-specific stats
          saves: isGoaliePlayer ? (player.saves || 0) : 0,
          shotsAgainst: isGoaliePlayer ? (player.shotsAgainst || 0) : 0,
          savePercentage: isGoaliePlayer ? (player.shotsAgainst > 0 ? (player.saves || 0) / player.shotsAgainst * 100 : 0) : 0,
          goalsAgainst: isGoaliePlayer ? (player.goalsAgainst || 0) : 0,
          goalsAgainstAverage: isGoaliePlayer ? (player.shotsAgainst > 0 ? (player.goalsAgainst || 0) / (player.shotsAgainst || 1) * 60 : 0) : 0
        };
        
        // Assign to correct team and category (skaters vs goalies)
        if (isHomeTeam) {
          if (isGoaliePlayer) {
            this.homeTeamGoalies.push(statDisplay);
          } else {
            this.homeTeamPlayers.push(statDisplay);
          }
        } else if (isAwayTeam) {
          if (isGoaliePlayer) {
            this.awayTeamGoalies.push(statDisplay);
          } else {
            this.awayTeamPlayers.push(statDisplay);
          }
        }
      });
    }
    
    // Recalculate goalie shots against to match opposing team's total shots
    // BUT skip this for manual stats entries - use the manually entered values
    if (!this.match.eashlData?.manualEntry) {
      this.recalculateGoalieShotsAgainst();
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
    
    const homeScore = this.getHomeScore();
    const awayScore = this.getAwayScore();
    
    return `${homeScore} - ${awayScore}`;
  }

  getHomeScore(): number {
    if (!this.match) return 0;
    
    // Handle forfeit games
    if (this.match.forfeit && this.match.forfeit !== 'none') {
      return this.match.forfeit === 'forfeit-home' ? 1 : 0;
    }
    
    return this.match.homeScore || this.match.score?.home || 0;
  }

  getAwayScore(): number {
    if (!this.match) return 0;
    
    // Handle forfeit games
    if (this.match.forfeit && this.match.forfeit !== 'none') {
      return this.match.forfeit === 'forfeit-away' ? 1 : 0;
    }
    
    return this.match.awayScore || this.match.score?.away || 0;
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
    return this.imageUrlService.getImageUrl(logoUrl, '/assets/images/default-logo.png');
  }

  // Handle image loading errors
  onImageError(event: any): void {
    console.log('Image failed to load, URL:', event.target.src);
    
    // Prevent infinite error loops - if we're already showing the default image, don't change it
    if (event.target.src.includes('square-default.png')) {
      console.log('Default image also failed to load, stopping error handling');
      return;
    }
    
    // Set the fallback image - use a path that will be treated as a local asset
    event.target.src = '/assets/images/square-default.png';
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

  // Method to recalculate goalie shots against based on opposing team's total shots
  recalculateGoalieShotsAgainst(): void {
    // Calculate total shots for each team
    const homeTeamTotalShots = this.getTeamTotalShots('home');
    const awayTeamTotalShots = this.getTeamTotalShots('away');
    
    // Update home team goalies' shots against to match away team's total shots
    this.homeTeamGoalies.forEach(goalie => {
      goalie.shotsAgainst = awayTeamTotalShots;
      // Recalculate goals against to maintain mathematical consistency: GA = SA - SV
      goalie.goalsAgainst = Math.max(0, awayTeamTotalShots - (goalie.saves || 0));
      // Recalculate save percentage
      goalie.savePercentage = awayTeamTotalShots > 0 ? (goalie.saves || 0) / awayTeamTotalShots * 100 : 0;
    });
    
    // Update away team goalies' shots against to match home team's total shots
    this.awayTeamGoalies.forEach(goalie => {
      goalie.shotsAgainst = homeTeamTotalShots;
      // Recalculate goals against to maintain mathematical consistency: GA = SA - SV
      goalie.goalsAgainst = Math.max(0, homeTeamTotalShots - (goalie.saves || 0));
      // Recalculate save percentage
      goalie.savePercentage = homeTeamTotalShots > 0 ? (goalie.saves || 0) / homeTeamTotalShots * 100 : 0;
    });
  }

  ngOnDestroy(): void {
    if (this.routeParamsSubscription) {
      this.routeParamsSubscription.unsubscribe();
    }
  }

  isGoalie(position: string): boolean {
    if (!position) return false;
    const lowerPos = position.toLowerCase().replace(/\s/g, '');
    return lowerPos === 'g' || lowerPos === 'goalie' || lowerPos === 'goaltender';
  }

  formatTimeOnIce(minutes: number, seconds: number): string {
    const totalSeconds = (minutes * 60) + seconds;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  calculatePlayerScore(player: any): number {
    const goals = player.goals || 0;
    const assists = player.assists || 0;
    const points = goals + assists;
    const shots = player.shots || 0;
    const hits = player.hits || 0;
    const blockedShots = player.blockedShots || 0;
    const takeaways = player.takeaways || 0;
    const giveaways = player.giveaways || 0;
    const plusMinus = player.plusMinus || 0;
    
    // Simple scoring system: points + defensive stats - giveaways + plus/minus
    return points + (hits * 0.1) + (blockedShots * 0.2) + (takeaways * 0.1) - (giveaways * 0.1) + (plusMinus * 0.5);
  }

  fixGoalieStats(): void {
    // Get team total shots
    const homeTeamTotalShots = this.getTeamTotalShots('home');
    const awayTeamTotalShots = this.getTeamTotalShots('away');
    
    // Get team total goals
    const homeTeamTotalGoals = this.getTeamTotalGoals('home');
    const awayTeamTotalGoals = this.getTeamTotalGoals('away');
    
    // Fix home team goalies - their shots against should equal away team's total shots
    this.homeTeamGoalies.forEach(goalie => {
      goalie.shotsAgainst = awayTeamTotalShots;
      goalie.goalsAgainst = awayTeamTotalGoals; // Goals against = goals scored by opposing team
      goalie.saves = Math.max(0, awayTeamTotalShots - awayTeamTotalGoals); // Saves = SA - GA
      goalie.savePercentage = awayTeamTotalShots > 0 ? goalie.saves / awayTeamTotalShots * 100 : 0;
    });
    
    // Fix away team goalies - their shots against should equal home team's total shots
    this.awayTeamGoalies.forEach(goalie => {
      goalie.shotsAgainst = homeTeamTotalShots;
      goalie.goalsAgainst = homeTeamTotalGoals; // Goals against = goals scored by opposing team
      goalie.saves = Math.max(0, homeTeamTotalShots - homeTeamTotalGoals); // Saves = SA - GA
      goalie.savePercentage = homeTeamTotalShots > 0 ? goalie.saves / homeTeamTotalShots * 100 : 0;
    });
  }
}