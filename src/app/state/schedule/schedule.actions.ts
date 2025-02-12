import { createAction, props } from '@ngrx/store';
import { ScheduleGame, GenerateScheduleParams } from './schedule.model';

// Load Schedule
export const loadSchedule = createAction(
  '[Schedule] Load Schedule',
  props<{ seasonId: string }>()
);
export const loadScheduleSuccess = createAction(
  '[Schedule] Load Schedule Success',
  props<{ games: ScheduleGame[] }>()
);
export const loadScheduleFailure = createAction(
  '[Schedule] Load Schedule Failure',
  props<{ error: string }>()
);

// Generate Schedule
export const generateSchedule = createAction(
  '[Schedule] Generate Schedule',
  props<{ params: GenerateScheduleParams }>()
);
export const generateScheduleSuccess = createAction(
  '[Schedule] Generate Schedule Success',
  props<{ games: ScheduleGame[] }>()
);
export const generateScheduleFailure = createAction(
  '[Schedule] Generate Schedule Failure',
  props<{ error: string }>()
);

// Update Game
export const updateScheduledGame = createAction(
  '[Schedule] Update Scheduled Game',
  props<{ gameId: string; updates: Partial<ScheduleGame> }>()
);
export const updateScheduledGameSuccess = createAction(
  '[Schedule] Update Scheduled Game Success',
  props<{ game: ScheduleGame }>()
);
export const updateScheduledGameFailure = createAction(
  '[Schedule] Update Scheduled Game Failure',
  props<{ error: string }>()
);

// Generate Playoff Schedule
export const generatePlayoffSchedule = createAction(
  '[Schedule] Generate Playoff Schedule',
  props<{ seasonId: string; qualifiedTeams: string[] }>()
);
export const generatePlayoffScheduleSuccess = createAction(
  '[Schedule] Generate Playoff Schedule Success',
  props<{ games: ScheduleGame[] }>()
);
export const generatePlayoffScheduleFailure = createAction(
  '[Schedule] Generate Playoff Schedule Failure',
  props<{ error: string }>()
); 