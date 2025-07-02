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
  saves?: number;
  shotsAgainst?: number;
  goalsAgainst?: number;
  shutout?: number;
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
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  private transformGameData(game: any): Match {
    const playerStats: PlayerMatchStats[] = [];

    if (game.eashlData?.players) {
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
            saves: parseInt(playerData.glsaves) || 0,
            shotsAgainst: parseInt(playerData.glshots) || 0,
            goalsAgainst: parseInt(playerData.glga) || 0,
            shutout: parseInt(playerData.glso) || 0
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
      playerStats: playerStats,
      eashlData: game.eashlData,
      seasonId: game.seasonId // Populate seasonId
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
  
  getMatchesByTeam(teamName: string): Observable<Match[]> {
    return this.getMatches().pipe(
      map(matches => matches.filter(match => 
        match.homeTeam === teamName || match.awayTeam === teamName
      ))
    );
  }
} 