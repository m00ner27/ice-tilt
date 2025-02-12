import { createReducer, on } from '@ngrx/store';
import { GameSummary } from './games.model';
import * as GamesActions from './games.actions';

export interface GamesState {
  games: GameSummary[];
  selectedGame: GameSummary | null;
  loading: boolean;
  error: string | null;
}

export const initialState: GamesState = {
  games: [],
  selectedGame: null,
  loading: false,
  error: null
};

export const gamesReducer = createReducer(
  initialState,
  
  on(GamesActions.loadGames, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(GamesActions.loadGamesSuccess, (state, { games }) => ({
    ...state,
    games,
    loading: false
  })),
  
  on(GamesActions.loadGamesFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  on(GamesActions.loadGameSummary, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(GamesActions.loadGameSummarySuccess, (state, { game }) => ({
    ...state,
    selectedGame: game,
    loading: false
  })),
  
  on(GamesActions.loadGameSummaryFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  }))
); 