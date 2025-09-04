import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap, takeUntil } from 'rxjs/operators';
import { of, Subscription, Subject } from 'rxjs';

// Services
import { ManagerDataService } from '../shared/services/manager-data.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { RosterUpdateService } from '../store/services/roster-update.service';

// Interfaces
import { 
  ManagerState, 
  FreeAgent, 
  ManagerClub, 
  RosterPlayer, 
  NotificationState 
} from '../shared/interfaces/manager.interface';

@Component({
  selector: 'app-manager-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-view.component.html',
  styleUrls: ['./manager-view.component.css']
})
export class ManagerViewComponent implements OnInit, OnDestroy {
  private rosterUpdateSubscription: Subscription | undefined;
  private destroy$ = new Subject<void>();

  // Component state
  managerState: ManagerState = {
    freeAgents: [],
    rosterPlayers: [],
    managerClubs: [],
    allClubs: [],
    selectedClub: null,
    selectedClubId: '',
    selectedSeason: '',
    seasons: [],
    selectedFreeAgents: [],
    searchTerm: '',
    isLoading: true,
    error: null,
    notification: null
  };

  managerUserId: string | undefined;

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private managerDataService: ManagerDataService,
    private imageUrlService: ImageUrlService,
    private rosterUpdateService: RosterUpdateService
  ) {}

  ngOnInit(): void {
    this.setupAuthSubscription();
    this.setupRosterUpdateSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.rosterUpdateSubscription) {
      this.rosterUpdateSubscription.unsubscribe();
    }
  }

  /**
   * Setup authentication subscription
   */
  private setupAuthSubscription(): void {
    this.auth.user$.pipe(
      takeUntil(this.destroy$),
      switchMap(user => {
        if (user?.sub) {
          this.managerUserId = user.sub.split('|')[1];
          return this.managerDataService.loadManagerData(this.managerUserId);
        }
        return of(null);
      })
    ).subscribe({
      next: (state) => {
        if (state) {
          this.managerState = state;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading manager data:', error);
        this.managerState.isLoading = false;
        this.managerState.error = 'Failed to load manager data.';
      }
    });
  }

  /**
   * Setup roster update subscription
   */
  private setupRosterUpdateSubscription(): void {
    this.rosterUpdateSubscription = this.rosterUpdateService.rosterUpdates$.subscribe(event => {
      console.log('Roster update received in manager view:', event);
      if (event.action === 'sign' && event.clubId) {
        if (this.managerState.selectedClub && this.managerState.selectedClub._id === event.clubId) {
          console.log('Refreshing club data due to roster update');
          this.loadClubData();
        }
        this.loadClubData();
      }
    });
  }

  /**
   * Load manager data
   */
  private loadManagerData(): void {
    if (!this.managerUserId) return;

    this.managerDataService.loadManagerData(this.managerUserId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (state) => {
        this.managerState = state;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading manager data:', error);
        this.managerState.isLoading = false;
        this.managerState.error = 'Failed to load manager data.';
      }
    });
  }

  /**
   * Load club data
   */
  private loadClubData(): void {
    this.managerDataService.loadClubData(this.managerState).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (state) => {
        this.managerState = state;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading club data:', error);
        this.managerState.isLoading = false;
        this.managerState.error = 'Failed to load club data.';
      }
    });
  }

  /**
   * Handle season change
   */
  onSeasonChange(): void {
    console.log('Season change:', this.managerState.selectedSeason);
    
    this.managerState.selectedClub = null;
    this.managerState.selectedClubId = '';
    
    this.managerDataService.loadManagerClubs(this.managerState).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (state) => {
        this.managerState = state;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error during season change:', error);
      }
    });
  }

  /**
   * Set season
   */
  setSeason(seasonName: string): void {
    console.log('Setting season to:', seasonName);
    this.managerState.selectedSeason = seasonName;
    this.managerState.selectedClub = null;
    this.managerState.selectedClubId = '';
    this.loadManagerData();
  }

  /**
   * Handle club change
   */
  onClubChange(): void {
    console.log('Club change:', this.managerState.selectedClubId);
    
    if (this.managerState.selectedClubId) {
      this.managerState.selectedClub = this.managerState.managerClubs.find(
        club => club._id === this.managerState.selectedClubId
      ) || null;
      
      if (this.managerState.selectedClub) {
        this.loadClubData();
      }
    } else {
      this.managerState.selectedClub = null;
    }
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    console.log('Refresh data called');
    this.managerState.isLoading = true;
    this.loadManagerData();
  }

  /**
   * Refresh free agents
   */
  refreshFreeAgents(): void {
    if (this.managerState.selectedClub && this.managerState.selectedClub._id) {
      this.loadClubData();
    }
  }

  /**
   * Get available clubs text
   */
  getAvailableClubsText(): string {
    return this.managerDataService.getAvailableClubsText(this.managerState.managerClubs);
  }

  /**
   * Check player offer status
   */
  checkPlayerOfferStatus(playerId: string): string {
    return this.managerDataService.checkPlayerOfferStatus(playerId);
  }

  /**
   * Test season filtering
   */
  testSeasonFiltering(): void {
    console.log('=== TESTING SEASON FILTERING ===');
    console.log('Current selectedSeason:', this.managerState.selectedSeason);
    console.log('Available seasons:', this.managerState.seasons);
    console.log('All clubs available:', this.managerState.allClubs.map(c => c.name));
    
    this.managerState.seasons.forEach(season => {
      console.log(`\nTesting season: ${season.name}`);
      const filteredClubs = this.managerState.allClubs?.filter(club => 
        club.seasons?.some((s: any) => s.seasonId === season._id)
      ) || [];
      console.log(`Clubs for ${season.name}:`, filteredClubs.map(c => c.name));
    });
  }

  /**
   * Get filtered free agents
   */
  getFilteredFreeAgents(): FreeAgent[] {
    return this.managerDataService.getFilteredFreeAgents(
      this.managerState.freeAgents, 
      this.managerState.searchTerm
    );
  }

  /**
   * Toggle free agent selection
   */
  toggleFreeAgentSelection(agentId: string): void {
    this.managerState.selectedFreeAgents = this.managerDataService.toggleFreeAgentSelection(
      this.managerState.selectedFreeAgents, 
      agentId
    );
  }

  /**
   * Send signing requests
   */
  sendSigningRequests(): void {
    if (!this.managerUserId) return;

    this.managerDataService.sendContractOffers(
      this.managerState,
      this.managerUserId,
      (message) => this.showNotification('success', message),
      (message) => this.showNotification('error', message)
    );
  }

  /**
   * Release player
   */
  releasePlayer(playerId: string): void {
    this.managerDataService.releasePlayer(
      this.managerState,
      playerId,
      (message) => {
        this.showNotification('success', message);
        this.loadClubData();
      },
      (message) => this.showNotification('error', message)
    );
  }

  /**
   * Get image URL
   */
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  /**
   * Test Petosen Pallo endpoint
   */
  testPetosenPalloEndpoint(): void {
    this.managerDataService.testPetosenPalloEndpoint(
      (message) => this.showNotification('success', message),
      (message) => this.showNotification('error', message)
    );
  }

  /**
   * Show notification
   */
  showNotification(type: 'success' | 'error', message: string): void {
    this.managerState.notification = this.managerDataService.showNotification(type, message);
    setTimeout(() => this.managerState.notification = null, 5000);
  }

  // Getters for template access
  get freeAgents() { return this.managerState.freeAgents; }
  get rosterPlayers() { return this.managerState.rosterPlayers; }
  get managerClubs() { return this.managerState.managerClubs; }
  get allClubs() { return this.managerState.allClubs; }
  get selectedClub() { return this.managerState.selectedClub; }
  get selectedClubId() { return this.managerState.selectedClubId; }
  get selectedSeason() { return this.managerState.selectedSeason; }
  get seasons() { return this.managerState.seasons; }
  get selectedFreeAgents() { return this.managerState.selectedFreeAgents; }
  get searchTerm() { return this.managerState.searchTerm; }
  get isLoading() { return this.managerState.isLoading; }
  get error() { return this.managerState.error; }
  get notification() { return this.managerState.notification; }

  // Setters for template binding
  set selectedClubId(value: string) { this.managerState.selectedClubId = value; }
  set selectedSeason(value: string) { this.managerState.selectedSeason = value; }
  set searchTerm(value: string) { this.managerState.searchTerm = value; }
}