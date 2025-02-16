import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { SeasonStandings } from '../state/standings/standings.model';
import * as StandingsActions from '../state/standings/standings.actions';
import * as StandingsSelectors from '../state/standings/standings.selectors';
import { StandingsState } from '../state/standings/standings.reducer';

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './standings.component.html',
  styleUrls: ['./standings.component.css']
})
export class StandingsComponent implements OnInit {
  standings$: Observable<SeasonStandings | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  currentSeason = 'current'; // We can make this dynamic later

  constructor(private store: Store<{ standings: StandingsState }>) {
    this.standings$ = this.store.select(StandingsSelectors.selectCurrentSeasonStandings).pipe(
      tap(standings => console.log('Standings data:', standings))
    );
    this.loading$ = this.store.select(StandingsSelectors.selectStandingsLoading);
    this.error$ = this.store.select(StandingsSelectors.selectStandingsError);
  }

  ngOnInit() {
    this.store.dispatch(StandingsActions.loadStandings({ seasonId: this.currentSeason }));
  }
}