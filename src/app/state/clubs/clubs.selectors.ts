import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ClubsState } from './clubs.reducer';

export const selectClubsState = createFeatureSelector<ClubsState>('clubs');

export const selectAllClubs = createSelector(
  selectClubsState,
  (state) => state.clubs
);

export const selectClubsLoading = createSelector(
  selectClubsState,
  (state) => state.loading
);

export const selectClubsError = createSelector(
  selectClubsState,
  (state) => state.error
);

export const selectClubById = (clubId: string) => createSelector(
  selectAllClubs,
  (clubs) => clubs.find(club => club.id === clubId)
);

export const selectClubsByLocation = (location: string) => createSelector(
  selectAllClubs,
  (clubs) => clubs.filter(club => club.location === location)
); 