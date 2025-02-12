import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ExtendedAdminState } from './admin.reducer';
import { AdminUser } from './admin.model';

export const selectAdminState = createFeatureSelector<ExtendedAdminState>('admin');

export const selectAllUsers = createSelector(
  selectAdminState,
  (state) => state.users
);

export const selectSystemSettings = createSelector(
  selectAdminState,
  (state) => state.systemSettings
);

export const selectAdminActions = createSelector(
  selectAdminState,
  (state) => state.adminActions
);

export const selectAdminLoading = createSelector(
  selectAdminState,
  (state) => state.loading
);

export const selectAdminError = createSelector(
  selectAdminState,
  (state) => state.error
);

export const selectUsersByRole = (role: AdminUser['role']) => createSelector(
  selectAllUsers,
  (users) => users.filter(user => user.role === role)
);

export const selectIsRegistrationOpen = createSelector(
  selectSystemSettings,
  (settings) => settings?.registrationOpen || false
);

export const selectCurrentSeasonId = createSelector(
  selectSystemSettings,
  (settings) => settings?.currentSeasonId
); 