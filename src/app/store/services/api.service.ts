import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { Game } from '../models/models/match.interface';
import { User } from '../users.actions';
import { AuthService } from '@auth0/auth0-angular';
import { CacheService } from '../../shared/services/cache.service';
import { LoggerService } from '../../shared/services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl; // Uses environment variable

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cacheService: CacheService,
    private logger: LoggerService
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
        this.logger.error('=== TEST ERROR RECEIVED ===', error);
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
        this.logger.error('=== API SERVICE: getSeasons Error ===', error, error.status, error.message);
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
        this.logger.error('=== API SERVICE: getDivisionsBySeason Error ===', error, error.status, error.message);
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
        this.logger.error('=== API SERVICE: getClubById Error ===', error, error.status, error.message);
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
        this.logger.error('=== API SERVICE: getClubsBySeason Error ===', error, error.status, error.message);
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

  addGamesBulk(games: any[]): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/games/bulk`, games, { headers });
      })
    );
  }

  getGames(): Observable<any[]> {
    const cacheKey = 'games';
    const observable = this.http.get<any[]>(`${this.apiUrl}/api/games`).pipe(
      catchError(error => {
        this.logger.error('=== API SERVICE: getGames Error ===', error, error.status, error.message);
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
    // Invalidate both the general clubs cache and any season-specific caches
    this.cacheService.invalidate('clubs');
    // Also invalidate any clubs-season-* patterns
    this.cacheService.invalidatePattern('^clubs');
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
        this.logger.error('=== API SERVICE: getGamesBySeason Error ===', error, error.status, error.message);
        throw error;
      })
    );
    return this.cacheService.getOrFetch(cacheKey, observable, 5 * 60 * 1000); // Cache for 5 minutes
  }

  getStandings(seasonId: string, divisionId?: string): Observable<any[]> {
    const cacheKey = divisionId 
      ? `standings-${seasonId}-${divisionId}` 
      : `standings-${seasonId}`;
    let url = `${this.apiUrl}/api/standings/${seasonId}`;
    if (divisionId) {
      url += `?divisionId=${divisionId}`;
    }
    const observable = this.http.get<any[]>(url).pipe(
      catchError(error => {
        this.logger.error('=== API SERVICE: getStandings Error ===', error, error.status, error.message);
        throw error;
      })
    );
    // Cache standings for 2 minutes (they change less frequently than games)
    return this.cacheService.getOrFetch(cacheKey, observable, 2 * 60 * 1000);
  }

  getClubMatches(clubId: string, seasonId?: string, limit: number = 50, offset: number = 0, includePlayoffs: boolean = false): Observable<any> {
    const cacheKey = `club-matches-${clubId}-${seasonId || 'all'}-${limit}-${offset}`;
    let url = `${this.apiUrl}/api/clubs/${clubId}/matches?limit=${limit}&offset=${offset}&includePlayoffs=${includePlayoffs}`;
    if (seasonId) {
      url += `&seasonId=${seasonId}`;
    }
    const observable = this.http.get<any>(url).pipe(
      catchError(error => {
        this.logger.error('=== API SERVICE: getClubMatches Error ===', error, error.status, error.message);
        throw error;
      })
    );
    // Cache for 1 minute (matches change when games are updated)
    return this.cacheService.getOrFetch(cacheKey, observable, 60 * 1000);
  }

  getClubStats(clubId: string, seasonId?: string): Observable<any> {
    const cacheKey = `club-stats-${clubId}-${seasonId || 'all'}`;
    let url = `${this.apiUrl}/api/clubs/${clubId}/stats`;
    if (seasonId) {
      url += `?seasonId=${seasonId}`;
    }
    const observable = this.http.get<any>(url).pipe(
      catchError(error => {
        this.logger.error('=== API SERVICE: getClubStats Error ===', error, error.status, error.message);
        throw error;
      })
    );
    // Cache for 2 minutes (stats change when games are updated)
    return this.cacheService.getOrFetch(cacheKey, observable, 2 * 60 * 1000);
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

  fixMergedGameStats(gameId?: string, fixAll: boolean = false): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        
        let url = `${this.apiUrl}/api/games/fix-merged-stats`;
        if (fixAll) {
          url += '?all=true';
        } else if (gameId) {
          url += `/${gameId}`;
        }
        
        return this.http.post(url, {}, { headers });
      }),
      catchError(error => {
        this.logger.error('Error fixing merged game stats:', error);
        return throwError(() => error);
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

  // Recalculate stats for all games with EASHL data
  recalculateAllGameStats(): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/games/recalculate-all-stats`, {}, { headers });
      })
    );
  }

  // Recalculate series wins for all series in a playoff bracket
  recalculateAllPlayoffSeriesWins(bracketId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/playoffs/brackets/${bracketId}/recalculate-all-series`, {}, { headers });
      })
    );
  }

  // Club roster methods
  getClubRoster(clubId: string, seasonId: string): Observable<any[]> {
    this.logger.log('ApiService: getClubRoster called for clubId:', clubId, 'seasonId:', seasonId);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/roster?seasonId=${seasonId}`, { headers }).pipe(
      catchError(error => {
        this.logger.error('Error loading club roster:', error);
        throw error;
      })
    );
  }

  // Get global club roster (all players signed to the club across all seasons)
  getClubGlobalRoster(clubId: string): Observable<any[]> {
    this.logger.log('ApiService: getClubGlobalRoster called for clubId:', clubId);
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
    this.logger.log('ApiService: getFreeAgentsForSeason called for season:', seasonId);
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
    this.logger.log('ApiService: sendContractOffer called');
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
    this.logger.log('ApiService: getInboxOffers called for userId:', userId);
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
    this.logger.log('ApiService: respondToOffer called for offerId:', offerId, 'status:', status);
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
    this.logger.log('ApiService: getUsers called');
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
    this.logger.log('ApiService: auth0Sync called');
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
    this.logger.log('ApiService: getCurrentUser called');
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
    this.logger.log('ApiService: createPlayer called with data', playerData);
    this.logger.log('ApiService: making POST request to', `${this.apiUrl}/api/players`);
    
    // Get the access token and add it to the request
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        this.logger.log('ApiService: Got access token, making authenticated request');
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
    this.logger.log('ApiService: getAllPlayers called');
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
    this.logger.log('ApiService: getFreeAgents called');
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
    this.logger.log('ApiService: deletePlayer called for playerId:', playerId);
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

  // Add username to player
  addPlayerUsername(playerId: string, username: string, platform: string): Observable<any> {
    this.logger.log('ApiService: addPlayerUsername called for playerId:', playerId, 'username:', username);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/api/players/${playerId}/usernames`, { username, platform }, { headers });
      })
    );
  }

  // Remove username from player
  removePlayerUsername(playerId: string, username: string): Observable<any> {
    this.logger.log('ApiService: removePlayerUsername called for playerId:', playerId, 'username:', username);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete(`${this.apiUrl}/api/players/${playerId}/usernames?username=${encodeURIComponent(username)}`, { headers });
      })
    );
  }

  // Set primary username for player
  setPrimaryPlayerUsername(playerId: string, username: string): Observable<any> {
    this.logger.log('ApiService: setPrimaryPlayerUsername called for playerId:', playerId, 'username:', username);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put(`${this.apiUrl}/api/players/${playerId}/usernames/primary`, { username }, { headers });
      })
    );
  }

  // Restore/replace username for player
  restorePlayerUsername(playerId: string, oldUsername: string, newUsername: string, platform: string): Observable<any> {
    this.logger.log('ApiService: restorePlayerUsername called for playerId:', playerId, 'oldUsername:', oldUsername, 'newUsername:', newUsername);
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put(`${this.apiUrl}/api/players/${playerId}/usernames/restore`, { oldUsername, newUsername, platform }, { headers });
      })
    );
  }

  // Add current user as admin (for testing)
  addMeAsAdmin(): Observable<any> {
    this.logger.log('ApiService: addMeAsAdmin called');
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

  // Playoff Bracket Methods
  getPlayoffBrackets(seasonId?: string, divisionId?: string, status?: string): Observable<any[]> {
    let url = `${this.apiUrl}/api/playoffs/brackets?`;
    const params: string[] = [];
    if (seasonId) params.push(`seasonId=${seasonId}`);
    if (divisionId) params.push(`divisionId=${divisionId}`);
    if (status) params.push(`status=${status}`);
    url += params.join('&');
    return this.http.get<any[]>(url);
  }

  getPlayoffBracket(bracketId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/playoffs/brackets/${bracketId}`);
  }

  createPlayoffBracket(bracketData: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/playoffs/brackets`, bracketData, { headers });
      })
    );
  }

  updatePlayoffBracket(bracketId: string, bracketData: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<any>(`${this.apiUrl}/api/playoffs/brackets/${bracketId}`, bracketData, { headers });
      })
    );
  }

  generatePlayoffMatchups(bracketId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/playoffs/brackets/${bracketId}/generate-matchups`, {}, { headers });
      })
    );
  }

  getPlayoffBracketSeries(bracketId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/playoffs/brackets/${bracketId}/series`);
  }

  getPlayoffSeries(seriesId: string, bracketId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/playoffs/series/${seriesId}?bracketId=${bracketId}`);
  }

  advancePlayoffSeries(seriesId: string, bracketId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<any>(`${this.apiUrl}/api/playoffs/series/${seriesId}/advance?bracketId=${bracketId}`, {}, { headers });
      })
    );
  }

  getPlayoffPlayerStats(bracketId?: string, seasonId?: string, clubId?: string): Observable<any> {
    let url = `${this.apiUrl}/api/playoffs/stats/players`;
    const params: string[] = [];
    if (bracketId) params.push(`bracketId=${bracketId}`);
    if (seasonId) params.push(`seasonId=${seasonId}`);
    if (clubId) params.push(`clubId=${clubId}`);
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    return this.http.get<any>(url);
  }

  getPlayoffGoalieStats(bracketId?: string, seasonId?: string, clubId?: string): Observable<any> {
    let url = `${this.apiUrl}/api/playoffs/stats/goalies`;
    const params: string[] = [];
    if (bracketId) params.push(`bracketId=${bracketId}`);
    if (seasonId) params.push(`seasonId=${seasonId}`);
    if (clubId) params.push(`clubId=${clubId}`);
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    return this.http.get<any>(url);
  }

  deletePlayoffBracket(bracketId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete<any>(`${this.apiUrl}/api/playoffs/brackets/${bracketId}`, { headers });
      })
    );
  }

  updateRoundMatchups(bracketId: string, roundOrder: number, matchups: any[]): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<any>(
          `${this.apiUrl}/api/playoffs/brackets/${bracketId}/rounds/${roundOrder}/matchups`,
          { matchups },
          { headers }
        );
      })
    );
  }

  // Tournament Methods
  getTournaments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/tournaments`);
  }

  getTournamentById(tournamentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/tournaments/${tournamentId}`);
  }

  createTournament(tournamentData: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/tournaments`, tournamentData, { headers });
      })
    );
  }

  updateTournament(tournamentId: string, tournamentData: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<any>(`${this.apiUrl}/api/tournaments/${tournamentId}`, tournamentData, { headers });
      })
    );
  }

  deleteTournament(tournamentId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete<any>(`${this.apiUrl}/api/tournaments/${tournamentId}`, { headers });
      })
    );
  }

  // Tournament Bracket Methods
  getTournamentBrackets(tournamentId?: string, status?: string): Observable<any[]> {
    let url = `${this.apiUrl}/api/tournaments/brackets?`;
    const params: string[] = [];
    if (tournamentId) params.push(`tournamentId=${tournamentId}`);
    if (status) params.push(`status=${status}`);
    url += params.join('&');
    return this.http.get<any[]>(url);
  }

  getTournamentBracketById(bracketId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/tournaments/brackets/${bracketId}`);
  }

  createTournamentBracket(bracketData: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/tournaments/brackets`, bracketData, { headers });
      })
    );
  }

  updateTournamentBracket(bracketId: string, bracketData: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<any>(`${this.apiUrl}/api/tournaments/brackets/${bracketId}`, bracketData, { headers });
      })
    );
  }

  deleteTournamentBracket(bracketId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete<any>(`${this.apiUrl}/api/tournaments/brackets/${bracketId}`, { headers });
      })
    );
  }

  generateTournamentMatchups(bracketId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/tournaments/brackets/${bracketId}/generate-matchups`, {}, { headers });
      })
    );
  }

  getTournamentBracketSeries(bracketId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/tournaments/brackets/${bracketId}/series`);
  }

  getTournamentSeries(seriesId: string, bracketId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/tournaments/series/${seriesId}?bracketId=${bracketId}`);
  }

  advanceTournamentSeries(seriesId: string, bracketId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<any>(`${this.apiUrl}/api/tournaments/series/${seriesId}/advance?bracketId=${bracketId}`, {}, { headers });
      })
    );
  }

  getTournamentPlayerStats(bracketId?: string, tournamentId?: string, clubId?: string): Observable<any> {
    let url = `${this.apiUrl}/api/tournaments/stats/players`;
    const params: string[] = [];
    if (bracketId) params.push(`bracketId=${bracketId}`);
    if (tournamentId) params.push(`tournamentId=${tournamentId}`);
    if (clubId) params.push(`clubId=${clubId}`);
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    return this.http.get<any>(url);
  }

  getTournamentGoalieStats(bracketId?: string, tournamentId?: string, clubId?: string): Observable<any> {
    let url = `${this.apiUrl}/api/tournaments/stats/goalies`;
    const params: string[] = [];
    if (bracketId) params.push(`bracketId=${bracketId}`);
    if (tournamentId) params.push(`tournamentId=${tournamentId}`);
    if (clubId) params.push(`clubId=${clubId}`);
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    return this.http.get<any>(url);
  }

  // Tournament Club Assignment Methods
  getClubsByTournament(tournamentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/tournament/${tournamentId}`);
  }

  assignClubToTournament(clubId: string, tournamentId: string, rosterData?: any[]): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(
          `${this.apiUrl}/api/clubs/${clubId}/assign-tournament`,
          { tournamentId, roster: rosterData },
          { headers }
        );
      })
    );
  }

  removeClubFromTournament(clubId: string, tournamentId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete<any>(
          `${this.apiUrl}/api/clubs/${clubId}/remove-tournament/${tournamentId}`,
          { headers }
        );
      })
    );
  }

  removeClubFromSeason(clubId: string, seasonId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete<any>(
          `${this.apiUrl}/api/clubs/${clubId}/remove-season/${seasonId}`,
          { headers }
        );
      })
    );
  }

  getClubTournamentRoster(clubId: string, tournamentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/roster/tournament?tournamentId=${tournamentId}`);
  }

  addPlayerToTournamentRoster(clubId: string, playerId: string, tournamentId: string, addedBy?: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(
          `${this.apiUrl}/api/clubs/${clubId}/roster/tournament/player`,
          { playerId, tournamentId, addedBy },
          { headers }
        );
      })
    );
  }

  removePlayerFromTournamentRoster(clubId: string, playerId: string, tournamentId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete<any>(
          `${this.apiUrl}/api/clubs/${clubId}/roster/tournament/player/${playerId}?tournamentId=${tournamentId}`,
          { headers }
        );
      })
    );
  }

  cloneRosterToTournament(clubId: string, tournamentId: string, sourceId: string, sourceType: 'season' | 'tournament'): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        // Use the new route that supports both season and tournament sources
        const body: any = { tournamentId };
        if (sourceType === 'season') {
          body.sourceSeasonId = sourceId;
        } else if (sourceType === 'tournament') {
          body.sourceTournamentId = sourceId;
        }
        return this.http.post<any>(
          `${this.apiUrl}/api/clubs/${clubId}/roster/tournament/clone`,
          body,
          { headers }
        );
      })
    );
  }

  // Legacy method for backward compatibility
  cloneRosterFromSeasonToTournament(clubId: string, sourceSeasonId: string, tournamentId: string): Observable<any> {
    return this.cloneRosterToTournament(clubId, tournamentId, sourceSeasonId, 'season');
  }

  // Article Methods
  getArticles(published?: boolean): Observable<any[]> {
    let url = `${this.apiUrl}/api/articles`;
    if (published !== undefined) {
      url += `?published=${published}`;
    }
    return this.http.get<any[]>(url);
  }

  getArticleBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/articles/${slug}`);
  }

  createArticle(article: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/articles`, article, { headers });
      })
    );
  }

  updateArticle(id: string, article: any): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<any>(`${this.apiUrl}/api/articles/${id}`, article, { headers });
      })
    );
  }

  deleteArticle(id: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete<any>(`${this.apiUrl}/api/articles/${id}`, { headers });
      })
    );
  }

  getAllArticlesForAdmin(): Observable<any[]> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<any[]>(`${this.apiUrl}/api/articles/admin/all`, { headers });
      })
    );
  }

  // ===== RANKINGS =====

  // Public methods
  getRankings(region?: string): Observable<any> {
    const url = region 
      ? `${this.apiUrl}/api/rankings?region=${region}`
      : `${this.apiUrl}/api/rankings`;
    return this.http.get<any>(url);
  }

  getRankingPointsByClub(clubId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/rankings/points/club/${clubId}`);
  }

  getRankingConfig(region?: string): Observable<any> {
    const url = region
      ? `${this.apiUrl}/api/rankings/config?region=${region}`
      : `${this.apiUrl}/api/rankings/config`;
    return this.http.get<any>(url);
  }

  // Admin methods
  getRankingPointsBySeason(seasonId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<any>(`${this.apiUrl}/api/rankings/points/season/${seasonId}`, { headers });
      })
    );
  }

  getClubsBySeasonForRankings(seasonId: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<any>(`${this.apiUrl}/api/rankings/clubs/season/${seasonId}`, { headers });
      })
    );
  }

  createOrUpdateRankingPoints(data: { clubId: string; seasonId: string; placementRP: number; playoffRP: number }): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<any>(`${this.apiUrl}/api/rankings/points`, data, { headers });
      })
    );
  }

  updateRankingPoints(id: string, data: { placementRP?: number; playoffRP?: number }): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<any>(`${this.apiUrl}/api/rankings/points/${id}`, data, { headers });
      })
    );
  }

  deleteRankingPoints(id: string): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.delete<any>(`${this.apiUrl}/api/rankings/points/${id}`, { headers });
      })
    );
  }

  updateRankingConfig(region: string, activeSeasonIds: string[]): Observable<any> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<any>(`${this.apiUrl}/api/rankings/config`, { region, activeSeasonIds }, { headers });
      })
    );
  }
}