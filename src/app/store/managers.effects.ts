import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '@auth0/auth0-angular';

import * as ManagersActions from './managers.actions';
import { AppState } from './index';

@Injectable()
export class ManagersEffects {
  private apiUrl = `${environment.apiUrl}/managers`;
  
  // Declare effects as properties
  loadManagers$: any;
  loadManager$: any;
  loadManagersByUser$: any;
  loadManagersByClub$: any;
  checkManagerStatus$: any;
  createManager$: any;
  updateManager$: any;
  revokeManager$: any;
  deleteManager$: any;

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private store: Store<AppState>,
    private auth: AuthService
  ) {
    // Load all managers
    this.loadManagers$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ManagersActions.loadManagers),
        switchMap(() =>
          this.http.get<any>(`${this.apiUrl}`).pipe(
            map((response) => {
              if (response.success) {
                return ManagersActions.loadManagersSuccess({ managers: response.data });
              } else {
                throw new Error(response.message || 'Failed to load managers');
              }
            }),
            catchError((error) => of(ManagersActions.loadManagersFailure({ error: error.message })))
          )
        )
      )
    );

    // Load manager by ID
    this.loadManager$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ManagersActions.loadManager),
        switchMap(({ managerId }) =>
          this.http.get<any>(`${this.apiUrl}/${managerId}`).pipe(
            map((response) => {
              if (response.success) {
                return ManagersActions.loadManagerSuccess({ manager: response.data });
              } else {
                throw new Error(response.message || 'Failed to load manager');
              }
            }),
            catchError((error) => of(ManagersActions.loadManagerFailure({ error: error.message })))
          )
        )
      )
    );

    // Load managers by user
    this.loadManagersByUser$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ManagersActions.loadManagersByUser),
        switchMap(({ userId }) =>
          this.http.get<any>(`${this.apiUrl}/user/${userId}`).pipe(
            map((response) => {
              if (response.success) {
                return ManagersActions.loadManagersByUserSuccess({ managers: response.data });
              } else {
                throw new Error(response.message || 'Failed to load user managers');
              }
            }),
            catchError((error) => of(ManagersActions.loadManagersByUserFailure({ error: error.message })))
          )
        )
      )
    );

    // Load managers by club
    this.loadManagersByClub$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ManagersActions.loadManagersByClub),
        switchMap(({ clubId }) =>
          this.http.get<any>(`${this.apiUrl}/club/${clubId}`).pipe(
            map((response) => {
              if (response.success) {
                return ManagersActions.loadManagersByClubSuccess({ managers: response.data });
              } else {
                throw new Error(response.message || 'Failed to load club managers');
              }
            }),
            catchError((error) => of(ManagersActions.loadManagersByClubFailure({ error: error.message })))
          )
        )
      )
    );

    // Check manager status
    this.checkManagerStatus$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ManagersActions.checkManagerStatus),
        switchMap(({ userId, clubId }) =>
          this.http.get<any>(`${this.apiUrl}/check/${userId}/${clubId}`).pipe(
            map((response) => {
              if (response.success) {
                return ManagersActions.checkManagerStatusSuccess({ status: response.data });
              } else {
                throw new Error(response.message || 'Failed to check manager status');
              }
            }),
            catchError((error) => of(ManagersActions.checkManagerStatusFailure({ error: error.message })))
          )
        )
      )
    );

    // Create manager
    this.createManager$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ManagersActions.createManager),
        switchMap(({ userId, clubId, permissions, assignedBy }) =>
          this.http.post<any>(`${this.apiUrl}`, {
            userId,
            clubId,
            permissions,
            assignedBy
          }).pipe(
            map((response) => {
              if (response.success) {
                return ManagersActions.createManagerSuccess({ manager: response.data });
              } else {
                throw new Error(response.message || 'Failed to create manager');
              }
            }),
            catchError((error) => of(ManagersActions.createManagerFailure({ error: error.message })))
          )
        )
      )
    );

    // Update manager
    this.updateManager$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ManagersActions.updateManager),
        switchMap(({ managerId, permissions }) =>
          this.http.put<any>(`${this.apiUrl}/${managerId}`, { permissions }).pipe(
            map((response) => {
              if (response.success) {
                return ManagersActions.updateManagerSuccess({ manager: response.data });
              } else {
                throw new Error(response.message || 'Failed to update manager');
              }
            }),
            catchError((error) => of(ManagersActions.updateManagerFailure({ error: error.message })))
          )
        )
      )
    );

    // Revoke manager
    this.revokeManager$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ManagersActions.revokeManager),
        switchMap(({ managerId, revokedBy }) =>
          this.http.put<any>(`${this.apiUrl}/${managerId}/revoke`, { revokedBy }).pipe(
            map((response) => {
              if (response.success) {
                return ManagersActions.revokeManagerSuccess({ manager: response.data });
              } else {
                throw new Error(response.message || 'Failed to revoke manager');
              }
            }),
            catchError((error) => of(ManagersActions.revokeManagerFailure({ error: error.message })))
          )
        )
      )
    );

    // Delete manager
    this.deleteManager$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ManagersActions.deleteManager),
        switchMap(({ managerId }) =>
          this.http.delete<any>(`${this.apiUrl}/${managerId}`).pipe(
            map((response) => {
              if (response.success) {
                return ManagersActions.deleteManagerSuccess({ managerId });
              } else {
                throw new Error(response.message || 'Failed to delete manager');
              }
            }),
            catchError((error) => of(ManagersActions.deleteManagerFailure({ error: error.message })))
          )
        )
      )
    );
  }
}