import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProfileState } from './profile.reducer';

export const selectProfileState = createFeatureSelector<ProfileState>('profile');

export const selectProfile = createSelector(
  selectProfileState,
  (state) => state.profile
);

export const selectProfileLoading = createSelector(
  selectProfileState,
  (state) => state.loading
);

export const selectProfileError = createSelector(
  selectProfileState,
  (state) => state.error
);

export const selectIsManager = createSelector(
  selectProfile,
  (profile) => profile?.isManager || false
);

export const selectUserClub = createSelector(
  selectProfile,
  (profile) => profile?.clubId
); 