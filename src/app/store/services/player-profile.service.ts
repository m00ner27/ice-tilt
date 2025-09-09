import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PlayerProfile } from '../models/models/player-profile.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlayerProfileService {
  private apiUrl = `${environment.apiUrl}/api/player-profiles`;

  constructor(private http: HttpClient) {}

  getAllPlayerProfiles(): Observable<PlayerProfile[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(apiProfiles => apiProfiles.map(profile => this.mapApiProfileToModel(profile)))
    );
  }

  private mapApiProfileToModel(api: any): PlayerProfile {
    return {
      name: api.name,
      position: api.primaryPosition || api.position || '',
      secondaryPositions: api.secondaryPositions || [],
      handedness: api.handedness,
      location: api.location,
      region: api.region, // May be undefined in API
      psnId: api.psnId, // Add mapping if present in API
      xboxGamertag: api.xboxGamertag, // Add mapping if present in API
      bio: api.bio,
      status: api.status || 'Signed', // Default/fallback
      currentClubId: api.currentClubId || null,
      // Add mapping for stats or other fields if needed
    };
  }

  upsertPlayerProfile(profile: PlayerProfile): Observable<PlayerProfile> {
    return this.http.put<PlayerProfile>(
      `${this.apiUrl}/${encodeURIComponent(profile.name)}`,
      profile
    );
  }

  getProfileByName(name: string): Observable<PlayerProfile | null> {
    return this.http.get<PlayerProfile[]>(`${this.apiUrl}?name=${encodeURIComponent(name)}`).pipe(
      map(profiles => profiles.length ? profiles[0] : null)
    );
  }
}
