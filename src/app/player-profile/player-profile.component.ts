import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { PlayerStats, StatsState } from '../state/stats/stats.model';
import * as StatsSelectors from '../state/stats/stats.selectors';
import * as StatsActions from '../state/stats/stats.actions';

@Component({
  selector: 'app-player-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.css']
})
export class PlayerProfileComponent implements OnInit {
  playerId: string | null = null;
  playerStats$: Observable<PlayerStats | undefined>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(
    private route: ActivatedRoute,
    private store: Store<{ stats: StatsState }>
  ) {
    const playerId = this.route.snapshot.paramMap.get('id') || '';
    this.playerStats$ = this.store.select(StatsSelectors.selectPlayerStats(playerId, 'current'));
    this.loading$ = this.store.select(StatsSelectors.selectStatsLoading);
    this.error$ = this.store.select(StatsSelectors.selectStatsError);
  }

  ngOnInit() {
    this.playerId = this.route.snapshot.paramMap.get('id');
    if (this.playerId) {
      this.store.dispatch(StatsActions.loadStats({ seasonId: 'current' }));
    }
  }
} 