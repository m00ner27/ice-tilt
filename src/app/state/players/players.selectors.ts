import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PlayersState } from './players.reducer';
import { Player, PlayerStats } from './players.models';

export const selectPlayersState = createFeatureSelector<PlayersState>('players');

export const selectAllPlayers = createSelector(
  selectPlayersState,
  (state) => state.players?.players || []
);

export const selectPlayersLoading = createSelector(
  selectPlayersState,
  (state) => state.loading
);

export const selectPlayersError = createSelector(
  selectPlayersState,
  (state) => state.error
);

export const selectPlayersByClub = (clubId: string) => createSelector(
  selectAllPlayers,
  (players) => players.filter(player => player.clubId === clubId)
);

export const selectPlayerById = (playerId: string) => createSelector(
  selectAllPlayers,
  (players) => players.find(player => player.id === playerId)
);

export const selectPlayersByPosition = (position: string) => createSelector(
  selectAllPlayers,
  (players) => players.filter(player => player.position === position)
);