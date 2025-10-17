import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap, takeUntil } from 'rxjs/operators';
import { of, Subscription, Subject, Observable } from 'rxjs';

// NgRx
import { Store } from '@ngrx/store';
import { AppState } from '../store';
import * as UsersActions from '../store/users.actions';
import * as ClubsActions from '../store/clubs.actions';
import * as SeasonsActions from '../store/seasons.actions';
import {
  selectAllClubs,
  selectSelectedClub,
  selectClubRoster
} from '../store/clubs.selectors';
import {
  selectFreeAgents,
  selectUsersLoading,
  selectUsersError
} from '../store/users.selectors';
import {
  selectAllSeasons
} from '../store/seasons.selectors';

// Services
import { ImageUrlService } from '../shared/services/image-url.service';
import { RosterUpdateService } from '../store/services/roster-update.service';

// Interfaces
import { 
  ManagerState, 
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

  // Local component state
  managerState: Partial<ManagerState> = {
    selectedClub: null,
    selectedClubId: '',
    selectedSeason: '',
    selectedFreeAgents: [],
    searchTerm: '',
    notification: null
  };

  managerUserId: string | undefined;

  // Store observables
  freeAgents$: Observable<any[]>;
  clubs$: Observable<any[]>;
  seasons$: Observable<any[]>;
  selectedClub$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  rosterPlayers$: Observable<any[]>;

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private store: Store<AppState>,
    private imageUrlService: ImageUrlService,
    private rosterUpdateService: RosterUpdateService
  ) {
    // Initialize store observables
    this.freeAgents$ = this.store.select(selectFreeAgents);
    this.clubs$ = this.store.select(selectAllClubs);
    this.seasons$ = this.store.select(selectAllSeasons);
    this.selectedClub$ = this.store.select(selectSelectedClub);
    this.loading$ = this.store.select(selectUsersLoading);
    this.error$ = this.store.select(selectUsersError);
    this.rosterPlayers$ = this.store.select(selectClubRoster(''));
  }

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
          this.managerUserId = user.sub.split('|')[2]; // Get the actual Discord ID, not 'discord'
          // Dispatch actions to load data
          this.store.dispatch(UsersActions.loadCurrentUser());
          this.store.dispatch(ClubsActions.loadClubs());
          this.store.dispatch(SeasonsActions.loadSeasons());
          this.store.dispatch(UsersActions.loadFreeAgents());
          return of(null);
        }
        return of(null);
      })
    ).subscribe();
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
   * Load club data
   */
  private loadClubData(): void {
    if (this.managerState.selectedClubId) {
      this.store.dispatch(ClubsActions.loadClub({ clubId: this.managerState.selectedClubId }));
    }
  }

  /**
   * Handle season change
   */
  onSeasonChange(): void {
    console.log('Season change:', this.managerState.selectedSeason);
    
    this.managerState.selectedClub = null;
    this.managerState.selectedClubId = '';
    
    if (this.managerState.selectedSeason) {
      this.store.dispatch(ClubsActions.loadClubsBySeason({ seasonId: this.managerState.selectedSeason }));
    }
  }


  /**
   * Handle club change
   */
  onClubChange(): void {
    console.log('Club change:', this.managerState.selectedClubId);
    
    if (this.managerState.selectedClubId) {
      this.store.dispatch(ClubsActions.loadClub({ clubId: this.managerState.selectedClubId }));
      // Update roster observable for the selected club
      this.rosterPlayers$ = this.store.select(selectClubRoster(this.managerState.selectedClubId));
    } else {
      this.managerState.selectedClub = null;
      // Reset roster observable
      this.rosterPlayers$ = this.store.select(selectClubRoster(''));
    }
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    console.log('Refresh data called');
    if (this.managerUserId) {
      this.store.dispatch(UsersActions.loadCurrentUser());
      this.store.dispatch(ClubsActions.loadClubs());
      this.store.dispatch(SeasonsActions.loadSeasons());
      this.store.dispatch(UsersActions.loadFreeAgents());
    }
  }






  /**
   * Toggle free agent selection
   */
  toggleFreeAgentSelection(agentId: string): void {
    const index = this.managerState.selectedFreeAgents?.indexOf(agentId) || -1;
    if (index > -1) {
      this.managerState.selectedFreeAgents?.splice(index, 1);
    } else {
      this.managerState.selectedFreeAgents?.push(agentId);
    }
  }

  /**
   * Send signing requests
   */
  sendSigningRequests(): void {
    if (!this.managerUserId || !this.managerState.selectedClubId) return;
    
    this.store.dispatch(UsersActions.sendContractOffer({
      clubId: this.managerState.selectedClubId!,
      clubName: this.managerState.selectedClub?.name || '',
      clubLogoUrl: this.managerState.selectedClub?.logoUrl,
      userId: this.managerUserId!,
      playerName: 'Manager',
      seasonId: this.managerState.selectedSeason || '',
      seasonName: this.managerState.selectedSeason || '',
      sentBy: this.managerUserId!
    }));
  }

  /**
   * Release player
   */
  releasePlayer(playerId: string): void {
    if (!this.managerState.selectedClubId) return;
    
    this.store.dispatch(ClubsActions.removePlayerFromClub({
      clubId: this.managerState.selectedClubId!,
      userId: playerId,
      seasonId: this.managerState.selectedSeason || ''
    }));
  }

  /**
   * Get image URL
   */
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  /**
   * Show notification
   */
  showNotification(type: 'success' | 'error', message: string): void {
    this.managerState.notification = { type, message };
    setTimeout(() => this.managerState.notification = null, 5000);
  }

  // Getters for template access
  get selectedClub() { return this.managerState.selectedClub; }
  get selectedClubId() { return this.managerState.selectedClubId || ''; }
  get selectedSeason() { return this.managerState.selectedSeason || ''; }
  get selectedFreeAgents() { return this.managerState.selectedFreeAgents || []; }
  get searchTerm() { return this.managerState.searchTerm || ''; }
  get notification() { return this.managerState.notification; }

  // Setters for template binding
  set selectedClubId(value: string) { this.managerState.selectedClubId = value; }
  set selectedSeason(value: string) { this.managerState.selectedSeason = value; }
  set searchTerm(value: string) { this.managerState.searchTerm = value; }
}