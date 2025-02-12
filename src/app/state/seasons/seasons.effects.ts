import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as SeasonsActions from './seasons.actions';
import { SeasonsService } from './seasons.service';
import { BaseEffects } from '../base.effects';

@Injectable()
export class SeasonsEffects extends BaseEffects {
  loadSeasons$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonsActions.loadSeasons),
      switchMap(() =>
        this.seasonsService.getSeasons().pipe(
          map(seasons => SeasonsActions.loadSeasonsSuccess({ seasons })),
          catchError(error => of(SeasonsActions.loadSeasonsFailure({ error: error.message })))
        )
      )
    )
  );

  createSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonsActions.createSeason),
      switchMap(({ season }) =>
        this.seasonsService.createSeason(season).pipe(
          map(newSeason => SeasonsActions.createSeasonSuccess({ season: newSeason })),
          catchError(error => of(SeasonsActions.createSeasonFailure({ error: error.message })))
        )
      )
    )
  );

  updateSeasonStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonsActions.updateSeasonStatus),
      switchMap(({ seasonId, status }) =>
        this.seasonsService.updateSeasonStatus(seasonId, status).pipe(
          map(season => SeasonsActions.updateSeasonStatusSuccess({ season })),
          catchError(error => of(SeasonsActions.updateSeasonStatusFailure({ error: error.message })))
        )
      )
    )
  );

  startPlayoffs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonsActions.startPlayoffs),
      switchMap(({ seasonId, playoffRounds, teamsPerRound }) =>
        this.seasonsService.startPlayoffs(seasonId, playoffRounds, teamsPerRound).pipe(
          map(season => SeasonsActions.startPlayoffsSuccess({ season })),
          catchError(error => of(SeasonsActions.startPlayoffsFailure({ error: error.message })))
        )
      )
    )
  );

  setCurrentSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonsActions.setCurrentSeason),
      switchMap(({ seasonId }) =>
        this.seasonsService.setCurrentSeason(seasonId).pipe(
          map(() => SeasonsActions.loadSeasons()),
          catchError(() => of(SeasonsActions.loadSeasons())) // Reload seasons even on failure
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private seasonsService: SeasonsService
  ) {
    super(actions$);
  }
} 