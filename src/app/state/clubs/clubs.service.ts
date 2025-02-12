import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Club, ClubsResponse } from './clubs.model';

@Injectable({
  providedIn: 'root'
})
export class ClubsService {
  private apiUrl = 'your-api-url/clubs'; // Replace with your actual API URL

  constructor(private http: HttpClient) {}

  getClubs(): Observable<ClubsResponse> {
    return this.http.get<ClubsResponse>(this.apiUrl);
  }

  getClub(id: string): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/${id}`);
  }
} 