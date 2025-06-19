import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <i class="fas fa-tachometer-alt"></i>
            Dashboard
          </a>
          <a routerLink="seasons" routerLinkActive="active">
            <i class="fas fa-calendar"></i>
            Seasons & Divisions
          </a>
          <a routerLink="clubs" routerLinkActive="active">
            <i class="fas fa-users"></i>
            Clubs
          </a>
          <a routerLink="add-games" routerLinkActive="active">
            <i class="fas fa-plus-square"></i>
            Add Games
          </a>
          <a routerLink="schedule" routerLinkActive="active">
            <i class="fas fa-gamepad"></i>
            Schedule
          </a>
          <a routerLink="users" routerLinkActive="active">
            <i class="fas fa-user-cog"></i>
            Users
          </a>
          <a routerLink="statistics" routerLinkActive="active">
            <i class="fas fa-chart-bar"></i>
            Statistics
          </a>
          <a routerLink="create-user" routerLinkActive="active">
            <i class="fas fa-user-plus"></i>
            Create User
          </a>
        </nav>
      </aside>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: #1a1f2e;
    }

    .sidebar {
      width: 250px;
      background: #23293a;
      padding: 24px 0;
      border-right: 1px solid #2c3446;
    }

    .sidebar-header {
      padding: 0 24px 24px;
      border-bottom: 1px solid #2c3446;
    }

    .sidebar-header h2 {
      color: #90caf9;
      margin: 0;
      font-size: 1.5rem;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      padding: 24px 0;
    }

    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      color: #e3eafc;
      text-decoration: none;
      transition: background 0.2s;
    }

    .sidebar-nav a:hover {
      background: #2c3446;
    }

    .sidebar-nav a.active {
      background: #1976d2;
      color: #fff;
    }

    .sidebar-nav i {
      width: 20px;
      text-align: center;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .admin-layout {
        flex-direction: column;
      }

      .sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #2c3446;
      }

      .sidebar-nav {
        flex-direction: row;
        overflow-x: auto;
        padding: 12px;
      }

      .sidebar-nav a {
        padding: 8px 16px;
        white-space: nowrap;
      }
    }
  `]
})
export class AdminPanelComponent {} 