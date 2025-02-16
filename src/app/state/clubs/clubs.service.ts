import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Club, ClubsResponse } from './clubs.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClubsService {
  private apiUrl = `${environment.apiUrl}/clubs`; // We'll set this in environment.ts

  constructor(private http: HttpClient) {}

  getClubs(): Observable<ClubsResponse> {
    return this.http.get<ClubsResponse>(this.apiUrl);
  }

  getClub(id: string): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/${id}`);
  }
} 