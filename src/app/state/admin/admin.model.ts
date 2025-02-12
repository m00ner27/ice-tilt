export interface AdminState {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'PLAYER';
  isActive: boolean;
  lastLogin?: string;
}

export interface AdminAction {
  id: string;
  type: 'CREATE_SEASON' | 'UPDATE_USER' | 'UPDATE_GAME' | 'SYSTEM_UPDATE';
  performedBy: string;
  timestamp: string;
  details: any;
}

export interface SystemSettings {
  registrationOpen: boolean;
  currentSeasonId: string;
  maintenanceMode: boolean;
  allowPlayerTransfers: boolean;
} 