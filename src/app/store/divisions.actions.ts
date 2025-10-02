import { createAction, props } from '@ngrx/store';

export interface Division {
  _id: string;
  name: string;
  seasonId: string;
  logoUrl?: string;
  order?: number;
}

// Load Divisions Actions
export const loadDivisions = createAction('[Divisions] Load Divisions');
export const loadDivisionsSuccess = createAction('[Divisions] Load Divisions Success', props<{ divisions: Division[] }>());
export const loadDivisionsFailure = createAction('[Divisions] Load Divisions Failure', props<{ error: any }>());

// Load Divisions by Season Actions
export const loadDivisionsBySeason = createAction('[Divisions] Load Divisions By Season', props<{ seasonId: string }>());
export const loadDivisionsBySeasonSuccess = createAction('[Divisions] Load Divisions By Season Success', props<{ divisions: Division[] }>());
export const loadDivisionsBySeasonFailure = createAction('[Divisions] Load Divisions By Season Failure', props<{ error: any }>());

// Create Division Actions
export const createDivision = createAction('[Divisions] Create Division', props<{ divisionData: Partial<Division> }>());
export const createDivisionSuccess = createAction('[Divisions] Create Division Success', props<{ division: Division }>());
export const createDivisionFailure = createAction('[Divisions] Create Division Failure', props<{ error: any }>());

// Update Division Actions
export const updateDivision = createAction('[Divisions] Update Division', props<{ division: Division }>());
export const updateDivisionSuccess = createAction('[Divisions] Update Division Success', props<{ division: Division }>());
export const updateDivisionFailure = createAction('[Divisions] Update Division Failure', props<{ error: any }>());

// Delete Division Actions
export const deleteDivision = createAction('[Divisions] Delete Division', props<{ divisionId: string }>());
export const deleteDivisionSuccess = createAction('[Divisions] Delete Division Success', props<{ divisionId: string }>());
export const deleteDivisionFailure = createAction('[Divisions] Delete Division Failure', props<{ error: any }>());

// Clear Actions
export const clearDivisions = createAction('[Divisions] Clear Divisions');
