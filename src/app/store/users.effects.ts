import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import * as UsersActions from './users.actions';
import * as PlayersActions from './players.actions';

@Injectable()
export class UsersEffects {
  loadUsers$: any;
  loadUser$: any;
  auth0Sync$: any;
  loadCurrentUser$: any;
  loadFreeAgents$: any;
  loadFreeAgentsBySeason$: any;
  sendContractOffer$: any;
  loadInboxOffers$: any;
  respondToOffer$: any;
  updateUser$: any;
  updateCurrentUser$: any;

  constructor(
    private actions$: Actions,
    private apiService: ApiService
  ) {
    // Load Users Effect
    this.loadUsers$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.loadUsers),
        mergeMap(() =>
          this.apiService.getUsers().pipe(
            map(users => UsersActions.loadUsersSuccess({ users })),
            catchError(error => of(UsersActions.loadUsersFailure({ error })))
          )
        )
      )
    );

    // Load Single User Effect
    this.loadUser$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.loadUser),
        mergeMap(({ userId }) =>
          this.apiService.getUser(userId).pipe(
            map(user => UsersActions.loadUserSuccess({ user })),
            catchError(error => of(UsersActions.loadUserFailure({ error })))
          )
        )
      )
    );

    // Auth0 Sync Effect
    this.auth0Sync$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.auth0Sync),
        mergeMap(() =>
          this.apiService.auth0Sync().pipe(
            map(user => UsersActions.auth0SyncSuccess({ user })),
            catchError(error => of(UsersActions.auth0SyncFailure({ error })))
          )
        )
      )
    );

    // Note: Removed automatic player profile loading from auth0SyncSuccess
    // Player profiles should only be loaded when needed by specific components
    // This eliminates unnecessary API calls on every login

    // Load Current User Effect
    this.loadCurrentUser$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.loadCurrentUser),
        mergeMap(() =>
          this.apiService.getCurrentUser().pipe(
            map(user => UsersActions.loadCurrentUserSuccess({ user })),
            catchError(error => of(UsersActions.loadCurrentUserFailure({ error })))
          )
        )
      )
    );

    // Load Free Agents Effect
    this.loadFreeAgents$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.loadFreeAgents),
        mergeMap(() =>
          this.apiService.getFreeAgents().pipe(
            map(freeAgents => UsersActions.loadFreeAgentsSuccess({ freeAgents })),
            catchError(error => of(UsersActions.loadFreeAgentsFailure({ error })))
          )
        )
      )
    );

    // Load Free Agents by Season Effect
    this.loadFreeAgentsBySeason$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.loadFreeAgentsBySeason),
        mergeMap(({ seasonId }) =>
          this.apiService.getFreeAgentsForSeason(seasonId).pipe(
            map(freeAgents => UsersActions.loadFreeAgentsBySeasonSuccess({ freeAgents })),
            catchError(error => of(UsersActions.loadFreeAgentsBySeasonFailure({ error })))
          )
        )
      )
    );

    // Send Contract Offer Effect
    this.sendContractOffer$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.sendContractOffer),
        mergeMap(({ clubId, clubName, clubLogoUrl, userId, playerName, seasonId, seasonName, sentBy }) =>
          this.apiService.sendContractOffer({
            clubId,
            clubName,
            clubLogoUrl,
            userId,
            playerName,
            seasonId,
            seasonName,
            sentBy
          }).pipe(
            map(offer => UsersActions.sendContractOfferSuccess({ offer })),
            catchError(error => of(UsersActions.sendContractOfferFailure({ error })))
          )
        )
      )
    );

    // Load Inbox Offers Effect
    this.loadInboxOffers$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.loadInboxOffers),
        mergeMap(({ userId }) =>
          this.apiService.getInboxOffers(userId).pipe(
            map(offers => UsersActions.loadInboxOffersSuccess({ offers })),
            catchError(error => of(UsersActions.loadInboxOffersFailure({ error })))
          )
        )
      )
    );

    // Respond to Offer Effect
    this.respondToOffer$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.respondToOffer),
        mergeMap(({ offerId, status }) =>
          this.apiService.respondToOffer(offerId, status).pipe(
            map(() => UsersActions.respondToOfferSuccess({ offerId, status })),
            catchError(error => of(UsersActions.respondToOfferFailure({ error })))
          )
        )
      )
    );

    // Update User Effect
    this.updateUser$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.updateUser),
        mergeMap(({ user }) =>
          this.apiService.updateUser(user).pipe(
            map(updatedUser => UsersActions.updateUserSuccess({ user: updatedUser })),
            catchError(error => of(UsersActions.updateUserFailure({ error })))
          )
        )
      )
    );

    // Update Current User Effect
    this.updateCurrentUser$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UsersActions.updateCurrentUser),
        mergeMap(({ userData }) =>
          this.apiService.updateCurrentUser(userData).pipe(
            map(updatedUser => UsersActions.updateCurrentUserSuccess({ user: updatedUser })),
            catchError(error => of(UsersActions.updateCurrentUserFailure({ error })))
          )
        )
      )
    );
  }
}
