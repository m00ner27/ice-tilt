import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { SeasonStandings } from '../state/standings/standings.model';
import { StandingsState } from '../state/standings/standings.reducer';
import * as StandingsActions from '../state/standings/standings.actions';

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './standings.component.html',
  styleUrls: ['./standings.component.css']
})
export class StandingsComponent implements OnInit {
  standings$: Observable<SeasonStandings | null>;

  constructor(private store: Store<{ standings: StandingsState }>) {
    this.standings$ = store.select(state => state.standings.currentSeasonStandings);
  }

  ngOnInit() {
    // Dispatch the action with a default season ID
    this.store.dispatch(StandingsActions.loadStandings({ seasonId: 'current' }));
  }
}