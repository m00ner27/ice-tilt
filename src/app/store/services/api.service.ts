import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl; // Uses environment variable

  constructor(private http: HttpClient) { 
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
    return this.http.get<any[]>(`${this.apiUrl}/api/seasons`);
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
    return this.http.get<any>(`${this.apiUrl}/api/clubs/${clubId}`);
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

  addGame(game: any) {
    return this.http.post(`${this.apiUrl}/api/games`, game);
  }

  getGames(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/games`);
  }

  getGamesBySeason(seasonId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/games/season/${seasonId}`);
  }

  deleteGame(gameId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/games/${gameId}`);
  }

  bulkUpdateGames(updates: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/games/bulk-update`, updates);
  }

  mergeGames(primaryGameId: string, secondaryGameId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/games/merge`, {
      primaryGameId,
      secondaryGameId
    });
  }

  getGame(gameId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/games/${gameId}`);
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
    console.log('=== API SERVICE: getClubRoster ===');
    console.log('clubId:', clubId);
    console.log('seasonId:', seasonId);
    console.log('URL:', `${this.apiUrl}/api/clubs/${clubId}/roster?seasonId=${seasonId}`);
    
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/roster?seasonId=${seasonId}`).pipe(
      tap(response => {
        console.log('=== API SERVICE: Response received ===');
        console.log('Response:', response);
        console.log('Response type:', typeof response);
        console.log('Response length:', response?.length || 0);
      }),
      catchError(error => {
        console.error('=== API SERVICE: Error in getClubRoster ===');
        console.error('Error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        throw error;
      })
    );
  }

  // Get global club roster (all players signed to the club across all seasons)
  getClubGlobalRoster(clubId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/roster/global`);
  }

  // Add player to club roster
  addPlayerToClub(clubId: string, userId: string, seasonId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/clubs/${clubId}/roster`, { userId, seasonId });
  }

  // Remove player from club roster
  removePlayerFromClub(clubId: string, userId: string, seasonId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/clubs/${clubId}/roster/${userId}?seasonId=${seasonId}`);
  }

  // Get free agents (users not in any club)
  getFreeAgents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/users/free-agents`);
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

  getUser(id: string) {
    return this.http.get(`${this.apiUrl}/api/users/profile/${id}`);
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

  getClubEashlGames(clubId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clubs/${clubId}/eashl-games`);
  }

  getGameEashlData(gameId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/games/${gameId}/eashl-data`);
  }

  unlinkGameStats(gameId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/games/${gameId}/eashl-data`);
  }

  getClub(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/clubs/${id}`);
  }
}