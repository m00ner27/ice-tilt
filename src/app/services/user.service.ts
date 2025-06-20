import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PlayerProfile {
  id?: string;
  name?: string;
  position?: string;
  secondaryPositions?: string[];
  handedness?: string;
  location?: string;
  region?: string;
  psnId?: string;
  xboxGamertag?: string;
  bio?: string;
  status?: string;
  currentClubId?: string | null;
}

export interface User {
  id?: string;
  _id?: string;
  email?: string;
  role?: string;
  discordId?: string;
  discordUsername?: string;
  playerProfile?: PlayerProfile;
  platform?: string;
  gamertag?: string;
  auth0Id?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(users => users.map(u => ({
        ...u,
        id: u._id || u.id
      })))
    );
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, data);
  }
} 