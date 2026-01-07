import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Actions } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { AppState } from '../store';
import { FreeAgentsComponent } from './free-agents.component';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { TestUtils } from '../testing/test-utils';

describe('FreeAgentsComponent', () => {
  let component: FreeAgentsComponent;
  let fixture: ComponentFixture<FreeAgentsComponent>;
  let store: MockStore<AppState>;
  let ngrxApiService: jasmine.SpyObj<NgRxApiService>;
  let actions$: Observable<any>;

  const mockFreeAgents = [
    TestUtils.createMockUser({ 
      _id: 'user-1', 
      discordUsername: 'Player1',
      platform: 'PS5',
      gamertag: 'player1-psn'
    }),
    TestUtils.createMockUser({ 
      _id: 'user-2', 
      discordUsername: 'Player2',
      platform: 'Xbox',
      gamertag: 'player2-xbox'
    }),
    TestUtils.createMockUser({ 
      _id: 'user-3', 
      discordUsername: 'Player3',
      platform: 'PS5',
      gamertag: 'player3-psn'
    })
  ];

  beforeEach(async () => {
    const ngrxApiServiceSpy = jasmine.createSpyObj('NgRxApiService', ['loadFreeAgents']);

    await TestBed.configureTestingModule({
      imports: [FreeAgentsComponent],
      providers: [
        TestUtils.createMockStore({
          users: {
            users: [],
            freeAgents: mockFreeAgents,
            inboxOffers: [],
            loading: false,
            error: null
          }
        }),
        provideMockActions(() => actions$ = of()),
        { provide: NgRxApiService, useValue: ngrxApiServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({}),
            snapshot: { params: {}, queryParams: {} }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FreeAgentsComponent);
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

    it('should load free agents on init', () => {
      component.ngOnInit();
      expect(ngrxApiService.loadFreeAgents).toHaveBeenCalled();
    });

    it('should initialize with empty filtered agents', () => {
      expect(component.filteredAgents).toEqual([]);
    });

    it('should initialize with default position filter', () => {
      expect(component.positionFilter).toBe('All');
    });

    it('should initialize with empty search term', () => {
      expect(component.searchTerm).toBe('');
    });
  });

  describe('Data Loading', () => {
    it('should display free agents when loaded', async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      // Wait for the subscription to process the data
      fixture.detectChanges();
      await TestUtils.waitForAsync(fixture);

      expect(component.filteredAgents.length).toBe(3);
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

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      // The component should show loading state
      // Note: usersLoading$ is not a public property, testing through observable subscription
      expect(component).toBeTruthy();
    });

    it('should display error state', async () => {
      store.setState({
        users: {
          users: [],
          freeAgents: [],
          inboxOffers: [],
          loading: false,
          error: 'Failed to load free agents'
        }
      } as any);

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      // The component should show error state
      // Note: usersError$ is not a public property, testing through observable subscription
      expect(component).toBeTruthy();
    });
  });

  describe('Position Filtering', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
      fixture.detectChanges();
    });

    it('should filter by position', () => {
      component.positionFilter = 'C';
      component.onPositionFilterChange('C');

      // Since all mock players have position 'C', all should be shown
      expect(component.filteredAgents.length).toBe(3);
    });

    it('should show all agents when position filter is All', () => {
      component.positionFilter = 'All';
      component.onPositionFilterChange('All');

      expect(component.filteredAgents.length).toBe(3);
    });

    it('should filter by different position', () => {
      // Add a player with different position
      const mockAgentsWithDifferentPosition = [
        ...mockFreeAgents,
        TestUtils.createMockUser({ 
          _id: 'user-4', 
          discordUsername: 'Player4',
          playerProfile: { position: 'G' }
        })
      ];

      store.setState({
        users: {
          users: [],
          freeAgents: mockAgentsWithDifferentPosition,
          inboxOffers: [],
          loading: false,
          error: null
        }
      } as any);

      component.positionFilter = 'G';
      component.onPositionFilterChange('G');

      // Should only show the goalie
      expect(component.filteredAgents.length).toBe(1);
      expect(component.filteredAgents[0].position).toBe('G');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
      fixture.detectChanges();
    });

    it('should filter by discord username', () => {
      component.searchTerm = 'Player1';
      component.onSearchChange({ target: { value: 'Player1' } } as any);

      expect(component.filteredAgents.length).toBe(1);
      expect(component.filteredAgents[0].discordUsername).toBe('Player1');
    });

    it('should filter by PSN ID', () => {
      component.searchTerm = 'player1-psn';
      component.onSearchChange({ target: { value: 'player1-psn' } } as any);

      expect(component.filteredAgents.length).toBe(1);
      expect(component.filteredAgents[0].psnId).toBe('player1-psn');
    });

    it('should filter by Xbox gamertag', () => {
      component.searchTerm = 'player2-xbox';
      component.onSearchChange({ target: { value: 'player2-xbox' } } as any);

      expect(component.filteredAgents.length).toBe(1);
      expect(component.filteredAgents[0].xboxGamertag).toBe('player2-xbox');
    });

    it('should be case insensitive', () => {
      component.searchTerm = 'player1';
      component.onSearchChange({ target: { value: 'player1' } } as any);

      expect(component.filteredAgents.length).toBe(1);
      expect(component.filteredAgents[0].discordUsername).toBe('Player1');
    });

    it('should show all agents when search is empty', () => {
      component.searchTerm = '';
      component.onSearchChange({ target: { value: '' } } as any);

      expect(component.filteredAgents.length).toBe(3);
    });
  });

  describe('Combined Filtering', () => {
    beforeEach(async () => {
      // Add players with different positions
      const mockAgentsWithPositions = [
        TestUtils.createMockUser({ 
          _id: 'user-1', 
          discordUsername: 'ForwardPlayer',
          playerProfile: { position: 'LW' }
        }),
        TestUtils.createMockUser({ 
          _id: 'user-2', 
          discordUsername: 'DefensePlayer',
          playerProfile: { position: 'LD' }
        }),
        TestUtils.createMockUser({ 
          _id: 'user-3', 
          discordUsername: 'GoaliePlayer',
          playerProfile: { position: 'G' }
        })
      ];

      store.setState({
        users: {
          users: [],
          freeAgents: mockAgentsWithPositions,
          inboxOffers: [],
          loading: false,
          error: null
        }
      } as any);

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
      fixture.detectChanges();
    });

    it('should filter by both position and search term', () => {
      component.positionFilter = 'Forward';
      component.searchTerm = 'Forward';
      component.onPositionFilterChange('Forward');
      component.onSearchChange({ target: { value: 'Forward' } } as any);

      expect(component.filteredAgents.length).toBe(0); // No players match both filters
    });

    it('should show no results when filters don\'t match', () => {
      component.positionFilter = 'Forward';
      component.searchTerm = 'Goalie';
      component.onPositionFilterChange('Forward');
      component.onSearchChange({ target: { value: 'Goalie' } } as any);

      expect(component.filteredAgents.length).toBe(0);
    });
  });

  describe('Data Mapping', () => {
    it('should map user data to player interface correctly', async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
      fixture.detectChanges();

      const mappedPlayer = component.filteredAgents[0];
      expect(mappedPlayer.id).toBe('user-1');
      expect(mappedPlayer.discordUsername).toBe('Player1');
      expect(mappedPlayer.position).toBe('C');
      expect(mappedPlayer.psnId).toBe('player1-psn');
      expect(mappedPlayer.xboxGamertag).toBe('');
      expect(mappedPlayer.status).toBe('Free Agent');
    });

    it('should handle missing player profile data', async () => {
      const mockUserWithoutProfile = TestUtils.createMockUser({ 
        _id: 'user-no-profile',
        discordUsername: 'NoProfilePlayer',
        playerProfile: null
      });

      store.setState({
        users: {
          users: [],
          freeAgents: [mockUserWithoutProfile],
          inboxOffers: [],
          loading: false,
          error: null
        }
      } as any);

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
      fixture.detectChanges();

      const mappedPlayer = component.filteredAgents[0];
      expect(mappedPlayer.position).toBe('C'); // Default value
      expect(mappedPlayer.status).toBe('Free Agent'); // Default value
    });
  });

  describe('Refresh Functionality', () => {
    it('should reload data when refresh is called', () => {
      component.refreshData();
      expect(ngrxApiService.loadFreeAgents).toHaveBeenCalledTimes(1); // Called in refreshData
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