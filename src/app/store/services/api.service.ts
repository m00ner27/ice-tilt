import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl; // Uses environment variable

  constructor(private http: HttpClient) { }

  // Test basic connection
  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/test`);
  }

  // Get test data from MongoDB
  getTestData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/testdata`);
  }

  // Add test data to MongoDB
  addTestData(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/testdata`, data);
  }

  // Skater data methods
  getSkaterData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/skater-data`);
  }

  addSkaterData(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/skater-data`, data);
  }

  // Game data methods
  getGameData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/game-data`);
  }

  addGameData(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/game-data`, data);
  }

  // Player Profile Methods (New)
  getPlayerProfiles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/player-profiles`);
  }

  addPlayerProfile(profileData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/player-profiles`, profileData);
  }

  // Season data methods
  getSeasons(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/seasons`);
  }

  addSeason(seasonData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/seasons`, seasonData);
  }

  deleteSeason(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/seasons/${id}`);
  }

  // Division data methods
  getDivisions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/divisions`);
  }

  getDivisionsBySeason(seasonId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/divisions/season/${seasonId}`);
  }

  addDivision(divisionData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/divisions`, divisionData);
  }

  deleteDivision(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/divisions/${id}`);
  }

  // Club data methods
  getClubs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs`);
  }

  addClub(clubData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/clubs`, clubData);
  }

  updateClub(clubData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/clubs/${clubData._id}`, clubData);
  }

  deleteClub(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/clubs/${id}`);
  }

  getClubsBySeason(seasonId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/season/${seasonId}`);
  }

  // File upload method
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/api/upload`, formData);
  }
}