import { createReducer, on } from '@ngrx/store';
import * as PlayersActions from './players.actions';
import { SeasonPlayerStats } from './players.models';

export interface PlayersState {
  players: SeasonPlayerStats | null;
  loading: boolean;
  error: string | null;
}

export const initialState: PlayersState = {
  players: null,
  loading: false,
  error: null
};

export const playersReducer = createReducer(
  initialState,
  on(PlayersActions.loadPlayers, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(PlayersActions.loadPlayersSuccess, (state, { players }) => ({
    ...state,
    players,
    loading: false
  })),
  on(PlayersActions.loadPlayersFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  }))
);