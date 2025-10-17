import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AppState } from '../index';

// Import all actions
import * as ClubsActions from '../clubs.actions';
import * as MatchesActions from '../matches.actions';
import * as SeasonsActions from '../seasons.actions';
import * as UsersActions from '../users.actions';
import * as PlayersActions from '../players.actions';
import * as DivisionsActions from '../divisions.actions';

/**
 * NgRx API Service
 * 
 * This service provides a higher-level API that automatically dispatches
 * NgRx actions for all API calls. It wraps the existing ApiService and
 * provides a clean interface for components to interact with the store.
 */
@Injectable({
  providedIn: 'root'
})
export class NgRxApiService {

  constructor(private store: Store<AppState>) {}

  // ===== CLUBS =====
  
  loadClubs(): void {
    this.store.dispatch(ClubsActions.loadClubs());
  }

  loadClub(clubId: string): void {
    this.store.dispatch(ClubsActions.loadClub({ clubId }));
  }

  loadClubsBySeason(seasonId: string): void {
    this.store.dispatch(ClubsActions.loadClubsBySeason({ seasonId }));
  }

  createClub(clubData: any): void {
    this.store.dispatch(ClubsActions.createClub({ clubData }));
  }

  updateClub(club: any): void {
    this.store.dispatch(ClubsActions.updateClub({ club }));
  }

  deleteClub(clubId: string): void {
    this.store.dispatch(ClubsActions.deleteClub({ clubId }));
  }

  loadClubRoster(clubId: string, seasonId: string): void {
    this.store.dispatch(ClubsActions.loadClubRoster({ clubId, seasonId }));
  }

  loadClubGlobalRoster(clubId: string): void {
    this.store.dispatch(ClubsActions.loadClubGlobalRoster({ clubId }));
  }

  addPlayerToClub(clubId: string, userId: string, seasonId: string): void {
    this.store.dispatch(ClubsActions.addPlayerToClub({ clubId, userId, seasonId }));
  }

  removePlayerFromClub(clubId: string, userId: string, seasonId: string): void {
    this.store.dispatch(ClubsActions.removePlayerFromClub({ clubId, userId, seasonId }));
  }

  uploadClubLogo(file: File): void {
    this.store.dispatch(ClubsActions.uploadClubLogo({ file }));
  }

  clearClubs(): void {
    this.store.dispatch(ClubsActions.clearClubs());
  }

  clearSelectedClub(): void {
    this.store.dispatch(ClubsActions.clearSelectedClub());
  }

  // ===== MATCHES =====

  loadMatches(): void {
    this.store.dispatch(MatchesActions.loadMatches());
  }

  loadMatch(matchId: string): void {
    this.store.dispatch(MatchesActions.loadMatch({ matchId }));
  }

  loadMatchesBySeason(seasonId: string): void {
    this.store.dispatch(MatchesActions.loadMatchesBySeason({ seasonId }));
  }

  createMatch(matchData: any): void {
    this.store.dispatch(MatchesActions.createMatch({ matchData }));
  }

  updateMatch(match: any): void {
    this.store.dispatch(MatchesActions.updateMatch({ match }));
  }

  deleteMatch(matchId: string): void {
    this.store.dispatch(MatchesActions.deleteMatch({ matchId }));
  }

  bulkUpdateMatches(updates: any[]): void {
    this.store.dispatch(MatchesActions.bulkUpdateMatches({ updates }));
  }

  mergeMatches(primaryMatchId: string, secondaryMatchId: string): void {
    this.store.dispatch(MatchesActions.mergeMatches({ primaryMatchId, secondaryMatchId }));
  }

  saveGameStats(stats: any): void {
    this.store.dispatch(MatchesActions.saveGameStats({ stats }));
  }

  saveManualGameStats(gameStats: any): void {
    this.store.dispatch(MatchesActions.saveManualGameStats({ gameStats }));
  }

  loadMatchEashlData(matchId: string): void {
    this.store.dispatch(MatchesActions.loadMatchEashlData({ matchId }));
  }

  unlinkGameStats(matchId: string): void {
    this.store.dispatch(MatchesActions.unlinkGameStats({ matchId }));
  }

  clearMatches(): void {
    this.store.dispatch(MatchesActions.clearMatches());
  }

  clearSelectedMatch(): void {
    this.store.dispatch(MatchesActions.clearSelectedMatch());
  }

  // ===== SEASONS =====

