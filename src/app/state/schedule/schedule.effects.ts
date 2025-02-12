import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as ScheduleActions from './schedule.actions';
import { ScheduleService } from './schedule.service';
import { BaseEffects } from '../base.effects';
import { GenerateScheduleParams, ScheduleGame } from './schedule.model';

@Injectable()
export class ScheduleEffects extends BaseEffects {
  loadSchedule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScheduleActions.loadSchedule),
      switchMap((action: { seasonId: string }) =>
        this.scheduleService.getSchedule(action.seasonId).pipe(
          map(games => ScheduleActions.loadScheduleSuccess({ games })),
          catchError(error => of(ScheduleActions.loadScheduleFailure({ error: error.message })))
        )
      )
    )
  );

  generateSchedule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScheduleActions.generateSchedule),
      switchMap((action: { params: GenerateScheduleParams }) =>
        this.scheduleService.generateSchedule(action.params).pipe(
          map(games => ScheduleActions.generateScheduleSuccess({ games })),
          catchError(error => of(ScheduleActions.generateScheduleFailure({ error: error.message })))
        )
      )
    )
  );

  updateGame$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScheduleActions.updateScheduledGame),
      switchMap((action: { gameId: string; updates: Partial<ScheduleGame> }) =>
        this.scheduleService.updateScheduledGame(action.gameId, action.updates).pipe(
          map(game => ScheduleActions.updateScheduledGameSuccess({ game })),
          catchError(error => of(ScheduleActions.updateScheduledGameFailure({ error: error.message })))
        )
      )
    )
  );

  generatePlayoffSchedule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScheduleActions.generatePlayoffSchedule),
      switchMap((action: { seasonId: string; qualifiedTeams: string[] }) =>
        this.scheduleService.generatePlayoffSchedule(action.seasonId, action.qualifiedTeams).pipe(
          map(games => ScheduleActions.generatePlayoffScheduleSuccess({ games })),
          catchError(error => of(ScheduleActions.generatePlayoffScheduleFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private scheduleService: ScheduleService
  ) {
    super(actions$);
  }
} 