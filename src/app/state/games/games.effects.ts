import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as GamesActions from './games.actions';
import { GamesService } from './games.service';
import { BaseEffects } from '../base.effects';

@Injectable()
export class GamesEffects extends BaseEffects {
  loadGames$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GamesActions.loadGames),
      switchMap(({ seasonId }) =>
        this.gamesService.getGames(seasonId).pipe(
          map(games => GamesActions.loadGamesSuccess({ games })),
          catchError(error => of(GamesActions.loadGamesFailure({ error: error.message })))
        )
      )
    )
  );

  loadGameSummary$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GamesActions.loadGameSummary),
      switchMap((action: { gameId: string }) =>
        this.gamesService.getGameSummary(action.gameId).pipe(
          map(game => GamesActions.loadGameSummarySuccess({ game })),
          catchError(error => of(GamesActions.loadGameSummaryFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private gamesService: GamesService
  ) {
    super(actions$);
  }
} 