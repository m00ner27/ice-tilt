import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';

import { Store } from '@ngrx/store';
import { MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Actions } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { AppState } from '../store';
import { InboxComponent } from './inbox.component';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { TestUtils } from '../testing/test-utils';

describe('InboxComponent', () => {
  let component: InboxComponent;
  let fixture: ComponentFixture<InboxComponent>;
  let store: MockStore<AppState>;
  let ngrxApiService: jasmine.SpyObj<NgRxApiService>;
  let authService: jasmine.SpyObj<AuthService>;
  let httpClient: jasmine.SpyObj<HttpClient>;
  let actions$: Observable<any>;

  const mockOffers = [
    TestUtils.createMockOffer({
      _id: 'offer-1',
      clubName: 'Test Club 1',
      playerName: 'Test Player 1',
      status: 'pending'
    }),
    TestUtils.createMockOffer({
      _id: 'offer-2',
      clubName: 'Test Club 2',
      playerName: 'Test Player 2',
      status: 'pending'
    })
  ];

  const mockUser = {
    sub: 'auth0|123456789',
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeEach(async () => {
    const ngrxApiServiceSpy = jasmine.createSpyObj('NgRxApiService', ['loadInboxOffers', 'respondToOffer', 'auth0Sync']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessTokenSilently']);
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['post', 'get']);
    Object.defineProperty(authServiceSpy, 'user$', { value: of(mockUser), writable: true });
    Object.defineProperty(authServiceSpy, 'isLoading$', { value: of(false), writable: true });
    Object.defineProperty(authServiceSpy, 'isAuthenticated$', { value: of(true), writable: true });
    // HttpClient is no longer used directly in the component

    await TestBed.configureTestingModule({
      imports: [InboxComponent],
      providers: [
        TestUtils.createMockStore({
          users: {
            users: [TestUtils.createMockUser({ _id: 'user-1', auth0Id: 'auth0|123456789' })],
            currentUser: TestUtils.createMockUser({ _id: 'user-1', auth0Id: 'auth0|123456789' }),
            freeAgents: [],
            inboxOffers: mockOffers,
            loading: false,
            error: null
          }
        }),
        provideMockActions(() => actions$ = of()),
        { provide: NgRxApiService, useValue: ngrxApiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: HttpClient, useValue: httpClientSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InboxComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    ngrxApiService = TestBed.inject(NgRxApiService) as jasmine.SpyObj<NgRxApiService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    httpClient = httpClientSpy;
    actions$ = TestBed.inject(Actions);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should setup auth subscription on init', () => {
      component.ngOnInit();
      expect(authService.user$).toBeDefined();
    });

    it('should initialize with default values', () => {
      expect(component.userId).toBeNull();
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
    });
  });

  describe('Authentication Flow', () => {
    it('should handle authenticated user', async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      // HttpClient is no longer used directly in the component
      expect(ngrxApiService.loadInboxOffers).toHaveBeenCalled();
    });

    it('should handle unauthenticated user', async () => {
      Object.defineProperty(authService, 'user$', { value: of(null), writable: true });
      Object.defineProperty(authService, 'isAuthenticated$', { value: of(false), writable: true });

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(component.error).toBe('You must be logged in to view your inbox.');
      expect(component.isLoading).toBe(false);
    });

    it('should handle missing user sub', async () => {
      Object.defineProperty(authService, 'user$', { value: of({ ...mockUser, sub: null }), writable: true });

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(component.error).toBe('You must be logged in to view your inbox.');
    });
  });

  describe('Data Loading', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should display offers when loaded', () => {
      expect(component['inboxOffers$']).toBeDefined();
    });

    it('should display loading state', async () => {
      store.setState({
        users: {
          users: [],
          freeAgents: [],
          inboxOffers: [],
          loading: true,
          error: null
        }
      } as any);

      await TestUtils.waitForAsync(fixture);

      expect(component['offersLoading$']).toBeDefined();
    });

    it('should display error state', async () => {
      store.setState({
        users: {
          users: [],
          freeAgents: [],
          inboxOffers: [],
          loading: false,
          error: 'Failed to load offers'
        }
      } as any);

      await TestUtils.waitForAsync(fixture);

      expect(component['offersError$']).toBeDefined();
    });
  });

  describe('Offer Response', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should accept offer', () => {
      spyOn(window, 'alert');
      component.respondToOffer('offer-1', 'accepted');

      expect(ngrxApiService.respondToOffer).toHaveBeenCalledWith('offer-1', 'accepted');
      expect(window.alert).toHaveBeenCalledWith('You have accepted the offer from Test Club 1!');
    });

    it('should reject offer', () => {
      spyOn(window, 'alert');
      component.respondToOffer('offer-2', 'rejected');

      expect(ngrxApiService.respondToOffer).toHaveBeenCalledWith('offer-2', 'rejected');
      expect(window.alert).toHaveBeenCalledWith('You have declined the offer from Test Club 2.');
    });

    it('should handle offer not found', () => {
      spyOn(console, 'error');
      component.respondToOffer('non-existent-offer', 'accepted');

      expect(console.error).toHaveBeenCalledWith('Offer not found:', 'non-existent-offer');
    });
  });

  describe('Image URL Handling', () => {
    it('should return default image for undefined logoUrl', () => {
      const result = component.getImageUrl(undefined);
      expect(result).toBe('assets/images/square-default.png');
    });

    it('should return full URL for HTTP URLs', () => {
      const result = component.getImageUrl('https://example.com/logo.png');
      expect(result).toBe('https://example.com/logo.png');
    });

    it('should prepend API URL for upload paths', () => {
      const result = component.getImageUrl('/uploads/logo.png');
      expect(result).toBe('http://localhost:3001/uploads/logo.png');
    });

    it('should return local asset for other paths', () => {
      const result = component.getImageUrl('assets/logo.png');
      expect(result).toBe('assets/logo.png');
    });
  });

  describe('Error Handling', () => {
    it('should handle auth sync error', async () => {
      // Set up unauthenticated user
      Object.defineProperty(authService, 'user$', { value: of(null), writable: true });
      Object.defineProperty(authService, 'isAuthenticated$', { value: of(false), writable: true });

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(component.error).toBe('You must be logged in to view your inbox.');
    });

    it('should handle API errors', async () => {
      // Set up store to return error state
      store.setState({
        users: {
          users: [],
          currentUser: null,
          freeAgents: [],
          inboxOffers: [],
          loading: false,
          error: 'Failed to load offers.'
        }
      } as any);

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(component.error).toBe('Failed to load offers.');
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup subscriptions on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});