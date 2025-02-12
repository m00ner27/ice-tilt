import { createAction, props } from '@ngrx/store';
import { Season } from './seasons.model';

// Load Seasons
export const loadSeasons = createAction('[Seasons] Load Seasons');
export const loadSeasonsSuccess = createAction(
  '[Seasons] Load Seasons Success',
  props<{ seasons: Season[] }>()
);
export const loadSeasonsFailure = createAction(
  '[Seasons] Load Seasons Failure',
  props<{ error: string }>()
);

// Create Season
export const createSeason = createAction(
  '[Seasons] Create Season',
  props<{ season: Omit<Season, 'id'> }>()
);
export const createSeasonSuccess = createAction(
  '[Seasons] Create Season Success',
  props<{ season: Season }>()
);
export const createSeasonFailure = createAction(
  '[Seasons] Create Season Failure',
  props<{ error: string }>()
);

// Update Season Status
export const updateSeasonStatus = createAction(
  '[Seasons] Update Status',
  props<{ seasonId: string; status: Season['status'] }>()
);
export const updateSeasonStatusSuccess = createAction(
  '[Seasons] Update Status Success',
  props<{ season: Season }>()
);
export const updateSeasonStatusFailure = createAction(
  '[Seasons] Update Status Failure',
  props<{ error: string }>()
);

// Start Playoffs
export const startPlayoffs = createAction(
  '[Seasons] Start Playoffs',
  props<{ seasonId: string; playoffRounds: number; teamsPerRound: number }>()
);
export const startPlayoffsSuccess = createAction(
  '[Seasons] Start Playoffs Success',
  props<{ season: Season }>()
);
export const startPlayoffsFailure = createAction(
  '[Seasons] Start Playoffs Failure',
  props<{ error: string }>()
);

// Set Current Season
export const setCurrentSeason = createAction(
  '[Seasons] Set Current Season',
  props<{ seasonId: string }>()
); 