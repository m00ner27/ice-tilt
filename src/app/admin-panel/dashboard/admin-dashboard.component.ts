import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../store/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <i class="fas fa-calendar"></i>
          <div class="stat-content">
            <h3>Active Seasons</h3>
            <p class="stat-value">{{ seasons.length }}</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-users"></i>
          <div class="stat-content">
            <h3>Total Clubs</h3>
            <p class="stat-value">{{ clubs.length }}</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-user"></i>
          <div class="stat-content">
            <h3>Total Users</h3>
            <p class="stat-value">{{ usersCount }}</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-trophy"></i>
          <div class="stat-content">
            <h3>Divisions</h3>
            <p class="stat-value">{{ divisions.length }}</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-gamepad"></i>
          <div class="stat-content">
            <h3>Games Scheduled</h3>
            <p class="stat-value">{{ games.length }}</p>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h3>Recent Activity</h3>
          <div class="activity-list">
            <div class="activity-item" *ngFor="let activity of recentActivity">
              <i [class]="activity.icon"></i>
              <span>{{ activity.message }}</span>
              <small>{{ activity.time }}</small>
            </div>
          </div>
        </div>

        <div class="dashboard-card">
          <h3>Quick Actions</h3>
          <div class="quick-actions">
            <button (click)="goTo('seasons')">
              <i class="fas fa-plus"></i>
              Add Season
            </button>
            <button (click)="goTo('clubs')">
              <i class="fas fa-plus"></i>
              Add Club
            </button>
            <button (click)="goTo('schedule')">
              <i class="fas fa-plus"></i>
              Schedule Game
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: #23293a;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card i {
      font-size: 2rem;
      color: #90caf9;
    }

    .stat-content h3 {
      color: #e3eafc;
      margin: 0 0 8px 0;
      font-size: 1rem;
    }

    .stat-value {
      color: #fff;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .dashboard-card {
      background: #23293a;
      border-radius: 12px;
      padding: 24px;
    }

    .dashboard-card h3 {
      color: #90caf9;
      margin: 0 0 16px 0;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #2c3446;
      border-radius: 8px;
    }

    .activity-item i {
      color: #90caf9;
    }

    .activity-item span {
      flex: 1;
      color: #e3eafc;
    }

    .activity-item small {
      color: #90caf9;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .quick-actions button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #1976d2;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .quick-actions button:hover {
      background: #1565c0;
    }

    @media (max-width: 768px) {
      .dashboard {
        padding: 16px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  seasons: any[] = [];
  clubs: any[] = [];
  divisions: any[] = [];
  games: any[] = [];
  recentActivity: any[] = [];
  users: any[] = [];
  usersCount: number = 0;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api.getSeasons().subscribe(seasons => this.seasons = seasons);
    this.api.getClubs().subscribe(clubs => this.clubs = clubs);
    this.api.getDivisions().subscribe(divisions => this.divisions = divisions);
    this.api.getUsers().subscribe(users => {
      this.users = users;
      this.usersCount = users.length;
    });
    this.api.getGames().subscribe(games => this.games = games);
    // Mock recent activity for now
    this.recentActivity = [
      { icon: 'fas fa-plus', message: 'New season "2024 Spring" created', time: '2 hours ago' },
      { icon: 'fas fa-user', message: 'New club "Ice Kings" registered', time: '4 hours ago' },
      { icon: 'fas fa-gamepad', message: 'Game scheduled: Team A vs Team B', time: '1 day ago' }
    ];
  }

  goTo(path: string): void {
    this.router.navigate(['/admin', path]);
  }
} 