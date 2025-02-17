import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlayerStats, GoalieStats, StatsResponse } from '../state/stats/stats.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  getSeasonStats(seasonId: string): Observable<StatsResponse> {
    return this.http.get<StatsResponse>(`${this.apiUrl}/season/${seasonId}`);
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
} 