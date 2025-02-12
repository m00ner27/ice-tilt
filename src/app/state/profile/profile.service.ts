import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from './profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = '/api/profile';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl);
  }

  updateProfile(updates: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.apiUrl, updates);
  }
} 