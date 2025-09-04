import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Services
import { ProfileDataService } from '../shared/services/profile-data.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { CountryEmojiService } from '../shared/services/country-emoji.service';
import { StatsCalculationService } from '../shared/services/stats-calculation.service';

// Interfaces
import { ProfileState, CareerSeasonStats } from '../shared/interfaces/profile.interface';

// Components
import { PositionPillComponent } from '../components/position-pill/position-pill.component';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PositionPillComponent],
  templateUrl: './view-profile.component.html',
  styleUrls: ['./view-profile.component.css']
})
export class ViewProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component state
  profileState: ProfileState = {
    player: null,
    careerStats: [],
    careerTotals: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      goals: 0,
      assists: 0,
      points: 0,
      plusMinus: 0,
      pim: 0,
      shots: 0,
      hits: 0,
      ppg: 0,
      shg: 0,
      gwg: 0,
      faceoffsWon: 0,
      faceoffsLost: 0,
      blockedShots: 0,
      interceptions: 0,
      takeaways: 0,
      giveaways: 0,
      deflections: 0,
      penaltiesDrawn: 0,
      shotAttempts: 0,
      shotPct: 0,
      passAttempts: 0,
      passesCompleted: 0,
      toi: 0,
      savePercentage: 0,
      goalsAgainst: 0,
      shutouts: 0
    },
    gameByGameStats: [],
    allClubs: [],
    loading: true,
    loadingCareerStats: false,
    loadingGameStats: false,
    error: null
  };

  // Country emoji mapping
  countryEmojiMap: { [key: string]: string } = {};

  constructor(
    private authService: AuthService,
    private router: Router,
    private profileDataService: ProfileDataService,
    private imageUrlService: ImageUrlService,
    private countryEmojiService: CountryEmojiService,
    private statsService: StatsCalculationService
  ) {
    this.countryEmojiMap = this.countryEmojiService.getAllCountryEmojis();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load user profile data
   */
  private loadUserProfile(): void {
    this.authService.user$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (currentUser) => {
        if (!currentUser) {
          this.profileState.error = 'User not authenticated';
          this.profileState.loading = false;
          return;
        }

        if (!currentUser.sub) {
          this.profileState.error = 'User ID not found';
          this.profileState.loading = false;
          return;
        }

        // Load profile data using the service
        this.profileDataService.loadUserProfile(currentUser.sub).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (state) => {
            this.profileState = state;
          },
          error: (err) => {
            console.error('Error loading profile:', err);
            this.profileState.error = 'Failed to load profile. Please try again.';
            this.profileState.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error getting current user:', err);
        this.profileState.error = 'Failed to load profile. Please try again.';
        this.profileState.loading = false;
      }
    });
  }

  /**
   * Get the full image URL for a logo
   */
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  /**
   * Get club logo URL by club name
   */
  getClubLogoUrl(clubName: string): string {
    return this.imageUrlService.getClubLogoUrl(clubName, this.profileState.allClubs);
  }

  /**
   * Get all clubs the player has played for
   */
  getCareerClubs(): any[] {
    return this.profileDataService.getCareerClubs(this.profileState.allClubs, this.profileState.careerStats);
  }

  /**
   * Navigate to club detail page
   */
  navigateToClub(clubId: string): void {
    if (clubId) {
      this.router.navigate(['/clubs', clubId]);
    }
  }

  /**
   * Edit profile
   */
  editProfile(): void {
    this.router.navigate(['/edit-profile']);
  }

  /**
   * Retry loading profile
   */
  retryLoad(): void {
    this.loadUserProfile();
  }

  /**
   * Format game date
   */
  formatGameDate(dateString: string): string {
    return this.statsService.formatGameDate(dateString);
  }

  /**
   * Calculate shot percentage
   */
  calculateShotPercentage(goals: number, shots: number): number {
    return this.statsService.calculateShotPercentage(goals, shots);
  }

  /**
   * Format time on ice
   */
  formatTimeOnIce(seconds: number): string {
    return this.statsService.formatTimeOnIce(seconds);
  }

  // Getters for template access
  get player() { return this.profileState.player; }
  get careerStats() { return this.profileState.careerStats; }
  get careerTotals() { return this.profileState.careerTotals; }
  get gameByGameStats() { return this.profileState.gameByGameStats; }
  get allClubs() { return this.profileState.allClubs; }
  get loading() { return this.profileState.loading; }
  get loadingCareerStats() { return this.profileState.loadingCareerStats; }
  get loadingGameStats() { return this.profileState.loadingGameStats; }
  get error() { return this.profileState.error; }
}