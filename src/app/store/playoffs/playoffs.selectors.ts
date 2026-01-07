import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PlayoffsState } from './playoffs.reducer';

// Feature selector
export const selectPlayoffsState = createFeatureSelector<PlayoffsState>('playoffs');

// Basic selectors
export const selectAllPlayoffBrackets = createSelector(
  selectPlayoffsState,
  (state: PlayoffsState) => state?.brackets || []
);

export const selectCurrentPlayoffBracket = createSelector(
  selectPlayoffsState,
  (state: PlayoffsState) => state?.currentBracket || null
);

export const selectAllPlayoffSeries = createSelector(
  selectPlayoffsState,
  (state: PlayoffsState) => state?.series || []
);

export const selectCurrentPlayoffSeries = createSelector(
  selectPlayoffsState,
  (state: PlayoffsState) => state?.currentSeries || null
);

export const selectPlayoffsLoading = createSelector(
  selectPlayoffsState,
  (state: PlayoffsState) => state?.loading || false
);

export const selectPlayoffsError = createSelector(
  selectPlayoffsState,
  (state: PlayoffsState) => state?.error || null
);

export const selectPlayoffStatsLoading = createSelector(
  selectPlayoffsState,
  (state: PlayoffsState) => state?.statsLoading || false
);

export const selectPlayoffStatsError = createSelector(
  selectPlayoffsState,
  (state: PlayoffsState) => state?.statsError || null
);

export const selectPlayoffPlayerStats = createSelector(
  selectPlayoffsState,
  (state: PlayoffsState) => state?.playerStats || null
);

export const selectPlayoffGoalieStats = createSelector(
  selectPlayoffsState,
  (state: PlayoffsState) => state?.goalieStats || null
);

// Computed selectors
export const selectPlayoffBracketsBySeason = (seasonId: string) => createSelector(
  selectAllPlayoffBrackets,
  (brackets) => brackets.filter((bracket) => bracket.seasonId === seasonId)
);

export const selectPlayoffBracketsByStatus = (status: string) => createSelector(
  selectAllPlayoffBrackets,
  (brackets) => brackets.filter((bracket) => bracket.status === status)
);

export const selectPlayoffBracketById = (bracketId: string) => createSelector(
  selectAllPlayoffBrackets,
  (brackets) => brackets.find((bracket) => bracket._id === bracketId)
);

export const selectPlayoffSeriesByRound = (roundOrder: number) => createSelector(
  selectAllPlayoffSeries,
  (series) => series.filter((s) => s.roundOrder === roundOrder)
);

export const selectPlayoffSeriesByBracket = (bracketId: string) => createSelector(
  selectCurrentPlayoffBracket,
  (bracket) => bracket?.series || []
);

export const selectPlayoffSeriesById = (seriesId: string) => createSelector(
  selectAllPlayoffSeries,
  (series) => series.find((s) => s._id === seriesId)
);

// Loading states
export const selectPlayoffsLoadingState = createSelector(
  selectPlayoffsLoading,
  selectPlayoffsError,
  (loading, error) => ({ loading, error })
);

export const selectPlayoffStatsLoadingState = createSelector(
  selectPlayoffStatsLoading,
  selectPlayoffStatsError,
  (loading, error) => ({ loading, error })
);

