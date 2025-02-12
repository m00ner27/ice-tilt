import { createAction, props } from '@ngrx/store';
import { AdminUser, SystemSettings, AdminAction } from './admin.model';

// User Management Actions
export const loadUsers = createAction('[Admin] Load Users');
export const loadUsersSuccess = createAction(
  '[Admin] Load Users Success',
  props<{ users: AdminUser[] }>()
);
export const loadUsersFailure = createAction(
  '[Admin] Load Users Failure',
  props<{ error: string }>()
);

export const updateUserRole = createAction(
  '[Admin] Update User Role',
  props<{ userId: string; role: AdminUser['role'] }>()
);
export const updateUserRoleSuccess = createAction(
  '[Admin] Update User Role Success',
  props<{ user: AdminUser }>()
);
export const updateUserRoleFailure = createAction(
  '[Admin] Update User Role Failure',
  props<{ error: string }>()
);

// System Settings Actions
export const loadSystemSettings = createAction('[Admin] Load System Settings');
export const loadSystemSettingsSuccess = createAction(
  '[Admin] Load System Settings Success',
  props<{ settings: SystemSettings }>()
);
export const loadSystemSettingsFailure = createAction(
  '[Admin] Load System Settings Failure',
  props<{ error: string }>()
);

export const updateSystemSettings = createAction(
  '[Admin] Update System Settings',
  props<{ settings: Partial<SystemSettings> }>()
);
export const updateSystemSettingsSuccess = createAction(
  '[Admin] Update System Settings Success',
  props<{ settings: SystemSettings }>()
);
export const updateSystemSettingsFailure = createAction(
  '[Admin] Update System Settings Failure',
  props<{ error: string }>()
);

// Admin Actions Log
export const logAdminAction = createAction(
  '[Admin] Log Admin Action',
  props<{ action: Omit<AdminAction, 'id'> }>()
);

export const loadAdminData = createAction(
  '[Admin] Load Admin Data'
);

export const loadAdminDataSuccess = createAction(
  '[Admin] Load Admin Data Success',
  props<{ data: any }>()  // Replace 'any' with your actual data type
);

export const loadAdminDataFailure = createAction(
  '[Admin] Load Admin Data Failure',
  props<{ error: string }>()
);

export const updateSettings = createAction(
  '[Admin] Update Settings',
  props<{ settings: any }>()  // Replace 'any' with your settings type
);

export const updateSettingsSuccess = createAction(
  '[Admin] Update Settings Success',
  props<{ settings: any }>()
);

export const updateSettingsFailure = createAction(
  '[Admin] Update Settings Failure',
  props<{ error: string }>()
); 