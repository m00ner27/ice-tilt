import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StandingsState } from './standings.reducer';

export const selectStandingsState = createFeatureSelector<StandingsState>('standings');

export const selectCurrentSeasonStandings = createSelector(
  selectStandingsState,
  (state) => state.currentSeasonStandings
);

export const selectAllSeasonStandings = createSelector(
  selectStandingsState,
  (state) => state.allSeasonStandings
);

export const selectStandingsLoading = createSelector(
  selectStandingsState,
  (state) => state.loading
);

export const selectStandingsError = createSelector(
  selectStandingsState,
  (state) => state.error
);

export const selectStandingsBySeasonId = (seasonId: string) => createSelector(
  selectAllSeasonStandings,
  (standings) => standings.find(s => s.seasonId === seasonId)
);

export const selectTopTeams = createSelector(
  selectCurrentSeasonStandings,
  (standings) => standings?.teams.sort((a, b) => b.points - a.points).slice(0, 3) || []
); 