import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as StatsActions from './stats.actions';
import { StatsService } from './stats.service';
import { BaseEffects } from '../base.effects';
import { PlayerStats } from './stats.model';

@Injectable()
export class StatsEffects extends BaseEffects {
  loadStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StatsActions.loadStats),
      switchMap((action: { seasonId: string }) =>
        this.statsService.getSeasonStats(action.seasonId).pipe(
          map(stats => StatsActions.loadStatsSuccess({ stats })),
          catchError(error => of(StatsActions.loadStatsFailure({ error: error.message })))
        )
      )
    )
  );

  updateStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StatsActions.updatePlayerStats),
      switchMap((action: { playerId: string; seasonId: string; updates: Partial<PlayerStats> }) =>
        this.statsService.updatePlayerStats(action.playerId, action.seasonId, action.updates).pipe(
          map(stats => StatsActions.updatePlayerStatsSuccess({ stats })),
          catchError(error => of(StatsActions.updatePlayerStatsFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private statsService: StatsService
  ) {
    super(actions$);
  }
} 