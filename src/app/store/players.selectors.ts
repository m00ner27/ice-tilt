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
