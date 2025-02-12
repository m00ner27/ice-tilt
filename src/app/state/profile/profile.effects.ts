import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as ProfileActions from './profile.actions';
import { ProfileService } from './profile.service';
import { BaseEffects } from '../base.effects';
import { UserProfile } from './profile.model';

@Injectable()
export class ProfileEffects extends BaseEffects {
  loadProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadProfile),
      switchMap(() =>
        this.profileService.getProfile().pipe(
          map(profile => ProfileActions.loadProfileSuccess({ profile })),
          catchError(error => of(ProfileActions.loadProfileFailure({ error: error.message })))
        )
      )
    )
  );

  updateProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.updateProfile),
      switchMap((action: { updates: Partial<UserProfile> }) =>
        this.profileService.updateProfile(action.updates).pipe(
          map(profile => ProfileActions.updateProfileSuccess({ profile })),
          catchError(error => of(ProfileActions.updateProfileFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private profileService: ProfileService
  ) {
    super(actions$);
  }
} 