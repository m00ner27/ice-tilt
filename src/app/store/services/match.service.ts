import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';

export interface PlayerMatchStats {
  playerId: number;
  name: string;
  team: string;
  number: number;
  position: string;
  goals?: number;
  assists?: number;
  plusMinus?: number;
  shots?: number;
  timeOnIce?: string;
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
  goalsAgainst?: number;
  goalsAgainstAverage?: number;
  shutout?: number;
  shutoutPeriods?: number;
}

export interface ClubInfo {
  _id: string;
  name: string;
  logoUrl?: string;
  eashlClubId?: string;
}

export interface Match {
  id: any;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeClub?: ClubInfo;
  awayClub?: ClubInfo;
  homeScore: number;
  awayScore: number;
  isOvertime?: boolean;
  isShootout?: boolean;
  playerStats: PlayerMatchStats[];
  // Keep a reference to the raw eashlData if needed elsewhere
  eashlData?: any; 
  seasonId?: string; // Add seasonId
  eashlMatchId?: string; // Add eashlMatchId for merged games
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  private transformGameData(game: any): Match {
    const playerStats: PlayerMatchStats[] = [];

    // Check if this is a merged game (has eashlMatchId with +)
    const isMergedGame = game.eashlMatchId && game.eashlMatchId.includes('+');
    
    // Check if this is a manual stats entry
    const isManualEntry = game.eashlData?.manualEntry;
    
    if (isMergedGame) {
      console.log(`Processing merged game ${game._id} with eashlMatchId: ${game.eashlMatchId}`);
      // Merged games should have combined player stats in eashlData
      if (game.eashlData?.players) {
        console.log('Found combined player stats for merged game');
      } else {
        console.log('No combined player stats found for merged game');
      }
    }

    if (isManualEntry) {
      console.log(`Processing manual stats entry for game ${game._id}`);
      // Manual stats store players by their database ID, not by club
      if (game.eashlData?.players) {
        Object.entries(game.eashlData.players).forEach(([playerId, playerData]: [string, any]) => {
          // For manual stats, determine team based on the stored team field
          let teamName = 'Unknown';
          if (playerData.team === 'home') {
            teamName = game.homeClubId?.name || 'Home Team';
          } else if (playerData.team === 'away') {
            teamName = game.awayClubId?.name || 'Away Team';
          }
          
          playerStats.push({
            playerId: parseInt(playerId),
            name: playerData.playername || playerData.name || 'Unknown',
            team: teamName,
            number: 0, // Manual stats don't have jersey numbers
            position: playerData.position || 'Unknown',
            goals: parseInt(playerData.skgoals) || 0,
            assists: parseInt(playerData.skassists) || 0,
            plusMinus: parseInt(playerData.skplusmin) || 0,
            shots: parseInt(playerData.skshots) || 0,
            timeOnIce: playerData.sktoi || 'N/A',
            shotPercentage: playerData.skshots ? (parseInt(playerData.skgoals) || 0) / parseInt(playerData.skshots) * 100 : 0,
            hits: parseInt(playerData.skhits) || 0,
            blockedShots: parseInt(playerData.skblk) || 0,
            penaltyMinutes: parseInt(playerData.skpim) || 0,
            powerPlayGoals: parseInt(playerData.skppg) || 0,
            shortHandedGoals: parseInt(playerData.skshg) || 0,
            gameWinningGoals: parseInt(playerData.skgwg) || 0,
            takeaways: parseInt(playerData.sktakeaways) || 0,
            giveaways: parseInt(playerData.skgiveaways) || 0,
            passes: parseInt(playerData.skpasses) || 0,
            passPercentage: parseInt(playerData.skpasspercentage) || 0,
            faceoffsWon: parseInt(playerData.skfow) || 0,
            faceoffsLost: parseInt(playerData.skfol) || 0,
            faceoffPercentage: parseInt(playerData.skfopercentage) || 0,
            playerScore: parseInt(playerData.score) || 0,
            penaltyKillCorsiZone: parseInt(playerData.skpkc) || 0,
            saves: parseInt(playerData.glsaves) || 0,
            shotsAgainst: parseInt(playerData.glshots) || 0,
            goalsAgainst: parseInt(playerData.glga) || 0,
            goalsAgainstAverage: parseFloat(playerData.glgaa) || 0,
            shutout: parseInt(playerData.glso) || 0,
            shutoutPeriods: parseInt(playerData.glsoperiods) || 0
          });
        });
      }
    } else if (game.eashlData?.players) {
      // Get the EASHL club IDs from the populated club data
      const homeEashlClubId = game.homeClubId?.eashlClubId;
      const awayEashlClubId = game.awayClubId?.eashlClubId;

      const processTeamPlayers = (teamPlayers: any, teamName: string) => {
        if (!teamPlayers) return;
        
        Object.entries(teamPlayers).forEach(([playerId, playerData]: [string, any]) => {
          playerStats.push({
            playerId: parseInt(playerId),
            name: playerData.playername || 'Unknown',
            team: teamName,
            number: parseInt(playerData.jerseynum) || 0,
            position: playerData.position || 'Unknown',
            goals: parseInt(playerData.skgoals) || 0,
            assists: parseInt(playerData.skassists) || 0,
            plusMinus: parseInt(playerData.skplusmin) || 0,
            shots: parseInt(playerData.skshots) || 0,
            timeOnIce: playerData.sktoi || 'N/A',
            shotPercentage: playerData.skshots ? (parseInt(playerData.skgoals) || 0) / parseInt(playerData.skshots) * 100 : 0,
            hits: parseInt(playerData.skhits) || 0,
            blockedShots: parseInt(playerData.skblk) || 0,
            penaltyMinutes: parseInt(playerData.skpim) || 0,
            powerPlayGoals: parseInt(playerData.skppg) || 0,
            shortHandedGoals: parseInt(playerData.skshg) || 0,
            gameWinningGoals: parseInt(playerData.skgwg) || 0,
            takeaways: parseInt(playerData.sktakeaways) || 0,
            giveaways: parseInt(playerData.skgiveaways) || 0,
            passes: parseInt(playerData.skpasses) || 0,
            passPercentage: parseInt(playerData.skpasspercentage) || 0,
            faceoffsWon: parseInt(playerData.skfow) || 0,
            faceoffsLost: parseInt(playerData.skfol) || 0,
            faceoffPercentage: parseInt(playerData.skfopercentage) || 0,
            playerScore: parseInt(playerData.score) || 0,
            penaltyKillCorsiZone: parseInt(playerData.skpkc) || 0,
            saves: parseInt(playerData.glsaves) || 0,
            shotsAgainst: parseInt(playerData.glshots) || 0,
            goalsAgainst: parseInt(playerData.glga) || 0,
            goalsAgainstAverage: parseFloat(playerData.glgaa) || 0,
            shutout: parseInt(playerData.glso) || 0,
            shutoutPeriods: parseInt(playerData.glsoperiods) || 0
          });
        });
      };

      if (homeEashlClubId && game.eashlData.players[homeEashlClubId]) {
        processTeamPlayers(game.eashlData.players[homeEashlClubId], game.homeClubId.name);
      }
      if (awayEashlClubId && game.eashlData.players[awayEashlClubId]) {
        processTeamPlayers(game.eashlData.players[awayEashlClubId], game.awayClubId.name);
      }
    }

    // Determine scores
    let homeScore = game.homeTeamScore;
    let awayScore = game.awayTeamScore;

    if (game.eashlData?.clubs) {
      const homeEashlClubId = game.homeClubId?.eashlClubId;
      const awayEashlClubId = game.awayClubId?.eashlClubId;

      if (homeEashlClubId && game.eashlData.clubs[homeEashlClubId]) {
        homeScore = parseInt(game.eashlData.clubs[homeEashlClubId].score);
      }
      if (awayEashlClubId && game.eashlData.clubs[awayEashlClubId]) {
        // The EA API gives the opponent's score on the home club's data
        const homeClubData = game.eashlData.clubs[homeEashlClubId];
        if (homeClubData && homeClubData.opponentClubId === awayEashlClubId) {
           awayScore = parseInt(homeClubData.opponentScore);
        }
      }
    }

    return {
      id: game._id,
      date: game.date,
      homeTeam: game.homeClubId?.name || 'Unknown',
      awayTeam: game.awayClubId?.name || 'Unknown',
      homeClub: game.homeClubId,
      awayClub: game.awayClubId,
      homeScore: homeScore,
      awayScore: awayScore,
      isOvertime: game.isOvertime || false,
      isShootout: game.isShootout || false,
      playerStats: playerStats,
      eashlData: game.eashlData,
      seasonId: game.seasonId, // Populate seasonId
      eashlMatchId: game.eashlMatchId // Add eashlMatchId for merged games
    };
  }
  
  getMatch(id: string): Observable<Match> {
    return this.http.get<any>(`${this.apiUrl}/games/${id}`).pipe(
      map(this.transformGameData)
    );
  }
  
  getMatches(): Observable<Match[]> {
    return this.http.get<any[]>(`${this.apiUrl}/games`).pipe(
      map(games => games.map(this.transformGameData))
    );
  }

  // Method to force refresh matches (useful after data changes)
  refreshMatches(): Observable<Match[]> {
    return this.http.get<any[]>(`${this.apiUrl}/games`).pipe(
      map(games => games.map(this.transformGameData))
    );
  }
  
  getMatchesByTeam(teamName: string): Observable<Match[]> {
    return this.getMatches().pipe(
      map(matches => matches.filter(match => 
        match.homeTeam === teamName || match.awayTeam === teamName
      ))
    );
  }
} 