import { createReducer, on } from '@ngrx/store';
import { loadPlayersSuccess, upsertPlayerProfileSuccess, loadPlayerProfile, playerProfileFailure, loadPlayerStats, loadPlayerStatsSuccess, loadPlayerStatsFailure } from './players.actions';
import { PlayerProfile } from './models/models/player-profile.model';

export interface PlayersState {
  players: PlayerProfile[];
  loading: boolean;
  error: any;
  currentProfile: PlayerProfile | null;
  playerStats: any[];
  statsLoading: boolean;
  statsError: any;
}

export const initialState: PlayersState = {
  players: [],
  loading: false,
  error: null,
  currentProfile: null,
  playerStats: [],
  statsLoading: false,
  statsError: null,
};

export const playersReducer = createReducer(
  initialState,
  on(loadPlayersSuccess, (state, { players }) => ({ ...state, players })),
  on(loadPlayerProfile, (state) => ({ ...state, loading: true, error: null })),
  on(upsertPlayerProfileSuccess, (state, { profile }) => ({ ...state, loading: false, currentProfile: profile })),
  on(playerProfileFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(loadPlayerStats, (state) => ({ ...state, statsLoading: true, statsError: null })),
  on(loadPlayerStatsSuccess, (state, { stats }) => ({ ...state, statsLoading: false, playerStats: stats })),
  on(loadPlayerStatsFailure, (state, { error }) => ({ ...state, statsLoading: false, statsError: error }))
);
