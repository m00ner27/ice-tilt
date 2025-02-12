import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUser, SystemSettings, AdminAction } from './admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  // User Management
  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
  }

  updateUserRole(userId: string, role: AdminUser['role']): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/users/${userId}/role`, { role });
  }

  // System Settings
  getSystemSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(`${this.apiUrl}/settings`);
  }

  updateSystemSettings(settings: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.http.patch<SystemSettings>(`${this.apiUrl}/settings`, settings);
  }

  // Admin Actions Log
  logAction(action: Omit<AdminAction, 'id'>): Observable<AdminAction> {
    return this.http.post<AdminAction>(`${this.apiUrl}/actions`, action);
  }

  getActionLogs(): Observable<AdminAction[]> {
    return this.http.get<AdminAction[]>(`${this.apiUrl}/actions`);
  }

  // Add missing methods
  getAdminData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/data`);
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/settings`, settings);
  }
} 