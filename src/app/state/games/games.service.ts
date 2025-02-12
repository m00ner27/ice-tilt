import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameSummary } from './games.model';

@Injectable({
  providedIn: 'root'
})
export class GamesService {
  private apiUrl = '/api/games';

  constructor(private http: HttpClient) {}

  getGames(seasonId: string): Observable<GameSummary[]> {
    return this.http.get<GameSummary[]>(`${this.apiUrl}/season/${seasonId}`);
  }

  getGameSummary(gameId: string): Observable<GameSummary> {
    return this.http.get<GameSummary>(`${this.apiUrl}/${gameId}`);
  }
} 