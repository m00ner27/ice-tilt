import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { Game } from '../models/models/match.interface';
import { User } from '../users.actions';
import { AuthService } from '@auth0/auth0-angular';
import { CacheService } from '../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl; // Uses environment variable

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cacheService: CacheService
  ) { 
    // Add request interceptor to track all HTTP requests
  }

  // Add method to test the specific endpoint directly
  testPetosenPalloRoster(): Observable<any> {
    const clubId = '68768d41ab18f6cd40f8d8c5';
    const seasonId = '687649d7ab18f6cd40f8d83d';
    const url = `${this.apiUrl}/api/clubs/${clubId}/roster?seasonId=${seasonId}`;
    
    return this.http.get(url).pipe(
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
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/game-data`, data, { headers });
      })
    );
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
    const cacheKey = 'seasons';
    const observable = this.http.get<any[]>(`${this.apiUrl}/api/seasons`).pipe(
      catchError(error => {
        console.error('=== API SERVICE: getSeasons Error ===');
        console.error('Error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        throw error;
      })
    );
    
    return this.cacheService.getOrFetch(cacheKey, observable, 10 * 60 * 1000); // Cache for 10 minutes
  }

  addSeason(seasonData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/seasons`, seasonData);
  }

  deleteSeason(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/seasons/${id}`);
  }

  updateSeason(season: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put(`${this.apiUrl}/api/seasons/${season._id}`, season, { headers });
      })
    );
  }

  // Division data methods
  getDivisions(): Observable<any[]> {
    const cacheKey = 'divisions';
    const observable = this.http.get<any[]>(`${this.apiUrl}/api/divisions`);
    return this.cacheService.getOrFetch(cacheKey, observable, 10 * 60 * 1000); // Cache for 10 minutes
  }

  getDivisionsBySeason(seasonId: string): Observable<any[]> {
    const cacheKey = `divisions-season-${seasonId}`;
    const observable = this.http.get<any[]>(`${this.apiUrl}/api/divisions/season/${seasonId}`).pipe(
      catchError(error => {
        console.error('=== API SERVICE: getDivisionsBySeason Error ===');
        console.error('Error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        throw error;
      })
    );
    return this.cacheService.getOrFetch(cacheKey, observable, 10 * 60 * 1000); // Cache for 10 minutes
  }

  addDivision(divisionData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/divisions`, divisionData);
  }

  deleteDivision(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/divisions/${id}`);
  }

  updateDivision(division: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put(`${this.apiUrl}/api/divisions/${division._id}`, division, { headers });
      })
    );
  }

  // Club data methods
  getClubs(): Observable<any[]> {
    const cacheKey = 'clubs';
    const observable = this.http.get<any[]>(`${this.apiUrl}/api/clubs`);
    return this.cacheService.getOrFetch(cacheKey, observable, 10 * 60 * 1000); // Cache for 10 minutes
  }

  getClubById(clubId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/clubs/${clubId}`).pipe(
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
    const cacheKey = `clubs-season-${seasonId}`;
    const observable = this.http.get<any[]>(`${this.apiUrl}/api/clubs/season/${seasonId}`).pipe(
      catchError(error => {
        console.error('=== API SERVICE: getClubsBySeason Error ===');
        console.error('Error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        throw error;
      })
    );
    return this.cacheService.getOrFetch(cacheKey, observable, 10 * 60 * 1000); // Cache for 10 minutes
  }

  // File upload method
  uploadFile(file: File): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const formData = new FormData();
        formData.append('file', file);
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.post<any>(`${this.apiUrl}/api/upload`, formData, { headers });
      })
    );
  }

  addGame(game: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/games`, game, { headers });
      })
    );
  }

  getGames(): Observable<any[]> {
    const cacheKey = 'games';
    const observable = this.http.get<any[]>(`${this.apiUrl}/api/games`).pipe(
      catchError(error => {
        console.error('=== API SERVICE: getGames Error ===');
        console.error('Error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        throw error;
      })
    );
    
    return this.cacheService.getOrFetch(cacheKey, observable, 5 * 60 * 1000); // Cache for 5 minutes (games change more frequently)
  }

  // Cache invalidation methods
  invalidateGamesCache(): void {
    this.cacheService.invalidate('games');
  }

  invalidateClubsCache(): void {
    this.cacheService.invalidate('clubs');
  }

  invalidateSeasonsCache(): void {
    this.cacheService.invalidate('seasons');
  }

  invalidateDivisionsCache(): void {
    this.cacheService.invalidate('divisions');
  }

  // Invalidate all caches (useful for admin operations)
  invalidateAllCaches(): void {
    this.cacheService.clear();
  }

  // Get cache statistics for debugging
  getCacheStats(): any {
    return this.cacheService.getStats();
  }

  getGamesBySeason(seasonId: string): Observable<any[]> {
    const cacheKey = `games-season-${seasonId}`;
    const observable = this.http.get<any[]>(`${this.apiUrl}/api/games/season/${seasonId}`).pipe(
      catchError(error => {
        console.error('=== API SERVICE: getGamesBySeason Error ===');
        console.error('Error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        throw error;
      })
    );
    return this.cacheService.getOrFetch(cacheKey, observable, 5 * 60 * 1000); // Cache for 5 minutes
  }

  deleteGame(gameId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete(`${this.apiUrl}/api/games/${gameId}`, { headers });
      })
    );
  }

  bulkUpdateGames(updates: any[]): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/games/bulk-update`, updates, { headers });
      })
    );
  }

  mergeGames(primaryGameId: string, gameIds: string[]): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/games/merge`, {
          primaryGameId,
          gameIds
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
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/games/manual-stats`, gameStats, { headers });
      })
    );
  }

  // Club roster methods
  getClubRoster(clubId: string, seasonId: string): Observable<any[]> {
    console.log('ApiService: getClubRoster called for clubId:', clubId, 'seasonId:', seasonId);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/roster?seasonId=${seasonId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error loading club roster:', error);
        throw error;
      })
    );
  }

  // Get global club roster (all players signed to the club across all seasons)
  getClubGlobalRoster(clubId: string): Observable<any[]> {
    console.log('ApiService: getClubGlobalRoster called for clubId:', clubId);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/roster/global`, { headers });
      })
    );
  }

  // Add player to club roster
  addPlayerToClub(clubId: string, playerId: string, seasonId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/clubs/${clubId}/roster/player`, { playerId, seasonId }, { headers });
      })
    );
  }

  // Remove player from club roster
  removePlayerFromClub(clubId: string, playerId: string, seasonId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.delete<any>(`${this.apiUrl}/api/clubs/${clubId}/roster/player/${playerId}?seasonId=${seasonId}`, { headers });
      })
    );
  }


  // Get free agents for a specific season
  getFreeAgentsForSeason(seasonId: string): Observable<any[]> {
    console.log('ApiService: getFreeAgentsForSeason called for season:', seasonId);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<any[]>(`${this.apiUrl}/api/users/free-agents?seasonId=${seasonId}`, { headers });
      })
    );
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
    console.log('ApiService: sendContractOffer called');
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/offers`, offerData, { headers });
      })
    );
  }

  getInboxOffers(userId: string): Observable<any[]> {
    console.log('ApiService: getInboxOffers called for userId:', userId);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<any[]>(`${this.apiUrl}/api/offers/inbox/${userId}`, { headers });
      })
    );
  }

  respondToOffer(offerId: string, status: 'accepted' | 'rejected'): Observable<any> {
    console.log('ApiService: respondToOffer called for offerId:', offerId, 'status:', status);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<any>(`${this.apiUrl}/api/offers/${offerId}/respond`, { status }, { headers });
      })
    );
  }

  getUsers(): Observable<any[]> {
    console.log('ApiService: getUsers called');
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<any[]>(`${this.apiUrl}/api/users`, { headers });
      })
    );
  }

  // Regions
  getRegions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/regions`);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/users/profile/${id}`);
  }

  auth0Sync(): Observable<any> {
    console.log('ApiService: auth0Sync called');
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/users/auth0-sync`, {}, { headers });
      })
    );
  }

  getCurrentUser(): Observable<any> {
    console.log('ApiService: getCurrentUser called');
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get(`${this.apiUrl}/api/users/me`, { headers });
      })
    );
  }

  updateCurrentUser(userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/users/${userData._id}`, userData);
  }

  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/api/users/${user._id}`, user);
  }

  getClubEashlGames(clubId: string): Observable<any[]> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/eashl-games`, { headers });
      })
    );
  }

  getGameEashlData(gameId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<any>(`${this.apiUrl}/api/games/${gameId}/eashl-data`, { headers });
      })
    );
  }

  unlinkGameStats(gameId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
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
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/admins`, payload, { headers });
      })
    );
  }

  removeAdmin(auth0Id: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete(`${this.apiUrl}/api/admins/${encodeURIComponent(auth0Id)}`, { headers });
      })
    );
  }

  setSuperAdmin(auth0Id: string, superAdmin: boolean): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
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