import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../store/services/api.service';
import { AuthService } from '@auth0/auth0-angular';
import { AdminPasswordService } from '../../services/admin-password.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  seasons: any[] = [];
  clubs: any[] = [];
  divisions: any[] = [];
  games: any[] = [];
  usersCount = 0;
  recentActivity: any[] = [];
  isAuthenticated = false;
  authError = false;

  constructor(
    private api: ApiService,
    private router: Router,
    public auth: AuthService,
    private adminPasswordService: AdminPasswordService
  ) {}

  ngOnInit() {
    // Check authentication state
    this.auth.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      console.log('Admin Dashboard - User authenticated:', isAuth);
    });
    
    this.loadDashboardData();
  }

  login() {
    this.auth.loginWithRedirect({
      authorizationParams: {
        audience: environment.apiAudience,
        scope: 'openid profile email offline_access'
      }
    });
  }

  logoutFromAdmin() {
    // Reset admin password verification and redirect to home
    this.adminPasswordService.resetAdminPasswordVerification();
    this.router.navigate(['/home']);
  }

  loadDashboardData() {
    // Load seasons
    this.api.getSeasons().subscribe({
      next: (seasons) => {
        this.seasons = seasons;
      },
      error: (error) => {
        console.error('Error loading seasons:', error);
      }
    });

    // Load clubs
    this.api.getClubs().subscribe({
      next: (clubs) => {
        this.clubs = clubs;
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
      }
    });

    // Load divisions
    this.api.getDivisions().subscribe({
      next: (divisions) => {
        this.divisions = divisions;
      },
      error: (error) => {
        console.error('Error loading divisions:', error);
      }
    });

    // Load games
    this.api.getGames().subscribe({
      next: (games) => {
        this.games = games;
      },
      error: (error) => {
        console.error('Error loading games:', error);
      }
    });

    // Load users count
    this.api.getUsers().subscribe({
      next: (users) => {
        this.usersCount = users.length;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Set a default value if authentication fails
        this.usersCount = 0;
        this.authError = true;
      }
    });

    // Mock recent activity
    this.recentActivity = [
      {
        icon: 'fas fa-plus text-green-500',
        message: 'New season created',
        time: '2 hours ago'
      },
      {
        icon: 'fas fa-user text-blue-500',
        message: 'New club registered',
        time: '4 hours ago'
      },
      {
        icon: 'fas fa-gamepad text-purple-500',
        message: 'Game scheduled',
        time: '6 hours ago'
      }
    ];
  }

  goTo(route: string) {
    this.router.navigate([`/admin/${route}`]);
  }
}
