import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as PlayersActions from './players.actions';
import { PlayersService } from './players.service';
import { BaseEffects } from '../base.effects';
import { SeasonPlayerStats } from './players.models';

@Injectable()
export class PlayersEffects extends BaseEffects {
  loadPlayers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlayersActions.loadPlayers),
      switchMap((action: { seasonId: string }) =>
        this.playersService.getPlayers(action.seasonId).pipe(
          map((players: SeasonPlayerStats) => PlayersActions.loadPlayersSuccess({ players })),
          catchError(error => of(PlayersActions.loadPlayersFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private playersService: PlayersService
  ) {
    super(actions$);
  }
}