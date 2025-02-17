import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FreeAgent } from './free-agents.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FreeAgentsService {
  private apiUrl = `${environment.apiUrl}/free-agents`;

  constructor(private http: HttpClient) {}

  getFreeAgents(seasonId: string): Observable<FreeAgent[]> {
    return this.http.get<FreeAgent[]>(`${this.apiUrl}/season/${seasonId}`);
  }

  addToFreeAgents(playerId: string, seasonId: string): Observable<FreeAgent> {
    return this.http.post<FreeAgent>(this.apiUrl, { playerId, seasonId });
  }

  updateStatus(playerId: string, status: FreeAgent['status']): Observable<FreeAgent> {
    return this.http.patch<FreeAgent>(`${this.apiUrl}/${playerId}/status`, { status });
  }

  signFreeAgent(playerId: string, teamId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${playerId}/sign`, { teamId });
  }
} 