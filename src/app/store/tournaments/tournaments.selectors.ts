import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TournamentsState } from './tournaments.reducer';

// Feature selector
export const selectTournamentsState = createFeatureSelector<TournamentsState>('tournaments');

// Basic selectors
export const selectAllTournaments = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.tournaments || []
);

export const selectCurrentTournament = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.currentTournament || null
);

export const selectAllTournamentBrackets = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.brackets || []
);

export const selectCurrentTournamentBracket = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.currentBracket || null
);

export const selectAllTournamentSeries = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.series || []
);

export const selectCurrentTournamentSeries = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.currentSeries || null
);

export const selectTournamentsLoading = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.loading || false
);

export const selectTournamentsError = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.error || null
);

export const selectTournamentStatsLoading = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.statsLoading || false
);

export const selectTournamentStatsError = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.statsError || null
);

export const selectTournamentPlayerStats = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.playerStats || null
);

export const selectTournamentGoalieStats = createSelector(
  selectTournamentsState,
  (state: TournamentsState) => state?.goalieStats || null
);

// Computed selectors
export const selectTournamentBracketsByTournament = (tournamentId: string) => createSelector(
  selectAllTournamentBrackets,
  (brackets) => brackets.filter((bracket) => bracket.tournamentId === tournamentId)
);

export const selectTournamentBracketsByStatus = (status: string) => createSelector(
  selectAllTournamentBrackets,
  (brackets) => brackets.filter((bracket) => bracket.status === status)
);

export const selectTournamentBracketById = (bracketId: string) => createSelector(
  selectAllTournamentBrackets,
  (brackets) => brackets.find((bracket) => bracket._id === bracketId)
);

export const selectTournamentSeriesByRound = (roundOrder: number) => createSelector(
  selectAllTournamentSeries,
  (series) => series.filter((s) => s.roundOrder === roundOrder)
);

export const selectTournamentSeriesByBracket = (bracketId: string) => createSelector(
  selectCurrentTournamentBracket,
  (bracket) => bracket?.series || []
);

export const selectTournamentSeriesById = (seriesId: string) => createSelector(
  selectAllTournamentSeries,
  (series) => series.find((s) => s._id === seriesId)
);

// Loading states
export const selectTournamentsLoadingState = createSelector(
  selectTournamentsLoading,
  selectTournamentsError,
  (loading, error) => ({ loading, error })
);

export const selectTournamentStatsLoadingState = createSelector(
  selectTournamentStatsLoading,
  selectTournamentStatsError,
  (loading, error) => ({ loading, error })
);

