import { createAction, props } from '@ngrx/store';
import { GameSummary } from './games.model';

export const loadGames = createAction(
  '[Games] Load Games',
  props<{ seasonId: string }>()
);

export const loadGamesSuccess = createAction(
  '[Games] Load Games Success',
  props<{ games: GameSummary[] }>()
);

export const loadGamesFailure = createAction(
  '[Games] Load Games Failure',
  props<{ error: string }>()
);

export const loadGameSummary = createAction(
  '[Games] Load Game Summary',
  props<{ gameId: string }>()
);

export const loadGameSummarySuccess = createAction(
  '[Games] Load Game Summary Success',
  props<{ game: GameSummary }>()
);

export const loadGameSummaryFailure = createAction(
  '[Games] Load Game Summary Failure',
  props<{ error: string }>()
); 