  loadSeasons(): void {
    this.store.dispatch(SeasonsActions.loadSeasons());
  }

  createSeason(seasonData: any): void {
    this.store.dispatch(SeasonsActions.createSeason({ seasonData }));
  }

  updateSeason(season: any): void {
    this.store.dispatch(SeasonsActions.updateSeason({ season }));
  }

  deleteSeason(seasonId: string): void {
    this.store.dispatch(SeasonsActions.deleteSeason({ seasonId }));
  }

  setActiveSeason(seasonId: string): void {
    this.store.dispatch(SeasonsActions.setActiveSeason({ seasonId }));
  }

  clearSeasons(): void {
    this.store.dispatch(SeasonsActions.clearSeasons());
  }

  // ===== USERS =====

  loadUsers(): void {
    this.store.dispatch(UsersActions.loadUsers());
  }

  loadUser(userId: string): void {
    this.store.dispatch(UsersActions.loadUser({ userId }));
  }

  auth0Sync(): void {
    this.store.dispatch(UsersActions.auth0Sync());
  }

  loadCurrentUser(): void {
    this.store.dispatch(UsersActions.loadCurrentUser());
  }

  loadFreeAgents(): void {
    this.store.dispatch(UsersActions.loadFreeAgents());
  }

  loadFreeAgentsBySeason(seasonId: string): void {
    this.store.dispatch(UsersActions.loadFreeAgentsBySeason({ seasonId }));
  }

  createUser(userData: any): void {
    this.store.dispatch(UsersActions.createUser({ userData }));
  }

  updateUser(user: any): void {
    this.store.dispatch(UsersActions.updateUser({ user }));
  }

  updateCurrentUser(userData: any): void {
    this.store.dispatch(UsersActions.updateCurrentUser({ userData }));
  }

  deleteUser(userId: string): void {
    this.store.dispatch(UsersActions.deleteUser({ userId }));
  }

  sendContractOffer(offerData: {
    clubId: string;
    clubName: string;
    clubLogoUrl?: string;
    userId: string;
    playerName: string;
    seasonId?: string;
    seasonName?: string;
    sentBy: string;
  }): void {
    this.store.dispatch(UsersActions.sendContractOffer(offerData));
  }

  loadInboxOffers(userId: string): void {
    this.store.dispatch(UsersActions.loadInboxOffers({ userId }));
  }

  respondToOffer(offerId: string, status: 'accepted' | 'rejected'): void {
    this.store.dispatch(UsersActions.respondToOffer({ offerId, status }));
  }

  clearUsers(): void {
    this.store.dispatch(UsersActions.clearUsers());
  }

  clearSelectedUser(): void {
    this.store.dispatch(UsersActions.clearSelectedUser());
  }

  clearFreeAgents(): void {
    this.store.dispatch(UsersActions.clearFreeAgents());
  }

  // ===== PLAYERS =====

  loadPlayers(): void {
    this.store.dispatch(PlayersActions.loadPlayers());
  }

  loginWithDiscordProfile(discordProfile: any): void {
    this.store.dispatch(PlayersActions.loginWithDiscordProfile({ discordProfile }));
  }

  loadPlayerProfile(name: string, discordProfile: any): void {
    this.store.dispatch(PlayersActions.loadPlayerProfile({ name, discordProfile }));
  }

  loadPlayerStats(userId: string, gamertag: string): void {
    this.store.dispatch(PlayersActions.loadPlayerStats({ userId, gamertag }));
  }

  upsertPlayerProfile(profile: any): void {
    this.store.dispatch(PlayersActions.upsertPlayerProfile({ profile }));
  }

  // ===== DIVISIONS =====

  loadDivisions(): void {
    this.store.dispatch(DivisionsActions.loadDivisions());
  }

  loadDivisionsBySeason(seasonId: string): void {
    this.store.dispatch(DivisionsActions.loadDivisionsBySeason({ seasonId }));
  }

  createDivision(divisionData: any): void {
    this.store.dispatch(DivisionsActions.createDivision({ divisionData }));
  }

  updateDivision(division: any): void {
    this.store.dispatch(DivisionsActions.updateDivision({ division }));
  }

  deleteDivision(divisionId: string): void {
    this.store.dispatch(DivisionsActions.deleteDivision({ divisionId }));
  }

  clearDivisions(): void {
    this.store.dispatch(DivisionsActions.clearDivisions());
  }
}
