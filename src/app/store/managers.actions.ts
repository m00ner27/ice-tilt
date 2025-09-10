import { createAction, props } from '@ngrx/store';

export interface Manager {
  _id: string;
  userId: string;
  clubId: string;
  permissions: {
    canManageRoster: boolean;
    canMakeOffers: boolean;
    canReleasePlayers: boolean;
    canViewClubStats: boolean;
    canManageClubSettings: boolean;
  };
  isActive: boolean;
  assignedBy: string;
  assignedAt: string;
  revokedAt?: string;
  revokedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  user?: {
    _id: string;
    discordUsername: string;
    email: string;
  };
  club?: {
    _id: string;
    name: string;
    logoUrl?: string;
  };
  assignedByUser?: {
    _id: string;
    discordUsername: string;
  };
  revokedByUser?: {
    _id: string;
    discordUsername: string;
  };
}

export interface ManagerStatus {
  isManager: boolean;
  manager: Manager | null;
  permissions: Manager['permissions'] | null;
}

// Load Managers Actions
export const loadManagers = createAction('[Managers] Load Managers');
export const loadManagersSuccess = createAction('[Managers] Load Managers Success', props<{ managers: Manager[] }>());
export const loadManagersFailure = createAction('[Managers] Load Managers Failure', props<{ error: any }>());

// Load Manager by ID Actions
export const loadManager = createAction('[Managers] Load Manager', props<{ managerId: string }>());
export const loadManagerSuccess = createAction('[Managers] Load Manager Success', props<{ manager: Manager }>());
export const loadManagerFailure = createAction('[Managers] Load Manager Failure', props<{ error: any }>());

// Load Managers by User Actions
export const loadManagersByUser = createAction('[Managers] Load Managers By User', props<{ userId: string }>());
export const loadManagersByUserSuccess = createAction('[Managers] Load Managers By User Success', props<{ managers: Manager[] }>());
export const loadManagersByUserFailure = createAction('[Managers] Load Managers By User Failure', props<{ error: any }>());

// Load Managers by Club Actions
export const loadManagersByClub = createAction('[Managers] Load Managers By Club', props<{ clubId: string }>());
export const loadManagersByClubSuccess = createAction('[Managers] Load Managers By Club Success', props<{ managers: Manager[] }>());
export const loadManagersByClubFailure = createAction('[Managers] Load Managers By Club Failure', props<{ error: any }>());

// Check Manager Status Actions
export const checkManagerStatus = createAction('[Managers] Check Manager Status', props<{ userId: string; clubId: string }>());
export const checkManagerStatusSuccess = createAction('[Managers] Check Manager Status Success', props<{ status: ManagerStatus }>());
export const checkManagerStatusFailure = createAction('[Managers] Check Manager Status Failure', props<{ error: any }>());

// Create Manager Actions
export const createManager = createAction('[Managers] Create Manager', props<{ 
  userId: string; 
  clubId: string; 
  permissions?: Partial<Manager['permissions']>; 
  assignedBy: string; 
}>());
export const createManagerSuccess = createAction('[Managers] Create Manager Success', props<{ manager: Manager }>());
export const createManagerFailure = createAction('[Managers] Create Manager Failure', props<{ error: any }>());

// Update Manager Actions
export const updateManager = createAction('[Managers] Update Manager', props<{ 
  managerId: string; 
  permissions: Partial<Manager['permissions']>; 
}>());
export const updateManagerSuccess = createAction('[Managers] Update Manager Success', props<{ manager: Manager }>());
export const updateManagerFailure = createAction('[Managers] Update Manager Failure', props<{ error: any }>());

// Revoke Manager Actions
export const revokeManager = createAction('[Managers] Revoke Manager', props<{ 
  managerId: string; 
  revokedBy: string; 
}>());
export const revokeManagerSuccess = createAction('[Managers] Revoke Manager Success', props<{ manager: Manager }>());
export const revokeManagerFailure = createAction('[Managers] Revoke Manager Failure', props<{ error: any }>());

// Delete Manager Actions
export const deleteManager = createAction('[Managers] Delete Manager', props<{ managerId: string }>());
export const deleteManagerSuccess = createAction('[Managers] Delete Manager Success', props<{ managerId: string }>());
export const deleteManagerFailure = createAction('[Managers] Delete Manager Failure', props<{ error: any }>());

// Clear Actions
export const clearManagers = createAction('[Managers] Clear Managers');
export const clearSelectedManager = createAction('[Managers] Clear Selected Manager');
export const clearManagerStatus = createAction('[Managers] Clear Manager Status');
