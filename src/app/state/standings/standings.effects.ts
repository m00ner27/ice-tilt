import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as StandingsActions from './standings.actions';
import { StandingsService } from '../../services/standings.service';
import { BaseEffects } from '../base.effects';

@Injectable()
export class StandingsEffects extends BaseEffects {
  loadStandings$ = createEffect(() => 
    this.actions$.pipe(
      ofType(StandingsActions.loadStandings),
      switchMap((action) => 
        this.standingsService.getStandings(action.seasonId).pipe(
          map((standings) => StandingsActions.loadStandingsSuccess({ standings })),
          catchError((error) => of(StandingsActions.loadStandingsFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private standingsService: StandingsService
  ) {
    super(actions$);
  }
}