import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { GoalieStats, StatsState } from '../state/stats/stats.model';
import * as StatsActions from '../state/stats/stats.actions';
import * as StatsSelectors from '../state/stats/stats.selectors';

@Component({
  selector: 'app-goalie-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './goalie-stats.component.html',
  styleUrls: ['./goalie-stats.component.css']
})
export class GoalieStatsComponent implements OnInit {
  goalieStats$: Observable<GoalieStats[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  currentSeason = 'current';

  constructor(private store: Store<{ stats: StatsState }>) {
    this.goalieStats$ = this.store.select(StatsSelectors.selectAllGoalieStats).pipe(
      tap(goalies => console.log('Goalie Stats:', goalies))
    );
    this.loading$ = this.store.select(StatsSelectors.selectStatsLoading).pipe(
      tap(loading => console.log('Loading:', loading))
    );
    this.error$ = this.store.select(StatsSelectors.selectStatsError).pipe(
      tap(error => error && console.error('Error:', error))
    );
  }

  ngOnInit() {
    console.log('Dispatching loadStats action');
    this.store.dispatch(StatsActions.loadStats({ seasonId: this.currentSeason }));
  }
}
