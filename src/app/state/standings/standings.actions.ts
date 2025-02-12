import { createAction, props } from '@ngrx/store';
import { SeasonStandings } from './standings.model';  // Updated import path

export const loadStandings = createAction(
  '[Standings] Load Standings',
  props<{ seasonId: string }>()
);

export const loadStandingsSuccess = createAction(
  '[Standings] Load Standings Success',
  props<{ standings: SeasonStandings }>()
);

export const loadStandingsFailure = createAction(
  '[Standings] Load Standings Failure',
  props<{ error: string }>()
);