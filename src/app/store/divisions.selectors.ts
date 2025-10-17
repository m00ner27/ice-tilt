import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DivisionsState } from './divisions.reducer';

// Feature selector
export const selectDivisionsState = createFeatureSelector<DivisionsState>('divisions');

// Basic selectors
export const selectAllDivisions = createSelector(
  selectDivisionsState,
  (state: DivisionsState) => state?.divisions || []
);

export const selectDivisionsLoading = createSelector(
  selectDivisionsState,
  (state: DivisionsState) => state?.loading || false
);

export const selectDivisionsError = createSelector(
  selectDivisionsState,
  (state: DivisionsState) => state?.error || null
);

// Computed selectors
export const selectDivisionById = (divisionId: string) => createSelector(
  selectAllDivisions,
  (divisions) => divisions.find(division => division._id === divisionId)
);

export const selectDivisionsBySeason = (seasonId: string) => createSelector(
  selectAllDivisions,
  (divisions) => divisions.filter(division => division.seasonId === seasonId)
);

// Loading states
export const selectDivisionsLoadingState = createSelector(
  selectDivisionsLoading,
  selectDivisionsError,
  (loading, error) => ({ loading, error })
);
