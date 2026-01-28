import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ClubsState } from './clubs.reducer';

// Feature selector
export const selectClubsState = createFeatureSelector<ClubsState>('clubs');

// Basic selectors
export const selectAllClubs = createSelector(
  selectClubsState,
  (state: ClubsState) => state?.clubs || []
);

export const selectSelectedClub = createSelector(
  selectClubsState,
  (state: ClubsState) => state?.selectedClub || null
);

export const selectClubsLoading = createSelector(
  selectClubsState,
  (state: ClubsState) => state?.loading || false
);

export const selectClubsError = createSelector(
  selectClubsState,
  (state: ClubsState) => state?.error || null
);

export const selectUploadLoading = createSelector(
  selectClubsState,
  (state: ClubsState) => state?.uploadLoading || false
);

export const selectUploadError = createSelector(
  selectClubsState,
  (state: ClubsState) => state?.uploadError || null
);

// Club roster selectors
export const selectClubRosters = createSelector(
  selectClubsState,
  (state: ClubsState) => state?.clubRosters || {}
);

export const selectClubRoster = (clubId: string, seasonId?: string) => createSelector(
  selectClubRosters,
  (rosters) => {
    if (!clubId || !seasonId) return [];
    const key = `${clubId}:${seasonId}`;
    return rosters?.[key] || [];
  }
);

export const selectGlobalRosters = createSelector(
  selectClubsState,
  (state: ClubsState) => state?.globalRosters || {}
);

export const selectGlobalRoster = (clubId: string) => createSelector(
  selectGlobalRosters,
  (rosters) => rosters?.[clubId] || []
);

// Computed selectors
export const selectClubsByDivision = (division: string) => createSelector(
  selectAllClubs,
  (clubs) => clubs.filter(club => club.division === division)
);

export const selectActiveClubs = createSelector(
  selectAllClubs,
  (clubs) => clubs.filter(club => club.isActive !== false)
);

export const selectClubById = (clubId: string) => createSelector(
  selectAllClubs,
  (clubs) => clubs.find(club => club._id === clubId)
);

export const selectClubByName = (clubName: string) => createSelector(
  selectAllClubs,
  (clubs) => clubs.find(club => club.name === clubName || club.clubName === clubName)
);

// Roster-related computed selectors
export const selectClubRosterCount = (clubId: string, seasonId: string) => createSelector(
  selectClubRoster(clubId, seasonId),
  (roster) => roster.length
);

export const selectClubGlobalRosterCount = (clubId: string) => createSelector(
  selectGlobalRoster(clubId),
  (roster) => roster.length
);

// Loading states
export const selectClubsLoadingState = createSelector(
  selectClubsLoading,
  selectClubsError,
  (loading, error) => ({ loading, error })
);

export const selectUploadState = createSelector(
  selectUploadLoading,
  selectUploadError,
  (loading, error) => ({ loading, error })
);
