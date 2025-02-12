import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import * as ClubsActions from './clubs.actions';
import { ClubsService } from './clubs.service';
import { BaseEffects } from '../base.effects';

@Injectable()
export class ClubsEffects extends BaseEffects {
  loadClubs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClubsActions.loadClubs),
      mergeMap(() =>
        this.clubsService.getClubs().pipe(
          map(response => ClubsActions.loadClubsSuccess({ clubs: response.clubs })),
          catchError(error => of(ClubsActions.loadClubsFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private clubsService: ClubsService
  ) {
    super(actions$);
  }
} 