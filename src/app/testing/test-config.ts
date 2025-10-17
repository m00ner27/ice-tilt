import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Actions } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { AppState } from '../store';
import { TestUtils } from './test-utils';

/**
 * Test configuration utilities for NgRx components
 */
export class TestConfig {
  /**
   * Configure TestBed with NgRx dependencies
   */
  static configureTestBed(
    component: any,
    initialState: Partial<AppState> = {},
    additionalProviders: any[] = []
  ) {
    return TestBed.configureTestingModule({
      imports: [component],
      providers: [
        TestUtils.createMockStore(initialState),
        provideMockActions(() => of()),
        ...additionalProviders
      ]
    });
  }

  /**
   * Get mock store from TestBed
   */
  static getMockStore(): MockStore<AppState> {
    return TestBed.inject(MockStore);
  }

  /**
   * Get mock actions from TestBed
   */
  static getMockActions(): Observable<any> {
    return TestBed.inject(Actions);
  }

  /**
   * Create default test state
   */
  static createDefaultState(overrides: Partial<AppState> = {}): Partial<AppState> {
    return {
      counter: 0,
      players: {
        players: [],
        loading: false,
        error: null,
        currentProfile: null
      },
      clubs: {
        clubs: [],
        selectedClub: null,
        loading: false,
        error: null
      },
      matches: {
        matches: [],
        selectedMatch: null,
        loading: false,
        error: null
      },
      seasons: {
        seasons: [],
        activeSeasonId: null,
        loading: false,
        error: null
      },
      users: {
        users: [],
        freeAgents: [],
        inboxOffers: [],
        loading: false,
        error: null
      },
      divisions: {
        divisions: [],
        loading: false,
        error: null
      },
      ...overrides
    };
  }

  /**
   * Create test state with clubs
   */
  static createStateWithClubs(clubs: any[] = []): Partial<AppState> {
    return this.createDefaultState({
      clubs: {
        clubs,
        selectedClub: clubs[0] || null,
        loading: false,
        error: null
      }
    });
  }

  /**
   * Create test state with users
   */
  static createStateWithUsers(users: any[] = []): Partial<AppState> {
    return this.createDefaultState({
      users: {
        users,
        freeAgents: users,
        inboxOffers: [],
        loading: false,
        error: null
      }
    });
  }

  /**
   * Create test state with matches
   */
  static createStateWithMatches(matches: any[] = []): Partial<AppState> {
    return this.createDefaultState({
      matches: {
        matches,
        selectedMatch: matches[0] || null,
        loading: false,
        error: null
      }
    });
  }

  /**
   * Create test state with seasons
   */
  static createStateWithSeasons(seasons: any[] = []): Partial<AppState> {
    return this.createDefaultState({
      seasons: {
        seasons,
        activeSeasonId: seasons[0]?._id || null,
        loading: false,
        error: null
      }
    });
  }

  /**
   * Create test state with divisions
   */
  static createStateWithDivisions(divisions: any[] = []): Partial<AppState> {
    return this.createDefaultState({
      divisions: {
        divisions,
        loading: false,
        error: null
      }
    });
  }

  /**
   * Create loading state
   */
  static createLoadingState(feature: keyof AppState): Partial<AppState> {
    const state = this.createDefaultState();
    if (state[feature] && typeof state[feature] === 'object') {
      (state[feature] as any).loading = true;
    }
    return state;
  }

  /**
   * Create error state
   */
  static createErrorState(feature: keyof AppState, error: string): Partial<AppState> {
    const state = this.createDefaultState();
    if (state[feature] && typeof state[feature] === 'object') {
      (state[feature] as any).error = error;
    }
    return state;
  }
}
