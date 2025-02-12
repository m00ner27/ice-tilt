import { createReducer, on } from '@ngrx/store';
import { Club } from './clubs.model';
import * as ClubsActions from './clubs.actions';

export interface ClubsState {
  clubs: Club[];
  loading: boolean;
  error: string | null;
}

export const initialState: ClubsState = {
  clubs: [],
  loading: false,
  error: null
};

export const clubsReducer = createReducer(
  initialState,
  
  on(ClubsActions.loadClubs, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ClubsActions.loadClubsSuccess, (state, { clubs }) => ({
    ...state,
    clubs,
    loading: false,
    error: null
  })),
  
  on(ClubsActions.loadClubsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
); 