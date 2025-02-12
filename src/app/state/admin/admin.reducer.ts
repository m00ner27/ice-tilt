import { createReducer, on } from '@ngrx/store';
import { AdminState, SystemSettings, AdminAction } from './admin.model';
import * as AdminActions from './admin.actions';

export interface ExtendedAdminState extends AdminState {
  systemSettings: SystemSettings | null;
  adminActions: AdminAction[];
}

export const initialState: ExtendedAdminState = {
  users: [],
  systemSettings: null,
  adminActions: [],
  loading: false,
  error: null
};

export const adminReducer = createReducer(
  initialState,
  
  // Users
  on(AdminActions.loadUsers, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AdminActions.loadUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    loading: false
  })),
  
  on(AdminActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  on(AdminActions.updateUserRoleSuccess, (state, { user }) => ({
    ...state,
    users: state.users.map(u => u.id === user.id ? user : u)
  })),
  
  // System Settings
  on(AdminActions.loadSystemSettingsSuccess, (state, { settings }) => ({
    ...state,
    systemSettings: settings
  })),
  
  on(AdminActions.updateSystemSettingsSuccess, (state, { settings }) => ({
    ...state,
    systemSettings: settings
  })),
  
  // Admin Actions Log
  on(AdminActions.logAdminAction, (state, { action }) => ({
    ...state,
    adminActions: [{
      ...action,
      id: Date.now().toString(), // Simple ID generation
    }, ...state.adminActions]
  }))
); 