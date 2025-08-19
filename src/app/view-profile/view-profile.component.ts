import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../store/services/api.service';
import { environment } from '../../environments/environment';
import { switchMap } from 'rxjs/operators';
// Define a more complete User interface that matches the API response
interface User {
  _id?: string;
  discordUsername?: string;
  platform?: string;
  gamertag?: string;
  currentClubId?: {
    _id: string;
    name: string;
    logoUrl?: string;
  } | null;
  participatingSeasons?: Array<{
    _id: string;
    name?: string;
  }>;
  playerProfile?: {
    position?: string;
    secondaryPositions?: string[];
    handedness?: string;
    country?: string;
    region?: string;
    status?: string;
  };
}

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="profile-container">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>

      <!-- Profile Content -->
      <div *ngIf="!isLoading && user" class="profile-content">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar">
            <img 
              [src]="getClubLogoUrl(user.currentClubId?.logoUrl)" 
              [alt]="user.currentClubId?.name || 'No Club'"
              class="club-logo"
            />
          </div>
          <div class="profile-info">
            <h1 class="username">{{ user.discordUsername }}</h1>
            <p class="club-name" *ngIf="user.currentClubId?.name">
              {{ user.currentClubId?.name }}
            </p>
            <p class="club-name no-club" *ngIf="!user.currentClubId?.name">
              Free Agent
            </p>
          </div>
        </div>

        <!-- Profile Details -->
        <div class="profile-details">
          <div class="detail-section">
            <h3>Position</h3>
            <div class="position-tags">
              <span class="position-tag primary">{{ user.playerProfile?.position }}</span>
              <span 
                *ngFor="let pos of user.playerProfile?.secondaryPositions" 
                class="position-tag secondary"
              >
                {{ pos }}
              </span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Handedness</h3>
            <p>{{ user.playerProfile?.handedness }}</p>
          </div>

          <div class="detail-section">
            <h3>Country</h3>
            <p>{{ user.playerProfile?.country }}</p>
          </div>

          <div class="detail-section">
            <h3>Region</h3>
            <p>{{ user.playerProfile?.region }}</p>
          </div>

          <div class="detail-section">
            <h3>Status</h3>
            <p class="status {{ user.playerProfile?.status?.toLowerCase()?.replace(' ', '-') }}">
              {{ user.playerProfile?.status }}
            </p>
          </div>
        </div>

        <!-- Gaming IDs -->
        <div class="gaming-ids">
          <h3>Gaming IDs</h3>
          <div class="gaming-id-item">
            <span class="platform">{{ user.platform }}</span>
            <span class="gamertag">{{ user.gamertag }}</span>
          </div>
        </div>

        <!-- Season Participation -->
        <div class="seasons-section" *ngIf="user.participatingSeasons && user.participatingSeasons.length > 0">
          <h3>Seasons Participating</h3>
          <div class="seasons-list">
            <span 
              *ngFor="let season of user.participatingSeasons" 
              class="season-tag"
            >
              {{ season.name || 'Season ' + season._id }}
            </span>
          </div>
        </div>

        <!-- Edit Profile Button -->
        <div class="actions">
          <button 
            class="edit-profile-btn"
            (click)="editProfile()"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !user && error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <button (click)="retryLoad()" class="retry-btn">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: white;
    }

    .loading-container {
      text-align: center;
      padding: 40px;
    }

    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }

    .profile-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      background: #2c3e50;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .club-logo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-info h1 {
      margin: 0 0 10px 0;
      font-size: 2.5rem;
      color: #ecf0f1;
    }

    .club-name {
      margin: 0;
      font-size: 1.2rem;
      color: #bdc3c7;
    }

    .no-club {
      color: #e74c3c;
      font-style: italic;
    }

    .profile-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .detail-section {
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }

    .detail-section h3 {
      margin: 0 0 15px 0;
      color: #3498db;
      font-size: 1.1rem;
    }

    .detail-section p {
      margin: 0;
      color: #ecf0f1;
      font-size: 1rem;
    }

    .position-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .position-tag {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: bold;
    }

    .position-tag.primary {
      background: #e74c3c;
      color: white;
    }

    .position-tag.secondary {
      background: #3498db;
      color: white;
    }

    .status {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: bold;
      display: inline-block;
    }

    .status.free-agent {
      background: #e67e22;
      color: white;
    }

    .status.signed {
      background: #27ae60;
      color: white;
    }

    .gaming-ids {
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .gaming-ids h3 {
      margin: 0 0 15px 0;
      color: #3498db;
      font-size: 1.1rem;
    }

    .gaming-id-item {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .platform {
      background: #9b59b6;
      color: white;
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 0.9rem;
      font-weight: bold;
    }

    .gamertag {
      color: #ecf0f1;
      font-size: 1.1rem;
      font-weight: bold;
    }

    .seasons-section {
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .seasons-section h3 {
      margin: 0 0 15px 0;
      color: #3498db;
      font-size: 1.1rem;
    }

    .seasons-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .season-tag {
      background: #34495e;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
    }

    .actions {
      text-align: center;
      margin-top: 30px;
    }

    .edit-profile-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.3s;
    }

    .edit-profile-btn:hover {
      background: #2980b9;
    }

    .error-container {
      text-align: center;
      padding: 40px;
    }

    .error-message {
      color: #e74c3c;
      margin-bottom: 20px;
    }

    .retry-btn {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
    }

    .retry-btn:hover {
      background: #c0392b;
    }

    @media (max-width: 768px) {
      .profile-header {
        flex-direction: column;
        text-align: center;
      }

      .profile-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ViewProfileComponent implements OnInit {
  user: User | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.error = null;

    // Get current user from auth service
    this.authService.user$.subscribe({
      next: (currentUser) => {
        if (!currentUser) {
          this.error = 'User not authenticated';
          this.isLoading = false;
          return;
        }

        if (!currentUser.sub) {
          this.error = 'User ID not found';
          this.isLoading = false;
          return;
        }

        // Get the MongoDB user ID by syncing with the database
        this.authService.getAccessTokenSilently({
          authorizationParams: { audience: 'http://localhost:3000' }
        }).pipe(
          switchMap(token => 
            this.http.post(
              `${environment.apiUrl}/api/users/auth0-sync`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            )
          ),
          switchMap((dbUser: any) => {
            if (!dbUser._id) {
              throw new Error('Could not get user ID from database');
            }
            // Now get the user profile using the MongoDB ID
            return this.apiService.getUser(dbUser._id);
          })
        ).subscribe({
          next: (user: User) => {
            this.user = user;
            this.isLoading = false;
          },
          error: (err: any) => {
            console.error('Error fetching user profile:', err);
            this.error = 'Failed to load profile. Please try again.';
            this.isLoading = false;
          }
        });
      },
      error: (err: any) => {
        console.error('Error getting current user:', err);
        this.error = 'Failed to load profile. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getClubLogoUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/square-default.png';
    }
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    if (logoUrl.startsWith('/uploads/')) {
      return `${environment.apiUrl}${logoUrl}`;
    }
    return logoUrl;
  }

  editProfile(): void {
    this.router.navigate(['/edit-profile']);
  }

  retryLoad(): void {
    this.loadUserProfile();
  }
}
