import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Actions } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { AppState } from '../store';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';

/**
 * Test utilities for NgRx components
 */
export class TestUtils {
  /**
   * Common mock providers for tests
   */
  static getCommonMockProviders() {
    return [
      {
        provide: ActivatedRoute,
        useValue: {
          params: of({}),
          queryParams: of({}),
          snapshot: {
            params: {},
            queryParams: {},
            url: [],
            fragment: null,
            data: {}
          }
        }
      },
      {
        provide: HttpClient,
        useValue: {
          get: jasmine.createSpy('get').and.returnValue(of([])),
          post: jasmine.createSpy('post').and.returnValue(of({})),
          put: jasmine.createSpy('put').and.returnValue(of({})),
          delete: jasmine.createSpy('delete').and.returnValue(of({})),
          patch: jasmine.createSpy('patch').and.returnValue(of({}))
        }
      },
      {
        provide: AuthService,
        useValue: {
          user$: of(null),
          isLoading$: of(false),
          isAuthenticated$: of(false),
          getAccessTokenSilently: jasmine.createSpy('getAccessTokenSilently').and.returnValue(of('mock-token')),
          loginWithRedirect: jasmine.createSpy('loginWithRedirect'),
          logout: jasmine.createSpy('logout')
        }
      }
    ];
  }
  /**
   * Create a mock store with initial state
   */
  static createMockStore(initialState: Partial<AppState> = {}) {
    const defaultState: AppState = {
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
        clubRosters: {},
        globalRosters: {},
        loading: false,
        error: null,
        uploadLoading: false,
        uploadError: null
      },
      matches: {
        matches: [],
        selectedMatch: null,
        eashlData: {},
        loading: false,
        error: null,
        statsLoading: false,
        statsError: null
      },
      seasons: {
        seasons: [],
        activeSeason: null,
        loading: false,
        error: null
      },
      users: {
        users: [],
        selectedUser: null,
        currentUser: {
          _id: 'user-1',
          auth0Id: 'auth0|123456789',
          email: 'test@example.com',
          name: 'Test User',
          playerName: 'Test Player',
          position: 'C',
          clubId: null,
          clubName: null,
          seasonId: 'season-1',
          seasonName: 'Test Season'
        },
        freeAgents: [],
        inboxOffers: [],
        loading: false,
        error: null,
        offersLoading: false,
        offersError: null
      },
      divisions: {
        divisions: [],
        loading: false,
        error: null
      },
      ...initialState
    };

