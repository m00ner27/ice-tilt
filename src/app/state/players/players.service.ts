import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SeasonPlayerStats } from './players.models';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {
  private apiUrl = '/api/players';

  constructor(private http: HttpClient) {}

  getPlayers(seasonId: string): Observable<SeasonPlayerStats> {
    return this.http.get<SeasonPlayerStats>(`${this.apiUrl}/season/${seasonId}`);
  }
} 