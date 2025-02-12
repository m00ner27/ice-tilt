import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as FreeAgentsActions from './free-agents.actions';
import { FreeAgentsService } from './free-agents.service';
import { BaseEffects } from '../base.effects';

@Injectable()
export class FreeAgentsEffects extends BaseEffects {
  loadFreeAgents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FreeAgentsActions.loadFreeAgents),
      switchMap((action: { seasonId: string }) =>
        this.freeAgentsService.getFreeAgents(action.seasonId).pipe(
          map(freeAgents => FreeAgentsActions.loadFreeAgentsSuccess({ freeAgents })),
          catchError(error => of(FreeAgentsActions.loadFreeAgentsFailure({ error: error.message })))
        )
      )
    )
  );

  signFreeAgent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FreeAgentsActions.signFreeAgent),
      switchMap(({ playerId, teamId }) =>
        this.freeAgentsService.signFreeAgent(playerId, teamId).pipe(
          map(result => FreeAgentsActions.signFreeAgentSuccess({ result })),
          catchError(error => of(FreeAgentsActions.signFreeAgentFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private freeAgentsService: FreeAgentsService
  ) {
    super(actions$);
  }
} 