    return provideMockStore({ initialState: defaultState });
  }

  /**
   * Create mock actions observable
   */
  static createMockActions(): Observable<any> {
    return of();
  }

  /**
   * Setup component with NgRx dependencies
   */
  static setupComponentWithStore<T>(
    component: any,
    initialState: Partial<AppState> = {}
  ): ComponentFixture<T> {
    TestBed.configureTestingModule({
      imports: [component],
      providers: [
        TestUtils.createMockStore(initialState),
        provideMockActions(() => TestUtils.createMockActions())
      ]
    });

    return TestBed.createComponent<T>(component);
  }

  /**
   * Get mock store from TestBed
   */
  static getMockStore(): MockStore<AppState> {
    return TestBed.inject(MockStore);
  }

  /**
   * Dispatch action to mock store
   */
  static dispatchAction(store: MockStore<AppState>, action: any) {
    store.dispatch(action);
  }

  /**
   * Set store state
   */
  static setStoreState(store: MockStore<AppState>, state: Partial<AppState>) {
    // MockStore doesn't have getState method, so we just set the state directly
    store.setState(state as AppState);
  }

  /**
   * Create mock club data
   */
  static createMockClub(overrides: any = {}) {
    return {
      _id: 'club-1',
      name: 'Test Club',
      logoUrl: 'test-logo.png',
      manager: 'Test Manager',
      primaryColour: '#FF0000',
      seasons: [],
      roster: [],
      ...overrides
    };
  }

  /**
   * Create mock player data
   */
  static createMockPlayer(overrides: any = {}) {
    return {
      id: 'player-1',
      discordUsername: 'TestPlayer',
      position: 'C',
      secondaryPositions: ['LW', 'RW'],
      number: '12',
      psnId: 'test-psn',
      xboxGamertag: '',
      gamertag: 'test-gamertag',
      country: 'USA',
      handedness: 'Left',
      currentClubId: 'club-1',
      currentClubName: 'Test Club',
      status: 'Signed' as const,
      lastActive: new Date().toISOString(),
      stats: {},
      clubLogo: 'test-logo.png',
      userId: 'user-1',
      userGamertag: 'test-gamertag',
      ...overrides
    };
  }

  /**
   * Create mock match data
   */
  static createMockMatch(overrides: any = {}) {
    return {
      _id: 'match-1',
      homeTeam: 'Home Team',
      awayTeam: 'Away Team',
      homeScore: 3,
      awayScore: 2,
      date: new Date().toISOString(),
      seasonId: 'season-1',
      divisionId: 'division-1',
      homeClubId: 'club-1',
      awayClubId: 'club-2',
      ...overrides
    };
  }

  /**
   * Create mock season data
   */
  static createMockSeason(overrides: any = {}) {
    return {
      _id: 'season-1',
      name: 'Test Season',
      startDate: new Date('2024-01-01').toISOString(),
      endDate: new Date('2024-12-31').toISOString(),
      ...overrides
    };
  }

  /**
   * Create mock user data
   */
  static createMockUser(overrides: any = {}) {
    return {
      _id: 'user-1',
      discordUsername: 'TestUser',
      gamertag: 'test-gamertag',
      psnId: 'test-psn',
      platform: 'PS5',
      playerProfile: {
        position: 'C',
        number: '12',
        country: 'USA',
        handedness: 'Left',
        secondaryPositions: ['LW', 'RW']
      },
      ...overrides
    };
  }

  /**
   * Create mock division data
   */
  static createMockDivision(overrides: any = {}) {
    return {
      _id: 'division-1',
      name: 'Test Division',
      seasonId: 'season-1',
      logoUrl: 'division-logo.png',
      ...overrides
    };
  }

  /**
   * Create mock offer data
   */
  static createMockOffer(overrides: any = {}) {
    return {
      _id: 'offer-1',
      clubId: 'club-1',
      clubName: 'Test Club',
      clubLogoUrl: 'test-logo.png',
      userId: 'user-1',
      playerName: 'Test Player',
      seasonId: 'season-1',
      seasonName: 'Test Season',
      sentBy: 'manager-1',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Wait for async operations to complete
   */
  static async waitForAsync(fixture: ComponentFixture<any>) {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  /**
   * Trigger component input changes
   */
  static triggerInputChange(fixture: ComponentFixture<any>, inputName: string, value: any) {
    const component = fixture.componentInstance;
    component[inputName] = value;
    fixture.detectChanges();
  }

  /**
   * Get element by test id
   */
  static getByTestId(fixture: ComponentFixture<any>, testId: string) {
    return fixture.debugElement.nativeElement.querySelector(`[data-testid="${testId}"]`);
  }

  /**
   * Get all elements by test id
   */
  static getAllByTestId(fixture: ComponentFixture<any>, testId: string) {
    return fixture.debugElement.nativeElement.querySelectorAll(`[data-testid="${testId}"]`);
  }

  /**
   * Simulate user input
   */
  static simulateInput(fixture: ComponentFixture<any>, selector: string, value: string) {
    const input = fixture.debugElement.nativeElement.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  /**
   * Simulate button click
   */
  static simulateClick(fixture: ComponentFixture<any>, selector: string) {
    const button = fixture.debugElement.nativeElement.querySelector(selector);
    button.click();
    fixture.detectChanges();
  }
}
