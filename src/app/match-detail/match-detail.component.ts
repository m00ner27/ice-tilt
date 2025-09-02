import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { Match, PlayerMatchStats, MatchService } from '../store/services/match.service';
import { environment } from '../../environments/environment';

interface PlayerStatDisplay {
  name: string;
  number: number;
  position: string;
  goals?: number;
  assists?: number;
  points?: number;
  plusMinus?: number;
  shots?: number;
  shotPercentage?: number;
  hits?: number;
  blockedShots?: number;
  penaltyMinutes?: number;
  powerPlayGoals?: number;
  shortHandedGoals?: number;
  gameWinningGoals?: number;
  takeaways?: number;
  giveaways?: number;
  passes?: number;
  passPercentage?: number;
  faceoffsWon?: number;
  faceoffsLost?: number;
  faceoffPercentage?: number;
  playerScore?: number;
  penaltyKillCorsiZone?: number;
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
export class MatchDetailComponent implements OnInit {
  match: Match | null = null;
  viewingTeam: string | null = null;
  homeTeamPlayers: PlayerStatDisplay[] = [];
  awayTeamPlayers: PlayerStatDisplay[] = [];
  homeTeamGoalies: PlayerStatDisplay[] = [];
  awayTeamGoalies: PlayerStatDisplay[] = [];
  isMergedGame: boolean = false;
  noStatsMessage: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private matchService: MatchService
  ) {
    // Try to get the match from the router state first (when coming from match-history)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.match = navigation.extras.state['match'] as Match;
      this.viewingTeam = navigation.extras.state['teamName'] as string;
      if (this.match) {
        this.processMatchData();
      }
    }
  }
  
  ngOnInit(): void {
    if (!this.match) {
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.loadMatch(id);
        }
      });
    }
  }
  
  loadMatch(id: string): void {
    this.matchService.getMatch(id).subscribe(match => {
      this.match = match;
      if (this.match) {
        this.processMatchData();
      } else {
        console.error('Match not found with ID:', id);
      }
    });
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
    
    this.match.playerStats.forEach(player => {
      console.log('Processing player:', player.name, 'Stats:', {
        goals: player.goals,
        assists: player.assists,
        shots: player.shots,
        hits: player.hits,
        blockedShots: player.blockedShots,
        penaltyMinutes: player.penaltyMinutes,
        powerPlayGoals: player.powerPlayGoals,
        shortHandedGoals: player.shortHandedGoals,
        gameWinningGoals: player.gameWinningGoals,
        takeaways: player.takeaways,
        giveaways: player.giveaways,
        passes: player.passes,
        passPercentage: player.passPercentage,
        faceoffsWon: player.faceoffsWon,
        faceoffsLost: player.faceoffsLost,
        faceoffPercentage: player.faceoffPercentage,
        playerScore: player.playerScore,
        penaltyKillCorsiZone: player.penaltyKillCorsiZone
      });
      
      const playerDisplay = this.convertToPlayerDisplay(player);
      console.log('Converted player display:', playerDisplay);
      
      if (player.team === this.match?.homeTeam) {
        if (this.isGoalie(player.position)) {
          this.homeTeamGoalies.push(playerDisplay);
        } else {
          this.homeTeamPlayers.push(playerDisplay);
        }
      } else {
        if (this.isGoalie(player.position)) {
          this.awayTeamGoalies.push(playerDisplay);
        } else {
          this.awayTeamPlayers.push(playerDisplay);
        }
      }
    });
    
    // Sort skaters by points
    this.homeTeamPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));
    this.awayTeamPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));
  }
  
  convertToPlayerDisplay(player: PlayerMatchStats): PlayerStatDisplay {
    const basePlayer: PlayerStatDisplay = {
      name: player.name,
      number: player.number,
      position: this.formatPosition(player.position)
    };
    
    if (this.isGoalie(player.position)) {
      // Goalie stats
      return {
        ...basePlayer,
        saves: player.saves,
        shotsAgainst: player.shotsAgainst,
        savePercentage: player.shotsAgainst ? 
          player.saves! / player.shotsAgainst : 0,
        goalsAgainst: player.goalsAgainst
      };
    } else {
      // Skater stats
      return {
        ...basePlayer,
        goals: player.goals || 0,
        assists: player.assists || 0,
        points: (player.goals || 0) + (player.assists || 0),
        plusMinus: player.plusMinus || 0,
        shots: player.shots || 0,
        shotPercentage: player.shots ? (player.goals || 0) / player.shots * 100 : 0,
        hits: player.hits || 0,
        blockedShots: player.blockedShots || 0,
        penaltyMinutes: player.penaltyMinutes || 0,
        powerPlayGoals: player.powerPlayGoals || 0,
        shortHandedGoals: player.shortHandedGoals || 0,
        gameWinningGoals: player.gameWinningGoals || 0,
        takeaways: player.takeaways || 0,
        giveaways: player.giveaways || 0,
        passes: player.passes || 0,
        passPercentage: player.passPercentage || 0,
        faceoffsWon: player.faceoffsWon || 0,
        faceoffsLost: player.faceoffsLost || 0,
        faceoffPercentage: (player.faceoffsWon && player.faceoffsLost) ? 
          (player.faceoffsWon / (player.faceoffsWon + player.faceoffsLost) * 100) : 0,
        playerScore: player.playerScore || 0,
        penaltyKillCorsiZone: player.penaltyKillCorsiZone || 0
      };
    }
  }
  
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  isTeamWinner(teamName: string | undefined): boolean {
    if (!this.match || !this.match.eashlData || !teamName) {
      return false;
    }
    
    if (this.match.homeScore > this.match.awayScore) {
      return teamName === this.match.homeTeam;
    } else if (this.match.awayScore > this.match.homeScore) {
      return teamName === this.match.awayTeam;
    }
    
    return false;
  }
  
  goBack(): void {
    this.location.back();
  }

  getTeamTotalGoals(team: 'home' | 'away'): number {
    const players = team === 'home' ? this.homeTeamPlayers : this.awayTeamPlayers;
    return players.reduce((total, player) => total + (player.goals || 0), 0);
  }

  getTeamTotalAssists(team: 'home' | 'away'): number {
    const players = team === 'home' ? this.homeTeamPlayers : this.awayTeamPlayers;
    return players.reduce((total, player) => total + (player.assists || 0), 0);
  }

  getTeamTotalShots(team: 'home' | 'away'): number {
    const players = team === 'home' ? this.homeTeamPlayers : this.awayTeamPlayers;
    return players.reduce((total, player) => total + (player.shots || 0), 0);
  }

  getTeamTotalHits(team: 'home' | 'away'): number {
    const players = team === 'home' ? this.homeTeamPlayers : this.awayTeamPlayers;
    return players.reduce((total, player) => total + (player.hits || 0), 0);
  }

  getTeamTotalBlocks(team: 'home' | 'away'): number {
    const players = team === 'home' ? this.homeTeamPlayers : this.awayTeamPlayers;
    return players.reduce((total, player) => total + (player.blockedShots || 0), 0);
  }

  private processManualStats(): void {
    if (!this.match?.eashlData?.players) {
      this.noStatsMessage = 'Manual stats were entered but player data is incomplete.';
      return;
    }

    // For manual stats, we need to determine team based on the data structure
    // Since manual stats store players by their database ID, we need to check
    // which team they were assigned to during entry
    
    // Get the home and away club IDs from the match
    const homeClubId = (this.match as any).homeClubId?._id || (this.match as any).homeClubId;
    const awayClubId = (this.match as any).awayClubId?._id || (this.match as any).awayClubId;

    // Process manual stats from eashlData.players
    Object.entries(this.match.eashlData.players).forEach(([playerId, playerData]: [string, any]) => {
      const playerDisplay: PlayerStatDisplay = {
        name: playerData.playername || playerData.name || 'Unknown Player',
        number: 0, // Manual stats don't have jersey numbers
        position: this.formatPosition(playerData.position || 'Unknown')
      };

      // Check if this is a goalie
      if (this.isGoalie(playerData.position)) {
        // Goalie stats
        Object.assign(playerDisplay, {
          saves: playerData.glsaves || 0,
          shotsAgainst: playerData.glshots || 0,
          savePercentage: playerData.glshots ? (playerData.glsaves || 0) / playerData.glshots : 0,
          goalsAgainst: playerData.glga || 0,
          shutout: playerData.glso || 0
        });
      } else {
        // Skater stats
        Object.assign(playerDisplay, {
          goals: playerData.skgoals || 0,
          assists: playerData.skassists || 0,
          points: (playerData.skgoals || 0) + (playerData.skassists || 0),
          plusMinus: playerData.skplusmin || 0
        });
      }

      // For manual stats, determine team based on the stored team field
      if (playerData.team === 'home') {
        if (this.isGoalie(playerData.position)) {
          this.homeTeamGoalies.push(playerDisplay);
        } else {
          this.homeTeamPlayers.push(playerDisplay);
        }
      } else if (playerData.team === 'away') {
        if (this.isGoalie(playerData.position)) {
          this.awayTeamGoalies.push(playerDisplay);
        } else {
          this.awayTeamPlayers.push(playerDisplay);
        }
      } else {
        // Fallback: add to both teams if team is unknown
        if (this.isGoalie(playerData.position)) {
          this.homeTeamGoalies.push(playerDisplay);
          this.awayTeamGoalies.push(playerDisplay);
        } else {
          this.homeTeamPlayers.push(playerDisplay);
          this.awayTeamPlayers.push(playerDisplay);
        }
      }
    });

    // Sort skaters by points
    this.homeTeamPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));
    this.awayTeamPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));

    this.noStatsMessage = ''; // Clear the message since we have stats
  }

  private isGoalie(position: string): boolean {
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

  calculateSavePercentage(saves?: number, shotsAgainst?: number): string {
    if (shotsAgainst === 0 || saves === undefined || shotsAgainst === undefined) {
      return '.000';
    }
    const percentage = saves / shotsAgainst;
    return percentage.toFixed(3).toString();
  }

  getTeamLogo(team: string | undefined): string {
    if (!team) return 'assets/images/square-default.png';
    const teamMap: { [key: string]: string } = {
      'roosters': 'square-iserlohnroosters.png',
      // Add more mappings as needed
    };
    const key = team.replace(/\s+/g, '').toLowerCase().replace(/^[^a-z0-9]+/, '');
    if (teamMap[key]) {
      return 'assets/images/' + teamMap[key];
    }
    return 'assets/images/square-' + key + '.png';
  }

  // Method to get the full image URL
  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/square-default.png';
    }
    
    // If it's already a full URL, return as is
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // If it's a relative path starting with /uploads, prepend the API URL
    if (logoUrl.startsWith('/uploads/')) {
      return `${environment.apiUrl}${logoUrl}`;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }
} 