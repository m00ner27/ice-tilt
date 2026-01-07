import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import actions and selectors
import * as ClubsActions from '../../store/clubs.actions';
import * as MatchesActions from '../../store/matches.actions';
import * as SeasonsActions from '../../store/seasons.actions';
import * as UsersActions from '../../store/users.actions';

import { selectAllClubs, selectClubsLoading, selectClubsError } from '../../store/clubs.selectors';
import { selectAllMatches, selectMatchesLoading, selectMatchesError } from '../../store/matches.selectors';
import { selectAllSeasons, selectSeasonsLoading, selectSeasonsError } from '../../store/seasons.selectors';
import { selectAllUsers, selectUsersLoading, selectUsersError } from '../../store/users.selectors';

/**
 * NgRx Example Component
 * 
 * This component demonstrates:
 * 1. How to select data from the store using selectors
 * 2. How to dispatch actions to update state
 * 3. How to handle loading states and errors
 * 4. How to use the NgRx API service for cleaner code
 */
@Component({
  selector: 'app-ngrx-example',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ngrx-example.component.html'
})
export class NgRxExampleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observable selectors
  clubs$: Observable<any[]>;
  matches$: Observable<any[]>;
  seasons$: Observable<any[]>;
  users$: Observable<any[]>;

  // Loading states
  clubsLoading$: Observable<boolean>;
  matchesLoading$: Observable<boolean>;
  seasonsLoading$: Observable<boolean>;
  usersLoading$: Observable<boolean>;

  // Error states
  clubsError$: Observable<any>;
  matchesError$: Observable<any>;
  seasonsError$: Observable<any>;
  usersError$: Observable<any>;

  constructor(private store: Store) {
    // Initialize selectors
    this.clubs$ = this.store.select(selectAllClubs);
    this.matches$ = this.store.select(selectAllMatches);
    this.seasons$ = this.store.select(selectAllSeasons);
    this.users$ = this.store.select(selectAllUsers);

    // Initialize loading states
    this.clubsLoading$ = this.store.select(selectClubsLoading);
    this.matchesLoading$ = this.store.select(selectMatchesLoading);
    this.seasonsLoading$ = this.store.select(selectSeasonsLoading);
    this.usersLoading$ = this.store.select(selectUsersLoading);

    // Initialize error states
    this.clubsError$ = this.store.select(selectClubsError);
    this.matchesError$ = this.store.select(selectMatchesError);
    this.seasonsError$ = this.store.select(selectSeasonsError);
    this.usersError$ = this.store.select(selectUsersError);
  }

  ngOnInit() {
    // Load initial data
    this.loadAllData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Action methods
  loadAllData() {
    this.store.dispatch(ClubsActions.loadClubs());
    this.store.dispatch(MatchesActions.loadMatches());
    this.store.dispatch(SeasonsActions.loadSeasons());
    this.store.dispatch(UsersActions.loadUsers());
  }

  clearAllData() {
    this.store.dispatch(ClubsActions.clearClubs());
    this.store.dispatch(MatchesActions.clearMatches());
    this.store.dispatch(SeasonsActions.clearSeasons());
    this.store.dispatch(UsersActions.clearUsers());
  }

  loadClubs() {
    this.store.dispatch(ClubsActions.loadClubs());
  }

  loadMatches() {
    this.store.dispatch(MatchesActions.loadMatches());
  }

  loadSeasons() {
    this.store.dispatch(SeasonsActions.loadSeasons());
  }

  loadUsers() {
    this.store.dispatch(UsersActions.loadUsers());
  }
}
