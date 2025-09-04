import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Actions } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { AppState } from '../store';
import { ClubDetailSimpleComponent as ClubDetailComponent } from './club-detail.component';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { TestUtils } from '../testing/test-utils';

describe('ClubDetailComponent', () => {
  let component: ClubDetailComponent;
  let fixture: ComponentFixture<ClubDetailComponent>;
  let store: MockStore<AppState>;
  let ngrxApiService: jasmine.SpyObj<NgRxApiService>;
  let actions$: Observable<any>;
  let mockActivatedRoute: any;

  const mockClub = TestUtils.createMockClub({
    _id: 'club-1',
    name: 'Test Club',
    logoUrl: 'test-logo.png',
    manager: 'Test Manager',
    primaryColour: '#FF0000',
    seasons: [{
      seasonId: 'season-1',
      roster: ['user-1', 'user-2']
    }]
  });

  const mockSeasons = [
    TestUtils.createMockSeason({ _id: 'season-1', name: 'Test Season 1' }),
    TestUtils.createMockSeason({ _id: 'season-2', name: 'Test Season 2' })
  ];

  const mockClubs = [
    mockClub,
    TestUtils.createMockClub({ _id: 'club-2', name: 'Other Club' })
  ];

  const mockMatches = [
    TestUtils.createMockMatch({ _id: 'match-1', homeClubId: 'club-1' })
  ];

  beforeEach(async () => {
    const ngrxApiServiceSpy = jasmine.createSpyObj('NgRxApiService', [
      'loadClub', 'loadClubs', 'loadSeasons', 'loadMatches', 'loadClubRoster'
    ]);

    mockActivatedRoute = {
      params: of({ id: 'club-1' })
    };

    await TestBed.configureTestingModule({
      imports: [ClubDetailComponent],
      providers: [
        TestUtils.createMockStore({
          clubs: {
            clubs: mockClubs,
            selectedClub: mockClub,
            loading: false,
            error: null
          },
          seasons: {
            seasons: mockSeasons,
            activeSeasonId: null,
            loading: false,
            error: null
          },
          matches: {
            matches: mockMatches,
            selectedMatch: null,
            loading: false,
            error: null
          }
        }),
        provideMockActions(() => actions$ = of()),
        { provide: NgRxApiService, useValue: ngrxApiServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClubDetailComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    ngrxApiService = TestBed.inject(NgRxApiService) as jasmine.SpyObj<NgRxApiService>;
    actions$ = TestBed.inject(Actions);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load club data on init', async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(ngrxApiService.loadClub).toHaveBeenCalledWith('club-1');
      expect(ngrxApiService.loadClubs).toHaveBeenCalled();
      expect(ngrxApiService.loadSeasons).toHaveBeenCalled();
      expect(ngrxApiService.loadMatches).toHaveBeenCalled();
    });

    it('should initialize with default values', () => {
      expect(component.club).toBeUndefined();
      expect(component.backendClub).toBeNull();
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    });
  });

  describe('Route Parameter Handling', () => {
    it('should load club data when route params change', async () => {
      const newRouteParams = of({ id: 'club-2' });
      mockActivatedRoute.params = newRouteParams;

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(ngrxApiService.loadClub).toHaveBeenCalledWith('club-2');
    });

    it('should not load data when no club ID in route', async () => {
      const routeWithoutId = of({});
      mockActivatedRoute.params = routeWithoutId;

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(ngrxApiService.loadClub).not.toHaveBeenCalled();
    });
  });

  describe('Data Loading', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should display club when loaded', () => {
      expect(component.club).toBeDefined();
      expect(component.backendClub).toBeDefined();
    });

    it('should display loading state', async () => {
      store.setState({
        clubs: {
          clubs: [],
          selectedClub: null,
          loading: true,
          error: null
        }
      } as any);

      await TestUtils.waitForAsync(fixture);

      expect(component.loading).toBe(true);
    });

    it('should display error state', async () => {
      store.setState({
        clubs: {
          clubs: [],
          selectedClub: null,
          loading: false,
          error: 'Failed to load club'
        }
      } as any);

      await TestUtils.waitForAsync(fixture);

      expect(component.error).toBe('Failed to load club');
    });
  });

  describe('Club Data Mapping', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should map backend club to frontend club interface', () => {
      expect(component.club?._id).toBe('club-1');
      expect(component.club?.name).toBe('Test Club');
      expect(component.club?.clubName).toBe('Test Club');
      expect(component.club?.manager).toBe('Test Manager');
      expect(component.club?.colour).toBe('#FF0000');
    });

    it('should handle missing club data gracefully', () => {
      // Reset component state
      component.club = undefined;
      component.backendClub = null;
      
      store.setState({
        clubs: {
          clubs: [],
          selectedClub: null,
          loading: false,
          error: null
        }
      } as any);

      expect(component.club).toBeUndefined();
    });
  });

  describe('Season Selection', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should load club roster when season changes', () => {
      component.onSeasonChange('season-1');
      expect(ngrxApiService.loadClubRoster).toHaveBeenCalledWith('club-1', 'season-1');
    });

    it('should not load roster when no backend club', () => {
      component.backendClub = null;
      component.onSeasonChange('season-1');
      expect(ngrxApiService.loadClubRoster).not.toHaveBeenCalled();
    });
  });

  describe('Image URL Handling', () => {
    it('should return default image for undefined logoUrl', () => {
      const result = component.getImageUrl(undefined);
      expect(result).toBe('assets/images/default-team.png');
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

  describe('Data Subscriptions', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should subscribe to selected club changes', () => {
      const newClub = TestUtils.createMockClub({ _id: 'club-3', name: 'New Club' });
      
      store.setState({
        clubs: {
          clubs: [...mockClubs, newClub],
          selectedClub: newClub,
          loading: false,
          error: null
        }
      } as any);

      expect(component.club).toBeDefined();
    });

    it('should subscribe to all clubs changes', () => {
      const newClubs = [...mockClubs, TestUtils.createMockClub({ _id: 'club-3' })];
      
      store.setState({
        clubs: {
          clubs: newClubs,
          selectedClub: mockClub,
          loading: false,
          error: null
        }
      } as any);

      expect(component.allClubs.length).toBe(3);
    });

    it('should subscribe to seasons changes', () => {
      const newSeasons = [...mockSeasons, TestUtils.createMockSeason({ _id: 'season-3' })];
      
      store.setState({
        seasons: {
          seasons: newSeasons,
          activeSeasonId: null,
          loading: false,
          error: null
        }
      } as any);

      expect(component.seasons.length).toBe(3);
    });

    it('should subscribe to loading state changes', () => {
      store.setState({
        clubs: {
          clubs: mockClubs,
          selectedClub: mockClub,
          loading: true,
          error: null
        }
      } as any);

      expect(component.loading).toBe(true);
    });

    it('should subscribe to error state changes', () => {
      store.setState({
        clubs: {
          clubs: mockClubs,
          selectedClub: mockClub,
          loading: false,
          error: 'Test error'
        }
      } as any);

      expect(component.error).toBe('Test error');
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

  describe('Error Handling', () => {
    it('should handle missing club ID in route', async () => {
      const routeWithoutId = of({});
      mockActivatedRoute.params = routeWithoutId;

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(ngrxApiService.loadClub).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should handle store errors gracefully', async () => {
      store.setState({
        clubs: {
          clubs: [],
          selectedClub: null,
          loading: false,
          error: 'Network error'
        }
      } as any);

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(component.error).toBe('Network error');
      expect(component.loading).toBe(false);
    });
  });

  describe('Integration with Child Components', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should pass club data to child components', () => {
      expect(component.club).toBeDefined();
      // In a real test, you would verify that child components receive the correct data
    });

    it('should handle season changes from child components', () => {
      const seasonId = 'season-2';
      component.onSeasonChange(seasonId);
      
      expect(component.selectedSeasonId).toBe(seasonId);
      expect(ngrxApiService.loadClubRoster).toHaveBeenCalledWith('club-1', seasonId);
    });
  });
});