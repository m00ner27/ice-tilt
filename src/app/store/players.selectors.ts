import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PlayersState } from './players.reducer';

export const selectPlayersState = createFeatureSelector<PlayersState>('players');

export const selectAllPlayers = createSelector(
  selectPlayersState,
  (state: PlayersState) => state.players
);

export const selectCurrentProfile = createSelector(
  selectPlayersState,
  (state: PlayersState) => state.currentProfile
);

export const selectPlayersLoading = createSelector(
  selectPlayersState,
  (state: PlayersState) => state.loading
);

export const selectPlayersError = createSelector(
  selectPlayersState,
  (state: PlayersState) => state.error
);

export const selectPlayerStats = createSelector(
  selectPlayersState,
  (state: PlayersState) => state.playerStats
);

export const selectPlayerStatsLoading = createSelector(
  selectPlayersState,
  (state: PlayersState) => state.statsLoading
);

export const selectPlayerStatsError = createSelector(
  selectPlayersState,
  (state: PlayersState) => state.statsError
);

// Admin Player Management selectors
export const selectFreeAgents = createSelector(
  selectPlayersState,
  (state: PlayersState) => state.freeAgents
);

export const selectAdminLoading = createSelector(
  selectPlayersState,
  (state: PlayersState) => state.adminLoading
);

export const selectAdminError = createSelector(
  selectPlayersState,
  (state: PlayersState) => state.adminError
);
