import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import * as ClubsActions from './clubs.actions';

@Injectable()
export class ClubsEffects {

  // Load Clubs Effect
  loadClubs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.loadClubs),
      mergeMap(() =>
        this.apiService.getClubs().pipe(
          map(clubs => ClubsActions.loadClubsSuccess({ clubs })),
          catchError(error => of(ClubsActions.loadClubsFailure({ error })))
        )
      )
    )
  );

  // Load Single Club Effect
  loadClub$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.loadClub),
      mergeMap(({ clubId }) =>
        this.apiService.getClubById(clubId).pipe(
          map(club => ClubsActions.loadClubSuccess({ club })),
          catchError(error => of(ClubsActions.loadClubFailure({ error })))
        )
      )
    )
  );

  // Load Clubs by Season Effect
  loadClubsBySeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.loadClubsBySeason),
      mergeMap(({ seasonId }) =>
        this.apiService.getClubsBySeason(seasonId).pipe(
          map(clubs => ClubsActions.loadClubsBySeasonSuccess({ clubs })),
          catchError(error => of(ClubsActions.loadClubsBySeasonFailure({ error })))
        )
      )
    )
  );

  // Create Club Effect
  createClub$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.createClub),
      mergeMap(({ clubData }) =>
        this.apiService.addClub(clubData).pipe(
          map(club => ClubsActions.createClubSuccess({ club })),
          catchError(error => of(ClubsActions.createClubFailure({ error })))
        )
      )
    )
  );

  // Update Club Effect
  updateClub$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.updateClub),
      mergeMap(({ club }) =>
        this.apiService.updateClub(club).pipe(
          map(updatedClub => ClubsActions.updateClubSuccess({ club: updatedClub })),
          catchError(error => of(ClubsActions.updateClubFailure({ error })))
        )
      )
    )
  );

  // Delete Club Effect
  deleteClub$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.deleteClub),
      mergeMap(({ clubId }) =>
        this.apiService.deleteClub(clubId).pipe(
          map(() => ClubsActions.deleteClubSuccess({ clubId })),
          catchError(error => of(ClubsActions.deleteClubFailure({ error })))
        )
      )
    )
  );

  // Load Club Roster Effect
  loadClubRoster$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.loadClubRoster),
      mergeMap(({ clubId, seasonId }) =>
        this.apiService.getClubRoster(clubId, seasonId).pipe(
          map(roster => ClubsActions.loadClubRosterSuccess({ clubId, roster })),
          catchError(error => of(ClubsActions.loadClubRosterFailure({ error })))
        )
      )
    )
  );

  // Load Club Global Roster Effect
  loadClubGlobalRoster$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.loadClubGlobalRoster),
      mergeMap(({ clubId }) =>
        this.apiService.getClubGlobalRoster(clubId).pipe(
          map(roster => ClubsActions.loadClubGlobalRosterSuccess({ clubId, roster })),
          catchError(error => of(ClubsActions.loadClubGlobalRosterFailure({ error })))
        )
      )
    )
  );

  // Add Player to Club Effect
  addPlayerToClub$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.addPlayerToClub),
      mergeMap(({ clubId, userId, seasonId }) =>
        this.apiService.addPlayerToClub(clubId, userId, seasonId).pipe(
          map(() => ClubsActions.addPlayerToClubSuccess({ clubId, userId, seasonId })),
          catchError(error => of(ClubsActions.addPlayerToClubFailure({ error })))
        )
      )
    )
  );

  // Remove Player from Club Effect
  removePlayerFromClub$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.removePlayerFromClub),
      mergeMap(({ clubId, userId, seasonId }) =>
        this.apiService.removePlayerFromClub(clubId, userId, seasonId).pipe(
          map(() => ClubsActions.removePlayerFromClubSuccess({ clubId, userId, seasonId })),
          catchError(error => of(ClubsActions.removePlayerFromClubFailure({ error })))
        )
      )
    )
  );

  // Upload Club Logo Effect
  uploadClubLogo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.uploadClubLogo),
      mergeMap(({ file }) =>
        this.apiService.uploadFile(file).pipe(
          map(response => ClubsActions.uploadClubLogoSuccess({ logoUrl: response.url })),
          catchError(error => of(ClubsActions.uploadClubLogoFailure({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private apiService: ApiService
  ) {}
}
