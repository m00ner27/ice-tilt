import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { Game } from '../models/models/match.interface';
import { User } from '../users.actions';
import { AuthService } from '@auth0/auth0-angular';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl; // Uses environment variable

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { 
    // Add request interceptor to track all HTTP requests
    console.log('=== API SERVICE: Constructor initialized ===');
  }

  // Add method to test the specific endpoint directly
  testPetosenPalloRoster(): Observable<any> {
    const clubId = '68768d41ab18f6cd40f8d8c5';
    const seasonId = '687649d7ab18f6cd40f8d83d';
    const url = `${this.apiUrl}/api/clubs/${clubId}/roster?seasonId=${seasonId}`;
    
    console.log('=== TESTING PETOSEN PALLO ROSTER ENDPOINT ===');
    console.log('Testing URL:', url);
    
    return this.http.get(url).pipe(
      tap(response => {
        console.log('=== TEST RESPONSE RECEIVED ===');
        console.log('Response:', response);
      }),
      catchError(error => {
        console.error('=== TEST ERROR RECEIVED ===');
        console.error('Error:', error);
        throw error;
      })
    );
  }

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
    console.log('=== API SERVICE: getSeasons ===');
    console.log('URL:', `${this.apiUrl}/api/seasons`);
    
    return this.http.get<any[]>(`${this.apiUrl}/api/seasons`).pipe(
      tap(response => {
        console.log('=== API SERVICE: getSeasons Response ===');
        console.log('Response:', response);
        console.log('Response length:', response?.length || 0);
      }),
      catchError(error => {
        console.error('=== API SERVICE: getSeasons Error ===');
        console.error('Error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        throw error;
      })
    );
  }

  addSeason(seasonData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/seasons`, seasonData);
  }

  deleteSeason(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/seasons/${id}`);
  }

  updateSeason(season: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/seasons/${season._id}`, season);
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

  updateDivision(division: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/divisions/${division._id}`, division);
  }

  // Club data methods
  getClubs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs`);
  }

  getClubById(clubId: string): Observable<any> {
    console.log('=== API SERVICE: getClubById ===');
    console.log('clubId:', clubId);
    console.log('URL:', `${this.apiUrl}/api/clubs/${clubId}`);
    
    return this.http.get<any>(`${this.apiUrl}/api/clubs/${clubId}`).pipe(
      tap(response => {
        console.log('=== API SERVICE: getClubById Response ===');
        console.log('Response:', response);
        console.log('Response type:', typeof response);
      }),
      catchError(error => {
        console.error('=== API SERVICE: getClubById Error ===');
        console.error('Error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        throw error;
      })
    );
  }

  addClub(clubData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/clubs`, clubData);
  }

  updateClub(clubData: any): Observable<any> {
    console.log('ApiService: updateClub called for clubId:', clubData._id);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put(`${this.apiUrl}/api/clubs/${clubData._id}`, clubData, { headers });
      })
    );
  }

  deleteClub(id: string): Observable<any> {
    console.log('ApiService: deleteClub called for clubId:', id);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete(`${this.apiUrl}/api/clubs/${id}`, { headers });
      })
    );
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

  addGame(game: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/games`, game);
  }

  getGames(): Observable<any[]> {
    console.log('=== API SERVICE: getGames ===');
    console.log('URL:', `${this.apiUrl}/api/games`);
    
    return this.http.get<any[]>(`${this.apiUrl}/api/games`).pipe(
      tap(response => {
        console.log('=== API SERVICE: getGames Response ===');
        console.log('Response:', response);
        console.log('Response length:', response?.length || 0);
      }),
      catchError(error => {
        console.error('=== API SERVICE: getGames Error ===');
        console.error('Error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        throw error;
      })
    );
  }

  getGamesBySeason(seasonId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/games/season/${seasonId}`);
  }

  deleteGame(gameId: string): Observable<any> {
    console.log('ApiService: deleteGame called for gameId', gameId);
    
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        console.log('ApiService: Got access token for deleteGame, making authenticated request');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete(`${this.apiUrl}/api/games/${gameId}`, { headers });
      })
    );
  }

  bulkUpdateGames(updates: any[]): Observable<any> {
    console.log('ApiService: bulkUpdateGames called with', updates.length, 'updates');
    
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        console.log('ApiService: Got access token for bulkUpdateGames, making authenticated request');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/games/bulk-update`, updates, { headers });
      })
    );
  }

  mergeGames(primaryGameId: string, secondaryGameId: string): Observable<any> {
    console.log('ApiService: mergeGames called');
    
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        console.log('ApiService: Got access token for mergeGames, making authenticated request');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/games/merge`, {
          primaryGameId,
          secondaryGameId
        }, { headers });
      })
    );
  }

  getGame(gameId: string): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/api/games/${gameId}`);
  }

  getTeamPlayers(teamId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/teams/${teamId}/players`);
  }

  saveGameStats(stats: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/games/stats`, stats);
  }

  saveManualGameStats(gameStats: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/games/manual-stats`, gameStats);
  }

  // Club roster methods
  getClubRoster(clubId: string, seasonId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/roster?seasonId=${seasonId}`).pipe(
      catchError(error => {
        console.error('Error loading club roster:', error);
        throw error;
      })
    );
  }

  // Get global club roster (all players signed to the club across all seasons)
  getClubGlobalRoster(clubId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/roster/global`);
  }

  // Add player to club roster
  addPlayerToClub(clubId: string, playerId: string, seasonId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/clubs/${clubId}/roster/player`, { playerId, seasonId });
  }

  // Remove player from club roster
  removePlayerFromClub(clubId: string, playerId: string, seasonId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/clubs/${clubId}/roster/player/${playerId}?seasonId=${seasonId}`);
  }


  // Get free agents for a specific season
  getFreeAgentsForSeason(seasonId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/users/free-agents?seasonId=${seasonId}`);
  }

  // Offer methods
  sendContractOffer(offerData: { 
    clubId: string; 
    clubName: string;
    clubLogoUrl?: string;
    userId: string; 
    playerName: string;
    seasonId?: string;
    seasonName?: string;
    sentBy: string; 
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/offers`, offerData);
  }

  getInboxOffers(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/offers/inbox/${userId}`);
  }

  respondToOffer(offerId: string, status: 'accepted' | 'rejected'): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/offers/${offerId}/respond`, { status });
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/users`);
  }

  // Regions
  getRegions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/regions`);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/users/profile/${id}`);
  }

  auth0Sync(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/users/auth0-sync`, {});
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/users/me`);
  }

  updateCurrentUser(userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/users/${userData._id}`, userData);
  }

  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/api/users/${user._id}`, user);
  }

  getClubEashlGames(clubId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/eashl-games`);
  }

  getGameEashlData(gameId: string): Observable<any> {
    console.log('ApiService: getGameEashlData called for gameId', gameId);
    
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        console.log('ApiService: Got access token for getGameEashlData, making authenticated request');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<any>(`${this.apiUrl}/api/games/${gameId}/eashl-data`, { headers });
      })
    );
  }

  unlinkGameStats(gameId: string): Observable<any> {
    console.log('ApiService: unlinkGameStats called for gameId', gameId);
    
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        console.log('ApiService: Got access token for unlinkGameStats, making authenticated request');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete<any>(`${this.apiUrl}/api/games/${gameId}/eashl-data`, { headers });
      })
    );
  }

  getClub(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/clubs/${id}`);
  }

  // Admin management methods
  getMyAdminRecord(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/admins/me`);
  }

  listAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/admins`);
  }

  addAdmin(payload: { username: string; note?: string; superAdmin?: boolean }): Observable<any> {
    console.log('ApiService: addAdmin called');
    
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        console.log('ApiService: Got access token for addAdmin, making authenticated request');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/admins`, payload, { headers });
      })
    );
  }

  removeAdmin(auth0Id: string): Observable<any> {
    console.log('ApiService: removeAdmin called for auth0Id', auth0Id);
    
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        console.log('ApiService: Got access token for removeAdmin, making authenticated request');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete(`${this.apiUrl}/api/admins/${encodeURIComponent(auth0Id)}`, { headers });
      })
    );
  }

  setSuperAdmin(auth0Id: string, superAdmin: boolean): Observable<any> {
    console.log('ApiService: setSuperAdmin called for auth0Id', auth0Id);
    
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        console.log('ApiService: Got access token for setSuperAdmin, making authenticated request');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.patch(`${this.apiUrl}/api/admins/${encodeURIComponent(auth0Id)}/super`, { superAdmin }, { headers });
      })
    );
  }

  // Create User
  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/users`, userData);
  }

  // Create Player (for admin system)
  createPlayer(playerData: any): Observable<any> {
    console.log('ApiService: createPlayer called with data', playerData);
    console.log('ApiService: making POST request to', `${this.apiUrl}/api/players`);
    
    // Get the access token and add it to the request
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        console.log('ApiService: Got access token, making authenticated request');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/players`, playerData, { headers });
      })
    );
  }

  // Get all players (for admin management)
  getAllPlayers(): Observable<any> {
    console.log('ApiService: getAllPlayers called');
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get(`${this.apiUrl}/api/players`, { headers });
      })
    );
  }

  // Get free agents (for admin management)
  getFreeAgents(): Observable<any> {
    console.log('ApiService: getFreeAgents called');
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get(`${this.apiUrl}/api/players/free-agents`, { headers });
      })
    );
  }

  // Delete player (for admin management)
  deletePlayer(playerId: string): Observable<any> {
    console.log('ApiService: deletePlayer called for playerId:', playerId);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete(`${this.apiUrl}/api/players/${playerId}`, { headers });
      })
    );
  }

  // Add current user as admin (for testing)
  addMeAsAdmin(): Observable<any> {
    console.log('ApiService: addMeAsAdmin called');
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/admins/add-me`, {}, { headers });
      })
    );
  }
}