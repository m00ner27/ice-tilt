import { createReducer, on } from '@ngrx/store';
import { Manager, ManagerStatus } from './managers.actions';
import * as ManagersActions from './managers.actions';

export interface ManagersState {
  managers: Manager[];
  selectedManager: Manager | null;
  userManagers: Manager[];
  clubManagers: Manager[];
  managerStatus: ManagerStatus | null;
  loading: boolean;
  error: any;
  statusLoading: boolean;
  statusError: any;
}

export const initialState: ManagersState = {
  managers: [],
  selectedManager: null,
  userManagers: [],
  clubManagers: [],
  managerStatus: null,
  loading: false,
  error: null,
  statusLoading: false,
  statusError: null,
};

export const managersReducer = createReducer(
  initialState,

  // Load Managers
  on(ManagersActions.loadManagers, (state) => ({ ...state, loading: true, error: null })),
  on(ManagersActions.loadManagersSuccess, (state, { managers }) => ({ 
    ...state, 
    managers, 
    loading: false, 
    error: null 
  })),
  on(ManagersActions.loadManagersFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Manager by ID
  on(ManagersActions.loadManager, (state) => ({ ...state, loading: true, error: null })),
  on(ManagersActions.loadManagerSuccess, (state, { manager }) => ({ 
    ...state, 
    selectedManager: manager, 
    loading: false, 
    error: null 
  })),
  on(ManagersActions.loadManagerFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Managers by User
  on(ManagersActions.loadManagersByUser, (state) => ({ ...state, loading: true, error: null })),
  on(ManagersActions.loadManagersByUserSuccess, (state, { managers }) => ({ 
    ...state, 
    userManagers: managers, 
    loading: false, 
    error: null 
  })),
  on(ManagersActions.loadManagersByUserFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Managers by Club
  on(ManagersActions.loadManagersByClub, (state) => ({ ...state, loading: true, error: null })),
  on(ManagersActions.loadManagersByClubSuccess, (state, { managers }) => ({ 
    ...state, 
    clubManagers: managers, 
    loading: false, 
    error: null 
  })),
  on(ManagersActions.loadManagersByClubFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Check Manager Status
  on(ManagersActions.checkManagerStatus, (state) => ({ ...state, statusLoading: true, statusError: null })),
  on(ManagersActions.checkManagerStatusSuccess, (state, { status }) => ({ 
    ...state, 
    managerStatus: status, 
    statusLoading: false, 
    statusError: null 
  })),
  on(ManagersActions.checkManagerStatusFailure, (state, { error }) => ({ 
    ...state, 
    statusLoading: false, 
    statusError: error 
  })),

  // Create Manager
  on(ManagersActions.createManager, (state) => ({ ...state, loading: true, error: null })),
  on(ManagersActions.createManagerSuccess, (state, { manager }) => ({ 
    ...state, 
    managers: [...state.managers, manager], 
    userManagers: [...state.userManagers, manager],
    loading: false, 
    error: null 
  })),
  on(ManagersActions.createManagerFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Update Manager
  on(ManagersActions.updateManager, (state) => ({ ...state, loading: true, error: null })),
  on(ManagersActions.updateManagerSuccess, (state, { manager }) => ({ 
    ...state, 
    managers: state.managers.map(m => m._id === manager._id ? manager : m),
    selectedManager: state.selectedManager?._id === manager._id ? manager : state.selectedManager,
    userManagers: state.userManagers.map(m => m._id === manager._id ? manager : m),
    clubManagers: state.clubManagers.map(m => m._id === manager._id ? manager : m),
    loading: false, 
    error: null 
  })),
  on(ManagersActions.updateManagerFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Revoke Manager
  on(ManagersActions.revokeManager, (state) => ({ ...state, loading: true, error: null })),
  on(ManagersActions.revokeManagerSuccess, (state, { manager }) => ({ 
    ...state, 
    managers: state.managers.map(m => m._id === manager._id ? manager : m),
    selectedManager: state.selectedManager?._id === manager._id ? manager : state.selectedManager,
    userManagers: state.userManagers.map(m => m._id === manager._id ? manager : m),
    clubManagers: state.clubManagers.map(m => m._id === manager._id ? manager : m),
    loading: false, 
    error: null 
  })),
  on(ManagersActions.revokeManagerFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Delete Manager
  on(ManagersActions.deleteManager, (state) => ({ ...state, loading: true, error: null })),
  on(ManagersActions.deleteManagerSuccess, (state, { managerId }) => ({ 
    ...state, 
    managers: state.managers.filter(m => m._id !== managerId),
    selectedManager: state.selectedManager?._id === managerId ? null : state.selectedManager,
    userManagers: state.userManagers.filter(m => m._id !== managerId),
    clubManagers: state.clubManagers.filter(m => m._id !== managerId),
    loading: false, 
    error: null 
  })),
  on(ManagersActions.deleteManagerFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Clear Actions
  on(ManagersActions.clearManagers, (state) => ({ ...state, managers: [], selectedManager: null })),
  on(ManagersActions.clearSelectedManager, (state) => ({ ...state, selectedManager: null })),
  on(ManagersActions.clearManagerStatus, (state) => ({ ...state, managerStatus: null }))
);
