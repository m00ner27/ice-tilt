import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Actions } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { AppState } from '../store';
import { ScheduleComponent } from './schedule.component';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { TestUtils } from '../testing/test-utils';

describe('ScheduleComponent', () => {
  let component: ScheduleComponent;
  let fixture: ComponentFixture<ScheduleComponent>;
  let store: MockStore<AppState>;
  let ngrxApiService: jasmine.SpyObj<NgRxApiService>;
  let actions$: Observable<any>;

  const mockMatches = [
    TestUtils.createMockMatch({ 
      _id: 'match-1', 
      homeTeam: 'Home Team 1',
      awayTeam: 'Away Team 1',
      homeScore: 3,
      awayScore: 2,
      date: '2024-01-15T19:00:00Z',
      seasonId: 'season-1'
    }),
    TestUtils.createMockMatch({ 
      _id: 'match-2', 
      homeTeam: 'Home Team 2',
      awayTeam: 'Away Team 2',
      homeScore: 1,
      awayScore: 4,
      date: '2024-01-16T20:00:00Z',
      seasonId: 'season-1'
    })
  ];

  const mockClubs = [
    TestUtils.createMockClub({ _id: 'club-1', name: 'Home Team 1', seasons: [{ seasonId: 'season-1' }] }),
    TestUtils.createMockClub({ _id: 'club-2', name: 'Away Team 1', seasons: [{ seasonId: 'season-1' }] }),
    TestUtils.createMockClub({ _id: 'club-3', name: 'Home Team 2', seasons: [{ seasonId: 'season-1' }] }),
    TestUtils.createMockClub({ _id: 'club-4', name: 'Away Team 2', seasons: [{ seasonId: 'season-1' }] })
  ];

  const mockSeasons = [
    TestUtils.createMockSeason({ _id: 'season-1', name: 'Test Season 1' }),
    TestUtils.createMockSeason({ _id: 'season-2', name: 'Test Season 2' })
  ];

  beforeEach(async () => {
    const ngrxApiServiceSpy = jasmine.createSpyObj('NgRxApiService', [
      'loadMatches', 'loadClubs', 'loadSeasons'
    ]);

    await TestBed.configureTestingModule({
      imports: [ScheduleComponent],
      providers: [
        ...TestUtils.getCommonMockProviders(),
        TestUtils.createMockStore({
          matches: {
            matches: mockMatches,
            selectedMatch: null,
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
          }
        }),
        provideMockActions(() => actions$ = of()),
        { provide: NgRxApiService, useValue: ngrxApiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleComponent);
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
      expect(ngrxApiService.loadMatches).toHaveBeenCalled();
      expect(ngrxApiService.loadClubs).toHaveBeenCalled();
      expect(ngrxApiService.loadSeasons).toHaveBeenCalled();
    });

    it('should initialize with default filter values', () => {
      expect(component.filterTeam).toBe('');
      expect(component.filterSeason).toBe('');
      expect(component.sortCriteria).toBe('date');
      expect(component.sortDirection).toBe('desc');
    });

    it('should initialize with empty filtered matches', () => {
      expect(component.filteredMatches).toEqual([]);
    });
  });

  describe('Data Loading', () => {
    it('should display matches when loaded', async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(component.filteredMatches.length).toBe(2);
    });

    it('should display loading state', async () => {
      store.setState({
        matches: {
          matches: [],
          selectedMatch: null,
          loading: true,
          error: null
        }
      } as any);

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(component['matchesLoading$']).toBeDefined();
    });

    it('should display error state', async () => {
      store.setState({
        matches: {
          matches: [],
          selectedMatch: null,
          loading: false,
          error: 'Failed to load matches'
        }
      } as any);

      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);

      expect(component['matchesError$']).toBeDefined();
    });
  });

  describe('Team Filtering', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should filter matches by home team', () => {
      component.filterTeam = 'Home Team 1';
      component.onTeamFilterChange('Home Team 1');

      expect(component.filteredMatches.length).toBe(1);
      expect(component.filteredMatches[0].homeTeam).toBe('Home Team 1');
    });

    it('should filter matches by away team', () => {
      component.filterTeam = 'Away Team 1';
      component.onTeamFilterChange('Away Team 1');

      expect(component.filteredMatches.length).toBe(1);
      expect(component.filteredMatches[0].awayTeam).toBe('Away Team 1');
    });

    it('should show all matches when no team filter', () => {
      component.filterTeam = '';
      component.onTeamFilterChange('');

      expect(component.filteredMatches.length).toBe(2);
    });
  });

  describe('Season Filtering', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should filter matches by season', () => {
      component.filterSeason = 'season-1';
      component.onSeasonFilterChange('season-1');

      expect(component.filteredMatches.length).toBe(2);
      expect(component.filteredMatches.every((match: any) => match.seasonId === 'season-1')).toBe(true);
    });

    it('should update team options when season changes', () => {
      component.filterSeason = 'season-1';
      component.onSeasonFilterChange('season-1');

      expect(component.teamOptions.length).toBeGreaterThan(0);
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should sort by date ascending', () => {
      component.onSortChange('date');
      expect(component.sortCriteria).toBe('date');
      expect(component.sortDirection).toBe('asc');
    });

    it('should sort by date descending when already sorted by date', () => {
      component.sortCriteria = 'date';
      component.sortDirection = 'desc';
      component.onSortChange('date');

      expect(component.sortDirection).toBe('asc');
    });

    it('should sort by home team', () => {
      component.onSortChange('homeTeam');
      expect(component.sortCriteria).toBe('homeTeam');
      expect(component.sortDirection).toBe('asc');
    });

    it('should sort by away team', () => {
      component.onSortChange('awayTeam');
      expect(component.sortCriteria).toBe('awayTeam');
      expect(component.sortDirection).toBe('asc');
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const date = '2024-01-15T19:00:00Z';
      const formatted = component.formatDate(date);
      
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('Mon');
    });

    it('should format mobile date correctly', () => {
      const date = '2024-01-15T19:00:00Z';
      const formatted = component.formatDateMobile(date);
      
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });
  });

  describe('Result Classification', () => {
    const mockMatch = TestUtils.createMockMatch({
      homeTeam: 'Home Team',
      awayTeam: 'Away Team',
      homeScore: 3,
      awayScore: 2
    });

    it('should return win for home team when home score is higher', () => {
      const result = component.getResultClass(mockMatch, 'Home Team');
      expect(result).toBe('win');
    });

    it('should return loss for away team when home score is higher', () => {
      const result = component.getResultClass(mockMatch, 'Away Team');
      expect(result).toBe('loss');
    });

    it('should return empty string for no score', () => {
      const matchWithoutScore = { ...mockMatch, homeScore: 0, awayScore: 0 };
      const result = component.getResultClass(matchWithoutScore, 'Home Team');
      expect(result).toBe('');
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
  });

  describe('Preview Mode', () => {
    it('should accept isPreview input', () => {
      component.isPreview = true;
      expect(component.isPreview).toBe(true);
    });

    it('should default isPreview to false', () => {
      expect(component.isPreview).toBe(false);
    });
  });

  describe('Combined Filtering and Sorting', () => {
    beforeEach(async () => {
      component.ngOnInit();
      await TestUtils.waitForAsync(fixture);
    });

    it('should apply both team and season filters', () => {
      component.filterTeam = 'Home Team 1';
      component.filterSeason = 'season-1';
      component.onTeamFilterChange('Home Team 1');
      component.onSeasonFilterChange('season-1');

      expect(component.filteredMatches.length).toBe(1);
      expect(component.filteredMatches[0].homeTeam).toBe('Home Team 1');
      expect(component.filteredMatches[0].seasonId).toBe('season-1');
    });

    it('should maintain sort order after filtering', () => {
      component.onSortChange('homeTeam');
      component.filterTeam = 'Home Team 1';
      component.onTeamFilterChange('Home Team 1');

      expect(component.sortCriteria).toBe('homeTeam');
      expect(component.sortDirection).toBe('asc');
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