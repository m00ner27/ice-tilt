import { createReducer, on } from '@ngrx/store';
import { SeasonStandings } from './standings.model';
import * as StandingsActions from './standings.actions';

export interface StandingsState {
  currentSeasonStandings: SeasonStandings | null;
  allSeasonStandings: SeasonStandings[];
  loading: boolean;
  error: string | null;
}

export const initialState: StandingsState = {
  currentSeasonStandings: null,
  allSeasonStandings: [],
  loading: false,
  error: null
};

export const standingsReducer = createReducer(
  initialState,
  
  on(StandingsActions.loadStandings, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(StandingsActions.loadStandingsSuccess, (state, { standings }) => ({
    ...state,
    currentSeasonStandings: standings,
    allSeasonStandings: [...state.allSeasonStandings, standings],
    loading: false,
    error: null
  })),
  
  on(StandingsActions.loadStandingsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);