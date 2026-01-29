import { createAction, props } from '@ngrx/store';
import { EashlMatch } from './services/match.service';

// Load Matches Actions
export const loadMatches = createAction('[Matches] Load Matches');
export const loadMatchesSuccess = createAction('[Matches] Load Matches Success', props<{ matches: EashlMatch[] }>());
export const loadMatchesFailure = createAction('[Matches] Load Matches Failure', props<{ error: any }>());

// Load Single Match Actions
export const loadMatch = createAction('[Matches] Load Match', props<{ matchId: string }>());
export const loadMatchSuccess = createAction('[Matches] Load Match Success', props<{ match: EashlMatch }>());
export const loadMatchFailure = createAction('[Matches] Load Match Failure', props<{ error: any }>());

// Load Matches by Season Actions
export const loadMatchesBySeason = createAction(
  '[Matches] Load Matches By Season',
  props<{ seasonId: string; includePlayoffs?: boolean; fields?: 'schedule' | 'stats' }>()
);
export const loadMatchesBySeasonSuccess = createAction('[Matches] Load Matches By Season Success', props<{ matches: EashlMatch[] }>());
export const loadMatchesBySeasonFailure = createAction('[Matches] Load Matches By Season Failure', props<{ error: any }>());

// Create Match Actions
export const createMatch = createAction('[Matches] Create Match', props<{ matchData: Partial<EashlMatch> }>());
export const createMatchSuccess = createAction('[Matches] Create Match Success', props<{ match: EashlMatch }>());
export const createMatchFailure = createAction('[Matches] Create Match Failure', props<{ error: any }>());

// Update Match Actions
export const updateMatch = createAction('[Matches] Update Match', props<{ match: EashlMatch }>());
export const updateMatchSuccess = createAction('[Matches] Update Match Success', props<{ match: EashlMatch }>());
export const updateMatchFailure = createAction('[Matches] Update Match Failure', props<{ error: any }>());

// Delete Match Actions
export const deleteMatch = createAction('[Matches] Delete Match', props<{ matchId: string }>());
export const deleteMatchSuccess = createAction('[Matches] Delete Match Success', props<{ matchId: string }>());
export const deleteMatchFailure = createAction('[Matches] Delete Match Failure', props<{ error: any }>());

// Bulk Update Matches Actions
export const bulkUpdateMatches = createAction('[Matches] Bulk Update Matches', props<{ updates: any[] }>());
export const bulkUpdateMatchesSuccess = createAction('[Matches] Bulk Update Matches Success', props<{ matches: EashlMatch[] }>());
export const bulkUpdateMatchesFailure = createAction('[Matches] Bulk Update Matches Failure', props<{ error: any }>());

// Merge Matches Actions
export const mergeMatches = createAction('[Matches] Merge Matches', props<{ primaryMatchId: string; secondaryMatchId: string }>());
export const mergeMatchesSuccess = createAction('[Matches] Merge Matches Success', props<{ match: EashlMatch }>());
export const mergeMatchesFailure = createAction('[Matches] Merge Matches Failure', props<{ error: any }>());

// Game Stats Actions
export const saveGameStats = createAction('[Matches] Save Game Stats', props<{ stats: any }>());
export const saveGameStatsSuccess = createAction('[Matches] Save Game Stats Success', props<{ match: EashlMatch }>());
export const saveGameStatsFailure = createAction('[Matches] Save Game Stats Failure', props<{ error: any }>());

export const saveManualGameStats = createAction('[Matches] Save Manual Game Stats', props<{ gameStats: any }>());
export const saveManualGameStatsSuccess = createAction('[Matches] Save Manual Game Stats Success', props<{ match: EashlMatch }>());
export const saveManualGameStatsFailure = createAction('[Matches] Save Manual Game Stats Failure', props<{ error: any }>());

// EASHL Data Actions
export const loadMatchEashlData = createAction('[Matches] Load Match EASHL Data', props<{ matchId: string }>());
export const loadMatchEashlDataSuccess = createAction('[Matches] Load Match EASHL Data Success', props<{ matchId: string; eashlData: any }>());
export const loadMatchEashlDataFailure = createAction('[Matches] Load Match EASHL Data Failure', props<{ error: any }>());

export const unlinkGameStats = createAction('[Matches] Unlink Game Stats', props<{ matchId: string }>());
export const unlinkGameStatsSuccess = createAction('[Matches] Unlink Game Stats Success', props<{ matchId: string }>());
export const unlinkGameStatsFailure = createAction('[Matches] Unlink Game Stats Failure', props<{ error: any }>());

// Clear Actions
export const clearMatches = createAction('[Matches] Clear Matches');
export const clearSelectedMatch = createAction('[Matches] Clear Selected Match');