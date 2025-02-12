import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SeasonStandings } from './standings.model';

@Injectable({
  providedIn: 'root'
})
export class StandingsService {
  private apiUrl = 'your-api-url/standings'; // Replace with your actual API URL

  constructor(private http: HttpClient) {}

  getStandings(seasonId: string): Observable<SeasonStandings> {
    return this.http.get<SeasonStandings>(`${this.apiUrl}/${seasonId}`);
  }
}