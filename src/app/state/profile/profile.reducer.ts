import { createReducer, on } from '@ngrx/store';
import { UserProfile } from './profile.model';
import * as ProfileActions from './profile.actions';

export interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null
};

export const profileReducer = createReducer(
  initialState,
  
  on(ProfileActions.loadProfile, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ProfileActions.loadProfileSuccess, (state, { profile }) => ({
    ...state,
    profile,
    loading: false
  })),
  
  on(ProfileActions.loadProfileFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  on(ProfileActions.updateProfile, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ProfileActions.updateProfileSuccess, (state, { profile }) => ({
    ...state,
    profile,
    loading: false
  })),
  
  on(ProfileActions.updateProfileFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  }))
); 