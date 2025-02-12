import { createAction, props } from '@ngrx/store';
import { SeasonPlayerStats } from './players.models';

export const loadPlayers = createAction(
  '[Players] Load Players',
  props<{ seasonId: string }>()
);

export const loadPlayersSuccess = createAction(
  '[Players] Load Players Success',
  props<{ players: SeasonPlayerStats }>()
);

export const loadPlayersFailure = createAction(
  '[Players] Load Players Failure',
  props<{ error: string }>()
);