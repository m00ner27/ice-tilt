import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SeasonStandings } from '../state/standings/standings.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StandingsService {
  private apiUrl = `${environment.apiUrl}/standings`;

  constructor(private http: HttpClient) {}

  getStandings(seasonId: string): Observable<SeasonStandings> {
    return this.http.get<SeasonStandings>(`${this.apiUrl}/season/${seasonId}`);
  }
} 