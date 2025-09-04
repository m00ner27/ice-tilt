import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { MatchService } from '../store/services/match.service';
import { TestUtils } from '../testing/test-utils';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    const matchServiceSpy = jasmine.createSpyObj('MatchService', ['getMatches']);
    matchServiceSpy.getMatches.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        ...TestUtils.getCommonMockProviders(),
        { provide: MatchService, useValue: matchServiceSpy },
        provideMockStore({
          initialState: {
            counter: 0,
            players: { players: [], loading: false, error: null, currentProfile: null },
            clubs: { clubs: [], selectedClub: null, loading: false, error: null },
            matches: { matches: [], selectedMatch: null, loading: false, error: null },
            seasons: { seasons: [], activeSeasonId: null, loading: false, error: null },
            users: { users: [], freeAgents: [], inboxOffers: [], loading: false, error: null },
            divisions: { divisions: [], loading: false, error: null }
          }
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render content', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Exciting Announcement');
  });
});