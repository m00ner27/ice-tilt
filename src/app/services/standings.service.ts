import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SeasonStandings } from '../state/standings/standings.model';

@Injectable({
  providedIn: 'root'
})
export class StandingsService {
  constructor(private http: HttpClient) {}

  getStandings(seasonId: string): Observable<SeasonStandings> {
    return this.http.get<SeasonStandings>(`/api/standings/${seasonId}`);
  }
} 