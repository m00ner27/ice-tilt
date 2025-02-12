import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScheduleGame, GenerateScheduleParams } from './schedule.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = '/api/schedule';

  constructor(private http: HttpClient) {}

  getSchedule(seasonId: string): Observable<ScheduleGame[]> {
    return this.http.get<ScheduleGame[]>(`${this.apiUrl}/season/${seasonId}`);
  }

  generateSchedule(params: GenerateScheduleParams): Observable<ScheduleGame[]> {
    return this.http.post<ScheduleGame[]>(`${this.apiUrl}/generate`, params);
  }

  updateScheduledGame(gameId: string, updates: Partial<ScheduleGame>): Observable<ScheduleGame> {
    return this.http.patch<ScheduleGame>(`${this.apiUrl}/games/${gameId}`, updates);
  }

  generatePlayoffSchedule(seasonId: string, qualifiedTeams: string[]): Observable<ScheduleGame[]> {
    return this.http.post<ScheduleGame[]>(`${this.apiUrl}/playoffs/generate`, {
      seasonId,
      qualifiedTeams
    });
  }

  getTeamSchedule(teamId: string, seasonId: string): Observable<ScheduleGame[]> {
    return this.http.get<ScheduleGame[]>(`${this.apiUrl}/team/${teamId}/season/${seasonId}`);
  }

  getRoundSchedule(seasonId: string, round: number): Observable<ScheduleGame[]> {
    return this.http.get<ScheduleGame[]>(`${this.apiUrl}/season/${seasonId}/round/${round}`);
  }
} 