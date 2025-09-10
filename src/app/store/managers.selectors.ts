import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ManagersState } from './managers.reducer';

export const selectManagersState = createFeatureSelector<ManagersState>('managers');

// Basic selectors
export const selectAllManagers = createSelector(
  selectManagersState,
  (state) => state.managers
);

export const selectSelectedManager = createSelector(
  selectManagersState,
  (state) => state.selectedManager
);

export const selectUserManagers = createSelector(
  selectManagersState,
  (state) => state.userManagers
);

export const selectClubManagers = createSelector(
  selectManagersState,
  (state) => state.clubManagers
);

export const selectManagerStatus = createSelector(
  selectManagersState,
  (state) => state.managerStatus
);

export const selectManagersLoading = createSelector(
  selectManagersState,
  (state) => state.loading
);

export const selectManagersError = createSelector(
  selectManagersState,
  (state) => state.error
);

export const selectManagerStatusLoading = createSelector(
  selectManagersState,
  (state) => state.statusLoading
);

export const selectManagerStatusError = createSelector(
  selectManagersState,
  (state) => state.statusError
);

// Computed selectors
export const selectActiveManagers = createSelector(
  selectAllManagers,
  (managers) => managers.filter(manager => manager.isActive)
);

export const selectManagersByClub = createSelector(
  selectAllManagers,
  (managers) => (clubId: string) => 
    managers.filter(manager => manager.clubId === clubId && manager.isActive)
);

export const selectManagersByUser = createSelector(
  selectAllManagers,
  (managers) => (userId: string) => 
    managers.filter(manager => manager.userId === userId && manager.isActive)
);

export const selectIsUserManagerOfClub = createSelector(
  selectManagerStatus,
  (status) => status?.isManager || false
);

export const selectUserManagerPermissions = createSelector(
  selectManagerStatus,
  (status) => status?.permissions || null
);

export const selectUserCanManageRoster = createSelector(
  selectUserManagerPermissions,
  (permissions) => permissions?.canManageRoster || false
);

export const selectUserCanMakeOffers = createSelector(
  selectUserManagerPermissions,
  (permissions) => permissions?.canMakeOffers || false
);

export const selectUserCanReleasePlayers = createSelector(
  selectUserManagerPermissions,
  (permissions) => permissions?.canReleasePlayers || false
);

export const selectUserCanViewClubStats = createSelector(
  selectUserManagerPermissions,
  (permissions) => permissions?.canViewClubStats || false
);

export const selectUserCanManageClubSettings = createSelector(
  selectUserManagerPermissions,
  (permissions) => permissions?.canManageClubSettings || false
);

// Check if user is any manager
export const selectIsUserAnyManager = createSelector(
  selectUserManagers,
  (managers) => managers.length > 0
);

// Get user's managed clubs
export const selectUserManagedClubs = createSelector(
  selectUserManagers,
  (managers) => managers.map(manager => manager.club).filter(Boolean)
);
