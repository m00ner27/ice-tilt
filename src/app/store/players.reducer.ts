import { createReducer, on } from '@ngrx/store';
import { loadPlayersSuccess, upsertPlayerProfileSuccess, loadPlayerProfile, playerProfileFailure } from './players.actions';
import { PlayerProfile } from './models/models/player-profile.model';

export interface PlayersState {
  players: PlayerProfile[];
  loading: boolean;
  error: any;
  currentProfile: PlayerProfile | null;
}

export const initialState: PlayersState = {
  players: [],
  loading: false,
  error: null,
  currentProfile: null,
};

export const playersReducer = createReducer(
  initialState,
  on(loadPlayersSuccess, (state, { players }) => ({ ...state, players })),
  on(loadPlayerProfile, (state) => ({ ...state, loading: true, error: null })),
  on(upsertPlayerProfileSuccess, (state, { profile }) => ({ ...state, loading: false, currentProfile: profile })),
  on(playerProfileFailure, (state, { error }) => ({ ...state, loading: false, error }))
);
