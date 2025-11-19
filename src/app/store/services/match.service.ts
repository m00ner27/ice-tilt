import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheService } from '../../shared/services/cache.service';

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
  interceptions?: number;
  penaltyAssists?: number;
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

export interface EashlMatch {
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
  forfeit?: string;
  playerStats: PlayerMatchStats[];
  // Keep a reference to the raw eashlData if needed elsewhere
  eashlData?: any; 
  seasonId?: string; // Add seasonId
  eashlMatchId?: string; // Add eashlMatchId for merged games
  // Playoff game flags
  isPlayoff?: boolean;
  playoffBracketId?: string;
  playoffSeriesId?: string;
  playoffRoundId?: string;
  // Additional fields for reference
  _id?: any;
  homeClubId?: any;
  awayClubId?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private cacheService: CacheService) { }

  private transformGameData(game: any): EashlMatch {
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
      // Manual stats are stored in eashlData.players with homeSkaters/awaySkaters arrays
      if (game.eashlData?.players) {
        const { homeSkaters = [], awaySkaters = [], homeGoalies = [], awayGoalies = [] } = game.eashlData.players;
        
        // Process home team skaters
        homeSkaters.forEach((playerData: any) => {
          const teamName = game.homeClubId?.name || 'Home Team';
          
          playerStats.push({
            playerId: parseInt(playerData.playerId) || 0,
            name: playerData.gamertag || playerData.name || 'Unknown',
            team: teamName,
            number: parseInt(playerData.number) || 0,
            position: playerData.position || 'Unknown',
            goals: parseInt(playerData.goals) || 0,
            assists: parseInt(playerData.assists) || 0,
            plusMinus: parseInt(playerData.plusMinus) || 0,
            shots: parseInt(playerData.shots) || 0,
            timeOnIce: 'N/A', // Manual stats don't track time on ice
            shotPercentage: playerData.shots ? (parseInt(playerData.goals) || 0) / parseInt(playerData.shots) * 100 : 0,
            hits: parseInt(playerData.hits) || 0,
            blockedShots: parseInt(playerData.blockedShots) || 0,
            penaltyMinutes: parseInt(playerData.penaltyMinutes) || 0,
            powerPlayGoals: parseInt(playerData.powerPlayGoals) || 0,
            shortHandedGoals: parseInt(playerData.shortHandedGoals) || 0,
            gameWinningGoals: parseInt(playerData.gameWinningGoals) || 0,
            takeaways: parseInt(playerData.takeaways) || 0,
            giveaways: parseInt(playerData.giveaways) || 0,
            passes: parseInt(playerData.passesCompleted) || 0,
            passPercentage: playerData.passAttempts ? (parseInt(playerData.passesCompleted) || 0) / parseInt(playerData.passAttempts) * 100 : 0,
            faceoffsWon: parseInt(playerData.faceoffsWon) || 0,
            faceoffsLost: parseInt(playerData.faceoffsLost) || 0,
            faceoffPercentage: (playerData.faceoffsWon && playerData.faceoffsLost) ? 
              (parseInt(playerData.faceoffsWon) || 0) / ((parseInt(playerData.faceoffsWon) || 0) + (parseInt(playerData.faceoffsLost) || 0)) * 100 : 0,
            interceptions: parseInt(playerData.interceptions) || 0,
            penaltyAssists: parseInt(playerData.penaltyAssists) || 0,
            playerScore: parseInt(playerData.score) || 0,
            penaltyKillCorsiZone: parseInt(playerData.penaltyKillCorsiZone) || 0,
            saves: 0, // Skaters don't have saves
            shotsAgainst: 0,
            goalsAgainst: 0,
            goalsAgainstAverage: 0,
            shutout: 0,
            shutoutPeriods: 0
          });
        });
        
        // Process away team skaters
        awaySkaters.forEach((playerData: any) => {
          const teamName = game.awayClubId?.name || 'Away Team';
          
          playerStats.push({
            playerId: parseInt(playerData.playerId) || 0,
            name: playerData.gamertag || playerData.name || 'Unknown',
            team: teamName,
            number: parseInt(playerData.number) || 0,
            position: playerData.position || 'Unknown',
            goals: parseInt(playerData.goals) || 0,
            assists: parseInt(playerData.assists) || 0,
            plusMinus: parseInt(playerData.plusMinus) || 0,
            shots: parseInt(playerData.shots) || 0,
            timeOnIce: 'N/A', // Manual stats don't track time on ice
            shotPercentage: playerData.shots ? (parseInt(playerData.goals) || 0) / parseInt(playerData.shots) * 100 : 0,
            hits: parseInt(playerData.hits) || 0,
            blockedShots: parseInt(playerData.blockedShots) || 0,
            penaltyMinutes: parseInt(playerData.penaltyMinutes) || 0,
            powerPlayGoals: parseInt(playerData.powerPlayGoals) || 0,
            shortHandedGoals: parseInt(playerData.shortHandedGoals) || 0,
            gameWinningGoals: parseInt(playerData.gameWinningGoals) || 0,
            takeaways: parseInt(playerData.takeaways) || 0,
            giveaways: parseInt(playerData.giveaways) || 0,
            passes: parseInt(playerData.passesCompleted) || 0,
            passPercentage: playerData.passAttempts ? (parseInt(playerData.passesCompleted) || 0) / parseInt(playerData.passAttempts) * 100 : 0,
            faceoffsWon: parseInt(playerData.faceoffsWon) || 0,
            faceoffsLost: parseInt(playerData.faceoffsLost) || 0,
            faceoffPercentage: (playerData.faceoffsWon && playerData.faceoffsLost) ? 
              (parseInt(playerData.faceoffsWon) || 0) / ((parseInt(playerData.faceoffsWon) || 0) + (parseInt(playerData.faceoffsLost) || 0)) * 100 : 0,
            interceptions: parseInt(playerData.interceptions) || 0,
            penaltyAssists: parseInt(playerData.penaltyAssists) || 0,
            playerScore: parseInt(playerData.score) || 0,
            penaltyKillCorsiZone: parseInt(playerData.penaltyKillCorsiZone) || 0,
            saves: 0, // Skaters don't have saves
            shotsAgainst: 0,
            goalsAgainst: 0,
            goalsAgainstAverage: 0,
            shutout: 0,
            shutoutPeriods: 0
          });
        });
        
        // Process home team goalies
        homeGoalies.forEach((playerData: any) => {
          const teamName = game.homeClubId?.name || 'Home Team';
          
          playerStats.push({
            playerId: parseInt(playerData.playerId) || 0,
            name: playerData.gamertag || playerData.name || 'Unknown',
            team: teamName,
            number: parseInt(playerData.number) || 0,
            position: 'G',
            goals: 0, // Goalies don't score goals
            assists: parseInt(playerData.assists) || 0,
            plusMinus: 0, // Goalies don't have plus/minus
            shots: 0, // Goalies don't take shots
            timeOnIce: 'N/A',
            shotPercentage: 0,
            hits: 0,
            blockedShots: 0,
            penaltyMinutes: parseInt(playerData.penaltyMinutes) || 0,
            powerPlayGoals: 0,
            shortHandedGoals: 0,
            gameWinningGoals: 0,
            takeaways: 0,
            giveaways: 0,
            passes: 0,
            passPercentage: 0,
            faceoffsWon: 0,
            faceoffsLost: 0,
            faceoffPercentage: 0,
            interceptions: 0,
            penaltyAssists: 0,
            playerScore: parseInt(playerData.score) || 0,
            penaltyKillCorsiZone: 0,
            saves: parseInt(playerData.saves) || 0,
            shotsAgainst: parseInt(playerData.shotsAgainst) || 0,
            goalsAgainst: parseInt(playerData.goalsAgainst) || 0,
            goalsAgainstAverage: playerData.shotsAgainst ? (parseInt(playerData.goalsAgainst) || 0) / (parseInt(playerData.shotsAgainst) || 1) * 60 : 0,
            shutout: parseInt(playerData.shutout) || 0,
            shutoutPeriods: parseInt(playerData.shutoutPeriods) || 0
          });
        });
        
        // Process away team goalies
        awayGoalies.forEach((playerData: any) => {
          const teamName = game.awayClubId?.name || 'Away Team';
          
          playerStats.push({
            playerId: parseInt(playerData.playerId) || 0,
            name: playerData.gamertag || playerData.name || 'Unknown',
            team: teamName,
            number: parseInt(playerData.number) || 0,
            position: 'G',
            goals: 0, // Goalies don't score goals
            assists: parseInt(playerData.assists) || 0,
            plusMinus: 0, // Goalies don't have plus/minus
            shots: 0, // Goalies don't take shots
            timeOnIce: 'N/A',
            shotPercentage: 0,
            hits: 0,
            blockedShots: 0,
            penaltyMinutes: parseInt(playerData.penaltyMinutes) || 0,
            powerPlayGoals: 0,
            shortHandedGoals: 0,
            gameWinningGoals: 0,
            takeaways: 0,
            giveaways: 0,
            passes: 0,
            passPercentage: 0,
            faceoffsWon: 0,
            faceoffsLost: 0,
            faceoffPercentage: 0,
            interceptions: 0,
            penaltyAssists: 0,
            playerScore: parseInt(playerData.score) || 0,
            penaltyKillCorsiZone: 0,
            saves: parseInt(playerData.saves) || 0,
            shotsAgainst: parseInt(playerData.shotsAgainst) || 0,
            goalsAgainst: parseInt(playerData.goalsAgainst) || 0,
            goalsAgainstAverage: playerData.shotsAgainst ? (parseInt(playerData.goalsAgainst) || 0) / (parseInt(playerData.shotsAgainst) || 1) * 60 : 0,
            shutout: parseInt(playerData.shutout) || 0,
            shutoutPeriods: parseInt(playerData.shutoutPeriods) || 0
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
          const processedPlayer = {
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
            blockedShots: parseInt(playerData.skbs) || 0,
            penaltyMinutes: parseInt(playerData.skpim) || 0,
            powerPlayGoals: parseInt(playerData.skppg) || 0,
            shortHandedGoals: parseInt(playerData.skshg) || 0,
            gameWinningGoals: parseInt(playerData.skgwg) || 0,
            takeaways: parseInt(playerData.sktakeaways) || 0,
            giveaways: parseInt(playerData.skgiveaways) || 0,
            passes: parseInt(playerData.skpasses) || 0,
            passPercentage: playerData.skpassattempts > 0 ? 
              parseFloat(((parseInt(playerData.skpasses) || 0) / parseInt(playerData.skpassattempts) * 100).toFixed(1)) : 0,
            faceoffsWon: parseInt(playerData.skfow) || 0,
            faceoffsLost: parseInt(playerData.skfol) || 0,
            faceoffPercentage: parseInt(playerData.skfopercentage) || 0,
            interceptions: parseInt(playerData.skint) || parseInt(playerData.skinterceptions) || 0,
            penaltyAssists: parseInt(playerData.skpassattempts) || 0, // PA = Pass Attempts
            playerScore: parseInt(playerData.score) || 0,
            penaltyKillCorsiZone: parseInt(playerData.skpkc) || 0,
            saves: parseInt(playerData.glsaves) || 0,
            shotsAgainst: parseInt(playerData.glshots) || 0,
            goalsAgainst: parseInt(playerData.glga) || 0,
            goalsAgainstAverage: parseFloat(playerData.glgaa) || 0,
            shutout: parseInt(playerData.glso) || 0,
            shutoutPeriods: parseInt(playerData.glsoperiods) || 0
          };
          
          
          playerStats.push(processedPlayer);
        });
      };

      // Process home team players
      if (homeEashlClubId && game.eashlData.players[homeEashlClubId]) {
        processTeamPlayers(game.eashlData.players[homeEashlClubId], game.homeClubId.name);
      }
      
      // Process away team players
      if (awayEashlClubId && game.eashlData.players[awayEashlClubId]) {
        processTeamPlayers(game.eashlData.players[awayEashlClubId], game.awayClubId.name);
      } else {
        // Check if there's a different club ID that might be the away team
        const availableClubIds = Object.keys(game.eashlData.players);
        const homeClubId = homeEashlClubId;
        const otherClubId = availableClubIds.find(id => id !== homeClubId);
        
        if (otherClubId) {
          processTeamPlayers(game.eashlData.players[otherClubId], game.awayClubId.name);
        }
      }
    }

    // Determine scores
    let homeScore = game.homeTeamScore;
    let awayScore = game.awayTeamScore;

    if (game.eashlData?.clubs) {
      const homeEashlClubId = game.homeClubId?.eashlClubId;
      const awayEashlClubId = game.awayClubId?.eashlClubId;

      // Get home team score
      if (homeEashlClubId && game.eashlData.clubs[homeEashlClubId]) {
        homeScore = parseInt(game.eashlData.clubs[homeEashlClubId].score);
      }
      
      // Get away team score - try multiple methods
      if (awayEashlClubId && game.eashlData.clubs[awayEashlClubId]) {
        // Method 1: Try to get away team's own score
        const awayClubData = game.eashlData.clubs[awayEashlClubId];
        if (awayClubData && awayClubData.score) {
          awayScore = parseInt(awayClubData.score);
        }
        // Method 2: If not available, get from home club's opponent score
        else if (homeEashlClubId && game.eashlData.clubs[homeEashlClubId]) {
          const homeClubData = game.eashlData.clubs[homeEashlClubId];
          if (homeClubData && homeClubData.opponentClubId === awayEashlClubId && homeClubData.opponentScore) {
            awayScore = parseInt(homeClubData.opponentScore);
          }
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
      forfeit: game.forfeit,
      playerStats: playerStats,
      eashlData: game.eashlData,
      seasonId: game.seasonId, // Populate seasonId
      eashlMatchId: game.eashlMatchId, // Add eashlMatchId for merged games
      // Preserve playoff flags for filtering
      isPlayoff: game.isPlayoff,
      playoffBracketId: game.playoffBracketId,
      playoffSeriesId: game.playoffSeriesId,
      playoffRoundId: game.playoffRoundId,
      // Also preserve original game data for reference
      _id: game._id,
      homeClubId: game.homeClubId,
      awayClubId: game.awayClubId
    };
  }
  
    getMatch(id: string): Observable<EashlMatch> {
    return this.http.get<any>(`${this.apiUrl}/api/games/${id}`).pipe(
      map(this.transformGameData)
    );
  }

  getMatches(): Observable<EashlMatch[]> {
    const cacheKey = 'matches';
    
    // Check cache first
    if (this.cacheService.has(cacheKey)) {
      return of(this.cacheService.get(cacheKey));
    }

    return this.http.get<any[]>(`${this.apiUrl}/api/games`).pipe(
      map(games => {
        const transformedGames = games.map(this.transformGameData);
        // Cache for 5 minutes
        this.cacheService.set(cacheKey, transformedGames, 5);
        return transformedGames;
      })
    );
  }

  // Method to force refresh matches (useful after data changes)
  refreshMatches(): Observable<EashlMatch[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/games`).pipe(
      map(games => games.map(this.transformGameData))
    );
  }
  
  getMatchesByTeam(teamName: string): Observable<EashlMatch[]> {
    return this.getMatches().pipe(
      map(matches => matches.filter(match => 
        match.homeTeam === teamName || match.awayTeam === teamName
      ))
    );
  }
} 