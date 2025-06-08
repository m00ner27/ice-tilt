import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EashlService {
  private apiUrl = `${environment.apiUrl}/api/eashl`;

  constructor(private http: HttpClient) {}

  getClubMatches(clubId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/clubs/${clubId}/matches`);
  }

  getClubStats(clubId: string, platform: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/clubs/${clubId}/stats`, { params: { platform } });
  }

  getPlayerStats(clubId: string, playerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/clubs/${clubId}/players/${playerId}`);
  }
} 