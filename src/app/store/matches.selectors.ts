import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MatchesState } from './matches.reducer';

// Feature selector
export const selectMatchesState = createFeatureSelector<MatchesState>('matches');

// Basic selectors
export const selectAllMatches = createSelector(
  selectMatchesState,
  (state: MatchesState) => state?.matches || []
);

export const selectSelectedMatch = createSelector(
  selectMatchesState,
  (state: MatchesState) => state?.selectedMatch || null
);

export const selectMatchesLoading = createSelector(
  selectMatchesState,
  (state: MatchesState) => state?.loading || false
);

export const selectMatchesError = createSelector(
  selectMatchesState,
  (state: MatchesState) => state?.error || null
);

export const selectStatsLoading = createSelector(
  selectMatchesState,
  (state: MatchesState) => state?.statsLoading || false
);

export const selectStatsError = createSelector(
  selectMatchesState,
  (state: MatchesState) => state?.statsError || null
);

// EASHL data selectors
export const selectEashlData = createSelector(
  selectMatchesState,
  (state: MatchesState) => state?.eashlData || null
);

export const selectMatchEashlData = (matchId: string) => createSelector(
  selectEashlData,
  (eashlData) => eashlData?.[matchId] || null
);

// Computed selectors
export const selectMatchesBySeason = (seasonId: string) => createSelector(
  selectAllMatches,
  (matches) => matches.filter(match => match.season === seasonId)
);

export const selectMatchesByClub = (clubId: string) => createSelector(
  selectAllMatches,
  (matches) => matches.filter(match => 
    match.homeTeam.id === clubId || match.awayTeam.id === clubId
  )
);

export const selectMatchById = (matchId: string) => createSelector(
  selectAllMatches,
  (matches) => matches.find(match => match.id === matchId)
);

export const selectUpcomingMatches = createSelector(
  selectAllMatches,
  (matches) => matches.filter(match => 
    new Date(match.date) > new Date()
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
);

export const selectCompletedMatches = createSelector(
  selectAllMatches,
  (matches) => matches.filter(match => 
    new Date(match.date) <= new Date() && match.status === 'completed'
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
);

export const selectMatchesWithStats = createSelector(
  selectAllMatches,
  (matches) => matches.filter(match => match.hasStats)
);

export const selectMatchesWithoutStats = createSelector(
  selectAllMatches,
  (matches) => matches.filter(match => !match.hasStats)
);

// Loading states
export const selectMatchesLoadingState = createSelector(
  selectMatchesLoading,
  selectMatchesError,
  (loading, error) => ({ loading, error })
);

export const selectStatsLoadingState = createSelector(
  selectStatsLoading,
  selectStatsError,
  (loading, error) => ({ loading, error })
);
