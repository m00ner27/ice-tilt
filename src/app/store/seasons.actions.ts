import { createAction, props } from '@ngrx/store';

export interface Season {
  _id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  divisions?: string[];
}

// Load Seasons Actions
export const loadSeasons = createAction('[Seasons] Load Seasons');
export const loadSeasonsSuccess = createAction('[Seasons] Load Seasons Success', props<{ seasons: Season[] }>());
export const loadSeasonsFailure = createAction('[Seasons] Load Seasons Failure', props<{ error: any }>());

// Create Season Actions
export const createSeason = createAction('[Seasons] Create Season', props<{ seasonData: Partial<Season> }>());
export const createSeasonSuccess = createAction('[Seasons] Create Season Success', props<{ season: Season }>());
export const createSeasonFailure = createAction('[Seasons] Create Season Failure', props<{ error: any }>());

// Update Season Actions
export const updateSeason = createAction('[Seasons] Update Season', props<{ season: Season }>());
export const updateSeasonSuccess = createAction('[Seasons] Update Season Success', props<{ season: Season }>());
export const updateSeasonFailure = createAction('[Seasons] Update Season Failure', props<{ error: any }>());

// Delete Season Actions
export const deleteSeason = createAction('[Seasons] Delete Season', props<{ seasonId: string }>());
export const deleteSeasonSuccess = createAction('[Seasons] Delete Season Success', props<{ seasonId: string }>());
export const deleteSeasonFailure = createAction('[Seasons] Delete Season Failure', props<{ error: any }>());

// Set Active Season Actions
export const setActiveSeason = createAction('[Seasons] Set Active Season', props<{ seasonId: string }>());
export const setActiveSeasonSuccess = createAction('[Seasons] Set Active Season Success', props<{ season: Season }>());
export const setActiveSeasonFailure = createAction('[Seasons] Set Active Season Failure', props<{ error: any }>());

// Clear Actions
export const clearSeasons = createAction('[Seasons] Clear Seasons');
