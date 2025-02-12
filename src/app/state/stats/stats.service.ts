import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlayerStats, GoalieStats } from './stats.model';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = '/api/stats';

  constructor(private http: HttpClient) {}

  getSeasonStats(seasonId: string): Observable<{ playerStats: PlayerStats[]; goalieStats: GoalieStats[] }> {
    return this.http.get<{ playerStats: PlayerStats[]; goalieStats: GoalieStats[] }>(
      `${this.apiUrl}/season/${seasonId}`
    );
  }

  updatePlayerStats(
    playerId: string,
    seasonId: string,
    updates: Partial<PlayerStats>
  ): Observable<PlayerStats> {
    return this.http.patch<PlayerStats>(
      `${this.apiUrl}/players/${playerId}/season/${seasonId}`,
      updates
    );
  }

  updateGoalieStats(
    playerId: string,
    seasonId: string,
    updates: Partial<GoalieStats>
  ): Observable<GoalieStats> {
    return this.http.patch<GoalieStats>(
      `${this.apiUrl}/goalies/${playerId}/season/${seasonId}`,
      updates
    );
  }

  recordGameStats(
    gameId: string,
    seasonId: string,
    playerStats: Partial<PlayerStats>[],
    goalieStats: Partial<GoalieStats>[]
  ): Observable<{ playerStats: PlayerStats[]; goalieStats: GoalieStats[] }> {
    return this.http.post<{ playerStats: PlayerStats[]; goalieStats: GoalieStats[] }>(
      `${this.apiUrl}/games/${gameId}`,
      {
        seasonId,
        playerStats,
        goalieStats
      }
    );
  }

  getPlayerSeasonStats(playerId: string, seasonId: string): Observable<PlayerStats> {
    return this.http.get<PlayerStats>(
      `${this.apiUrl}/players/${playerId}/season/${seasonId}`
    );
  }

  getGoalieSeasonStats(playerId: string, seasonId: string): Observable<GoalieStats> {
    return this.http.get<GoalieStats>(
      `${this.apiUrl}/goalies/${playerId}/season/${seasonId}`
    );
  }
} 