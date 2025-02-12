import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Season } from './seasons.model';

@Injectable({
  providedIn: 'root'
})
export class SeasonsService {
  private apiUrl = '/api/seasons';

  constructor(private http: HttpClient) {}

  getSeasons(): Observable<Season[]> {
    return this.http.get<Season[]>(this.apiUrl);
  }

  createSeason(season: Omit<Season, 'id'>): Observable<Season> {
    return this.http.post<Season>(this.apiUrl, season);
  }

  updateSeasonStatus(seasonId: string, status: Season['status']): Observable<Season> {
    return this.http.patch<Season>(`${this.apiUrl}/${seasonId}/status`, { status });
  }

  startPlayoffs(
    seasonId: string, 
    playoffRounds: number, 
    teamsPerRound: number
  ): Observable<Season> {
    return this.http.post<Season>(`${this.apiUrl}/${seasonId}/playoffs`, {
      playoffRounds,
      teamsPerRound
    });
  }

  setCurrentSeason(seasonId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/current`, { seasonId });
  }
} 