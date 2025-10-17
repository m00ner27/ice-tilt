import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Actions } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { AppState } from '../store';
import { PlayersComponent } from './players.component';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { TestUtils } from '../testing/test-utils';

describe('PlayersComponent', () => {
  let component: PlayersComponent;
  let fixture: ComponentFixture<PlayersComponent>;
  let store: MockStore<AppState>;
  let ngrxApiService: jasmine.SpyObj<NgRxApiService>;
  let actions$: Observable<any>;

  const mockUsers = [
    TestUtils.createMockUser({ 
      _id: 'user-1', 
      discordUsername: 'ForwardPlayer',
      playerProfile: { position: 'LW', country: 'USA' }
    }),
    TestUtils.createMockUser({ 
      _id: 'user-2', 
      discordUsername: 'DefensePlayer',
      playerProfile: { position: 'LD', country: 'Canada' }
    }),
    TestUtils.createMockUser({ 
      _id: 'user-3', 
      discordUsername: 'GoaliePlayer',
      playerProfile: { position: 'G', country: 'Sweden' }
    })
  ];

  const mockClubs = [
    TestUtils.createMockClub({ 
      _id: 'club-1', 
      name: 'Test Club 1',
      seasons: [{
        seasonId: 'season-1',
        roster: ['user-1']
      }]
    }),
    TestUtils.createMockClub({ 
      _id: 'club-2', 
      name: 'Test Club 2',
      seasons: [{
        seasonId: 'season-1',
        roster: ['user-2']
      }]
    })
  ];

  const mockSeasons = [
    TestUtils.createMockSeason({ _id: 'season-1', name: 'Test Season 1' })
  ];

  const mockMatches = [
    TestUtils.createMockMatch({ _id: 'match-1' })
  ];

  beforeEach(async () => {
    const ngrxApiServiceSpy = jasmine.createSpyObj('NgRxApiService', [
      'loadSeasons', 'loadClubs', 'loadUsers', 'loadMatches'
    ]);

    await TestBed.configureTestingModule({
      imports: [PlayersComponent],
      providers: [
        TestUtils.createMockStore({
          users: {
            users: mockUsers,
            freeAgents: [],
            inboxOffers: [],
            loading: false,
            error: null
          },
          clubs: {
            clubs: mockClubs,
            selectedClub: null,
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
        ...TestUtils.getCommonMockProviders()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayersComponent);
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

    it('should load data on init', () => {
      component.ngOnInit();
      expect(ngrxApiService.loadSeasons).toHaveBeenCalled();
      expect(ngrxApiService.loadClubs).toHaveBeenCalled();
      expect(ngrxApiService.loadUsers).toHaveBeenCalled();
      expect(ngrxApiService.loadMatches).toHaveBeenCalled();
    });

    it('should initialize with default filter values', () => {
      expect(component.statusFilter).toBe('All');
      expect(component.positionFilter).toBe('All');
      expect(component.secondaryPositionFilter).toBe('All');
      expect(component.regionFilter).toBe('All');
      expect(component.searchTerm).toBe('');
    });

    it('should initialize with empty filtered players', () => {
      expect(component.filteredPlayers).toEqual([]);
    });

    it('should build country emoji map', () => {
      component.ngOnInit();
      expect(component.countryEmojiMap['USA']).toBe('🇺🇸');
      expect(component.countryEmojiMap['Canada']).toBe('🇨🇦');
      expect(component.countryEmojiMap['Sweden']).toBe('🇸🇪');
    });
  });

  describe('Data Processing', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should map users to players correctly', () => {
      expect(component.filteredPlayers.length).toBe(3);
      
      const forwardPlayer = component.filteredPlayers.find((p: any) => p.discordUsername === 'ForwardPlayer');
      expect(forwardPlayer?.position).toBe('LW');
      expect(forwardPlayer?.country).toBe('USA');
      expect(forwardPlayer?.status).toBe('Signed');
      expect(forwardPlayer?.currentClubName).toBe('Test Club 1');
    });

    it('should determine player status based on club roster', () => {
      const signedPlayer = component.filteredPlayers.find((p: any) => p.discordUsername === 'ForwardPlayer');
      const freeAgentPlayer = component.filteredPlayers.find((p: any) => p.discordUsername === 'GoaliePlayer');
      
      expect(signedPlayer?.status).toBe('Signed');
      expect(freeAgentPlayer?.status).toBe('Free Agent');
    });

    it('should handle missing player profile data', () => {
      const userWithoutProfile = TestUtils.createMockUser({ 
        _id: 'user-no-profile',
        discordUsername: 'NoProfilePlayer',
        playerProfile: null
      });

      store.setState({
        users: {
          users: [userWithoutProfile],
          freeAgents: [],
          inboxOffers: [],
          loading: false,
          error: null
        }
      } as any);

      fixture.detectChanges();

      const mappedPlayer = component.filteredPlayers.find((p: any) => p.discordUsername === 'NoProfilePlayer');
      expect(mappedPlayer?.position).toBe('C'); // Default value
      expect(mappedPlayer?.status).toBe('Free Agent'); // Default value
    });
  });

  describe('Status Filtering', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should filter by signed status', () => {
      component.onStatusFilterChange('Signed');
      expect(component.filteredPlayers.length).toBe(2);
      expect(component.filteredPlayers.every((p: any) => p.status === 'Signed')).toBe(true);
    });

    it('should filter by free agent status', () => {
      component.onStatusFilterChange('Free Agent');
      expect(component.filteredPlayers.length).toBe(1);
      expect(component.filteredPlayers[0].status).toBe('Free Agent');
    });

    it('should show all players when status filter is All', () => {
      component.onStatusFilterChange('All');
      expect(component.filteredPlayers.length).toBe(3);
    });
  });

  describe('Position Filtering', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should filter by forward position', () => {
      component.onPositionFilterChange('Forward');
      expect(component.filteredPlayers.length).toBe(1);
      expect(component.filteredPlayers[0].position).toBe('LW');
    });

    it('should filter by defense position', () => {
      component.onPositionFilterChange('Defense');
      expect(component.filteredPlayers.length).toBe(1);
      expect(component.filteredPlayers[0].position).toBe('LD');
    });

    it('should filter by goalie position', () => {
      component.onPositionFilterChange('Goalie');
      expect(component.filteredPlayers.length).toBe(1);
      expect(component.filteredPlayers[0].position).toBe('G');
    });
  });

  describe('Secondary Position Filtering', () => {
    beforeEach(async () => {
      // Add players with secondary positions
      const usersWithSecondaryPositions = [
        TestUtils.createMockUser({ 
          _id: 'user-1', 
          discordUsername: 'MultiPositionPlayer',
          playerProfile: { 
            position: 'C', 
            secondaryPositions: ['LW', 'RW'] 
          }
        }),
        TestUtils.createMockUser({ 
          _id: 'user-2', 
          discordUsername: 'DefenseOnlyPlayer',
          playerProfile: { 
            position: 'LD', 
            secondaryPositions: [] 
          }
        })
      ];

      store.setState({
        users: {
          users: usersWithSecondaryPositions,
          freeAgents: [],
          inboxOffers: [],
          loading: false,
          error: null
        }
      } as any);

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should filter by secondary forward position', () => {
      component.onSecondaryPositionFilterChange('Forward');
      expect(component.filteredPlayers.length).toBe(1);
      expect(component.filteredPlayers[0].discordUsername).toBe('MultiPositionPlayer');
    });

    it('should show no results when no secondary positions match', () => {
      component.onSecondaryPositionFilterChange('Goalie');
      expect(component.filteredPlayers.length).toBe(0);
    });
  });

  describe('Region Filtering', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should filter by North America region', () => {
      component.onRegionFilterChange('North America');
      expect(component.filteredPlayers.length).toBe(2);
            expect(component.filteredPlayers.every((p: any) =>
        p.country === 'USA' || p.country === 'Canada'
      )).toBe(true);
    });

    it('should filter by Europe region', () => {
      component.onRegionFilterChange('Europe');
      expect(component.filteredPlayers.length).toBe(1);
      expect(component.filteredPlayers[0].country).toBe('Sweden');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should filter by discord username', () => {
      component.onSearchChange({ target: { value: 'ForwardPlayer' } } as any);
      expect(component.filteredPlayers.length).toBe(1);
      expect(component.filteredPlayers[0].discordUsername).toBe('ForwardPlayer');
    });

    it('should filter by PSN ID', () => {
      component.onSearchChange({ target: { value: 'test-psn' } } as any);
      expect(component.filteredPlayers.length).toBe(3); // All have test-psn
    });

    it('should filter by Xbox gamertag', () => {
      component.onSearchChange({ target: { value: 'test-xbox' } } as any);
      expect(component.filteredPlayers.length).toBe(0); // None have Xbox gamertag
    });

    it('should be case insensitive', () => {
      component.onSearchChange({ target: { value: 'forwardplayer' } } as any);
      expect(component.filteredPlayers.length).toBe(1);
      expect(component.filteredPlayers[0].discordUsername).toBe('ForwardPlayer');
    });
  });

  describe('Season Filtering', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should set default season filter', () => {
      expect(component.seasonFilter).toBe('Test Season 1');
    });

    it('should reload players when season changes', () => {
      spyOn(component, 'processPlayerData');
      component.onSeasonFilterChange('Test Season 2');
      expect(component.seasonFilter).toBe('Test Season 2');
    });
  });

  describe('Combined Filtering', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should apply multiple filters simultaneously', () => {
      component.onStatusFilterChange('Signed');
      component.onPositionFilterChange('Forward');
      component.onRegionFilterChange('North America');
      component.onSearchChange({ target: { value: 'Forward' } } as any);

      expect(component.filteredPlayers.length).toBe(1);
      expect(component.filteredPlayers[0].discordUsername).toBe('ForwardPlayer');
    });

    it('should show no results when filters are too restrictive', () => {
      component.onStatusFilterChange('Signed');
      component.onPositionFilterChange('Goalie');
      component.onRegionFilterChange('Europe');

      expect(component.filteredPlayers.length).toBe(0);
    });
  });

  describe('Image URL Handling', () => {
    it('should return default image for undefined logoUrl', () => {
      const result = component.getImageUrl(undefined);
      expect(result).toBe('assets/images/1ithlwords.png');
    });

    it('should return full URL for HTTP URLs', () => {
      const result = component.getImageUrl('https://example.com/logo.png');
      expect(result).toBe('https://example.com/logo.png');
    });

    it('should prepend API URL for upload paths', () => {
      const result = component.getImageUrl('/uploads/logo.png');
      expect(result).toBe('http://localhost:3001/uploads/logo.png');
    });

    it('should handle timestamp pattern filenames', () => {
      const result = component.getImageUrl('1754503785707-306812067-HCPurijat.png');
      expect(result).toBe('http://localhost:3001/uploads/1754503785707-306812067-HCPurijat.png');
    });
  });

  describe('Team Logo Mapping', () => {
    it('should return default logo for unknown team', () => {
      const result = component.getTeamLogo('Unknown Team');
      expect(result).toBe('assets/images/square-default.png');
    });

    it('should return mapped logo for known team', () => {
      const result = component.getTeamLogo('roosters');
      expect(result).toBe('assets/images/square-iserlohnroosters.png');
    });

    it('should return default logo for unknown team', () => {
      const result = component.getTeamLogo('Test Team');
      expect(result).toBe('assets/images/square-default.png');
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
