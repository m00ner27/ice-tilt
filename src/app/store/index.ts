import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';

// Import all reducers
import { counterReducer, initialState as counterInitialState } from './counter.reducer';
import { playersReducer, initialState as playersInitialState } from './players.reducer';
import { clubsReducer, initialState as clubsInitialState } from './clubs.reducer';
import { matchesReducer, initialState as matchesInitialState } from './matches.reducer';
import { seasonsReducer, initialState as seasonsInitialState } from './seasons.reducer';
import { usersReducer, initialState as usersInitialState } from './users.reducer';
import { divisionsReducer, initialState as divisionsInitialState } from './divisions.reducer';

// Root state interface
export interface AppState {
  counter: number;
  players: any; // Will be typed properly in players.reducer
  clubs: any; // Will be typed properly in clubs.reducer
  matches: any; // Will be typed properly in matches.reducer
  seasons: any; // Will be typed properly in seasons.reducer
  users: any; // Will be typed properly in users.reducer
  divisions: any; // Will be typed properly in divisions.reducer
}

// Root reducer map
export const reducers: ActionReducerMap<AppState> = {
  counter: counterReducer,
  players: playersReducer,
  clubs: clubsReducer,
  matches: matchesReducer,
  seasons: seasonsReducer,
  users: usersReducer,
  divisions: divisionsReducer,
};

// Meta reducers for development
export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];

// Initial state
export const initialState: AppState = {
  counter: counterInitialState,
  players: playersInitialState,
  clubs: clubsInitialState,
  matches: matchesInitialState,
  seasons: seasonsInitialState,
  users: usersInitialState,
  divisions: divisionsInitialState,
};
