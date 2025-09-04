import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../../store';

// Import selectors
import * as ClubsSelectors from '../../store/clubs.selectors';
import * as MatchesSelectors from '../../store/matches.selectors';
import * as SeasonsSelectors from '../../store/seasons.selectors';
import * as UsersSelectors from '../../store/users.selectors';
import * as PlayersSelectors from '../../store/players.selectors';

// Import actions
import * as ClubsActions from '../../store/clubs.actions';
import * as MatchesActions from '../../store/matches.actions';
import * as SeasonsActions from '../../store/seasons.actions';
import * as UsersActions from '../../store/users.actions';
import * as PlayersActions from '../../store/players.actions';

// Import the NgRx API service
import { NgRxApiService } from '../../store/services/ngrx-api.service';

/**
 * NgRx Example Component
 * 
 * This component demonstrates how to use NgRx for state management
 * in your Angular application. It shows:
 * 
 * 1. How to select data from the store using selectors
 * 2. How to dispatch actions to update state
 * 3. How to handle loading states and errors
 * 4. How to use the NgRx API service for cleaner code
 */
@Component({
  selector: 'app-ngrx-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <h2>NgRx State Management Example</h2>
      
      <!-- Loading States -->
      <div class="row mb-4">
        <div class="col-md-12">
          <h4>Loading States</h4>
          <div class="alert alert-info">
            <p><strong>Clubs Loading:</strong> {{ clubsLoading$ | async }}</p>
            <p><strong>Matches Loading:</strong> {{ matchesLoading$ | async }}</p>
            <p><strong>Seasons Loading:</strong> {{ seasonsLoading$ | async }}</p>
            <p><strong>Users Loading:</strong> {{ usersLoading$ | async }}</p>
          </div>
        </div>
      </div>

      <!-- Error States -->
      <div class="row mb-4" *ngIf="(clubsError$ | async) || (matchesError$ | async) || (seasonsError$ | async) || (usersError$ | async)">
        <div class="col-md-12">
          <h4>Error States</h4>
          <div class="alert alert-danger">
            <p *ngIf="clubsError$ | async"><strong>Clubs Error:</strong> {{ clubsError$ | async }}</p>
            <p *ngIf="matchesError$ | async"><strong>Matches Error:</strong> {{ matchesError$ | async }}</p>
            <p *ngIf="seasonsError$ | async"><strong>Seasons Error:</strong> {{ seasonsError$ | async }}</p>
            <p *ngIf="usersError$ | async"><strong>Users Error:</strong> {{ usersError$ | async }}</p>
          </div>
        </div>
      </div>

      <!-- Data Counts -->
      <div class="row mb-4">
        <div class="col-md-12">
          <h4>Data Counts</h4>
          <div class="row">
            <div class="col-md-3">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Clubs</h5>
                  <p class="card-text">{{ (clubs$ | async)?.length || 0 }} clubs</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Matches</h5>
                  <p class="card-text">{{ (matches$ | async)?.length || 0 }} matches</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Seasons</h5>
                  <p class="card-text">{{ (seasons$ | async)?.length || 0 }} seasons</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Users</h5>
                  <p class="card-text">{{ (users$ | async)?.length || 0 }} users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="row mb-4">
        <div class="col-md-12">
          <h4>Actions</h4>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-primary" (click)="loadAllData()">Load All Data</button>
            <button type="button" class="btn btn-secondary" (click)="clearAllData()">Clear All Data</button>
            <button type="button" class="btn btn-info" (click)="loadClubs()">Load Clubs</button>
            <button type="button" class="btn btn-success" (click)="loadMatches()">Load Matches</button>
            <button type="button" class="btn btn-warning" (click)="loadSeasons()">Load Seasons</button>
            <button type="button" class="btn btn-danger" (click)="loadUsers()">Load Users</button>
          </div>
        </div>
      </div>

      <!-- Sample Data Display -->
      <div class="row">
        <div class="col-md-6">
          <h4>Sample Clubs</h4>
          <div class="list-group" *ngIf="(clubs$ | async)?.length">
            <div class="list-group-item" *ngFor="let club of (clubs$ | async)?.slice(0, 5)">
              <h6 class="mb-1">{{ club.name || club.clubName }}</h6>
              <p class="mb-1">{{ club.manager }}</p>
              <small>{{ club.division }}</small>
            </div>
          </div>
          <p *ngIf="!(clubs$ | async)?.length" class="text-muted">No clubs loaded</p>
        </div>
        
        <div class="col-md-6">
          <h4>Sample Seasons</h4>
          <div class="list-group" *ngIf="(seasons$ | async)?.length">
            <div class="list-group-item" *ngFor="let season of (seasons$ | async)?.slice(0, 5)">
              <h6 class="mb-1">{{ season.name }}</h6>
              <p class="mb-1">
                <span class="badge" [class.badge-success]="season.isActive" [class.badge-secondary]="!season.isActive">
                  {{ season.isActive ? 'Active' : 'Inactive' }}
                </span>
              </p>
              <small>{{ season.startDate | date }} - {{ season.endDate | date }}</small>
            </div>
          </div>
          <p *ngIf="!(seasons$ | async)?.length" class="text-muted">No seasons loaded</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      margin-bottom: 1rem;
    }
    .btn-group .btn {
      margin-right: 0.5rem;
    }
    .badge-success {
      background-color: #28a745;
    }
    .badge-secondary {
      background-color: #6c757d;
    }
  `]
})
export class NgRxExampleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observable selectors
  clubs$: Observable<any[]>;
  clubsLoading$: Observable<boolean>;
  clubsError$: Observable<any>;

  matches$: Observable<any[]>;
  matchesLoading$: Observable<boolean>;
  matchesError$: Observable<any>;

  seasons$: Observable<any[]>;
  seasonsLoading$: Observable<boolean>;
  seasonsError$: Observable<any>;

  users$: Observable<any[]>;
  usersLoading$: Observable<boolean>;
  usersError$: Observable<any>;

  players$: Observable<any[]>;
  playersLoading$: Observable<boolean>;
  playersError$: Observable<any>;

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService
  ) {
    // Initialize selectors
    this.clubs$ = this.store.select(ClubsSelectors.selectAllClubs);
    this.clubsLoading$ = this.store.select(ClubsSelectors.selectClubsLoading);
    this.clubsError$ = this.store.select(ClubsSelectors.selectClubsError);

    this.matches$ = this.store.select(MatchesSelectors.selectAllMatches);
    this.matchesLoading$ = this.store.select(MatchesSelectors.selectMatchesLoading);
    this.matchesError$ = this.store.select(MatchesSelectors.selectMatchesError);

    this.seasons$ = this.store.select(SeasonsSelectors.selectAllSeasons);
    this.seasonsLoading$ = this.store.select(SeasonsSelectors.selectSeasonsLoading);
    this.seasonsError$ = this.store.select(SeasonsSelectors.selectSeasonsError);

    this.users$ = this.store.select(UsersSelectors.selectAllUsers);
    this.usersLoading$ = this.store.select(UsersSelectors.selectUsersLoading);
    this.usersError$ = this.store.select(UsersSelectors.selectUsersError);

    this.players$ = this.store.select(PlayersSelectors.selectAllPlayers);
    this.playersLoading$ = this.store.select(PlayersSelectors.selectPlayersLoading);
    this.playersError$ = this.store.select(PlayersSelectors.selectPlayersError);
  }

  ngOnInit(): void {
    // Load initial data
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Action methods using the NgRx API service
  loadAllData(): void {
    this.ngrxApiService.loadClubs();
    this.ngrxApiService.loadMatches();
    this.ngrxApiService.loadSeasons();
    this.ngrxApiService.loadUsers();
    this.ngrxApiService.loadPlayers();
  }

  loadClubs(): void {
    this.ngrxApiService.loadClubs();
  }

  loadMatches(): void {
    this.ngrxApiService.loadMatches();
  }

  loadSeasons(): void {
    this.ngrxApiService.loadSeasons();
  }

  loadUsers(): void {
    this.ngrxApiService.loadUsers();
  }

  clearAllData(): void {
    this.ngrxApiService.clearClubs();
    this.ngrxApiService.clearMatches();
    this.ngrxApiService.clearSeasons();
    this.ngrxApiService.clearUsers();
  }

  // Example of direct action dispatching (alternative to using the service)
  loadClubsDirect(): void {
    this.store.dispatch(ClubsActions.loadClubs());
  }

  // Example of selecting specific data
  getActiveSeason(): void {
    this.store.select(SeasonsSelectors.selectActiveSeason)
      .pipe(takeUntil(this.destroy$))
      .subscribe(activeSeason => {
        console.log('Active season:', activeSeason);
      });
  }

  // Example of selecting computed data
  getClubsByDivision(division: string): void {
    this.store.select(ClubsSelectors.selectClubsByDivision(division))
      .pipe(takeUntil(this.destroy$))
      .subscribe(clubs => {
        console.log(`Clubs in ${division}:`, clubs);
      });
  }
}
