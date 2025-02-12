import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as AdminActions from './admin.actions';
import { AdminService } from './admin.service';
import { BaseEffects } from '../base.effects';

@Injectable()
export class AdminEffects extends BaseEffects {
  loadAdminData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAdminData),
      switchMap(() =>
        this.adminService.getAdminData().pipe(
          map(data => AdminActions.loadAdminDataSuccess({ data })),
          catchError(error => of(AdminActions.loadAdminDataFailure({ error: error.message })))
        )
      )
    )
  );

  updateSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.updateSettings),
      switchMap(({ settings }) =>
        this.adminService.updateSettings(settings).pipe(
          map(updatedSettings => AdminActions.updateSettingsSuccess({ settings: updatedSettings })),
          catchError(error => of(AdminActions.updateSettingsFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private adminService: AdminService
  ) {
    super(actions$);
  }
} 