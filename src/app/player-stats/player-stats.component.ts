import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { PlayerStats } from '../state/stats/stats.model';
import * as StatsActions from '../state/stats/stats.actions';
import * as StatsSelectors from '../state/stats/stats.selectors';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Division } from '../state/stats/stats.model';
import { RouterModule } from '@angular/router';

interface SortConfig {
  column: keyof PlayerStats | 'rank';
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.css'
})
export class PlayerStatsComponent implements OnInit {
  goalLeaders$: Observable<PlayerStats[]>;
  assistLeaders$: Observable<PlayerStats[]>;
  pointLeaders$: Observable<PlayerStats[]>;
  hitLeaders$: Observable<PlayerStats[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  selectedSeason: string = 'current'; // You can set default season
  playerStatsList$: Observable<(PlayerStats & { rank: number })[]>;
  selectedDivision: Division = 'All Divisions';

  currentSort: SortConfig = {
    column: 'points',
    direction: 'desc'
  };

  constructor(private store: Store) {
    this.loading$ = this.store.select(StatsSelectors.selectStatsLoading);
    this.error$ = this.store.select(StatsSelectors.selectStatsError);
    
    // Initialize our leaderboard observables
    this.goalLeaders$ = this.store.select(StatsSelectors.selectGoalLeaders(this.selectedSeason));
    this.assistLeaders$ = this.store.select(StatsSelectors.selectAssistLeaders(this.selectedSeason));
    this.pointLeaders$ = this.store.select(StatsSelectors.selectPointLeaders(this.selectedSeason));
    this.hitLeaders$ = this.store.select(StatsSelectors.selectHitLeaders(this.selectedSeason));
    this.playerStatsList$ = this.store.select(
      StatsSelectors.selectSeasonPlayerStatsWithSortAndFilter(
        this.selectedSeason,
        this.currentSort,
        this.selectedDivision
      )
    );
    this.updateStats();
  }

  ngOnInit() {
    // Load initial stats
    this.loadSeasonStats(this.selectedSeason);
  }

  onSeasonChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedSeason = select.value;
    this.loadSeasonStats(this.selectedSeason);
  }

  onDivisionChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedDivision = select.value as Division;
    this.updateStats();
  }

  private updateStats() {
    const handleError = (error: any) => {
      console.error('Error loading stats:', error);
      return of([]);
    };

    // Update all stats with division filter
    this.goalLeaders$ = this.store.select(
      StatsSelectors.selectPointLeadersFiltered(this.selectedSeason, this.selectedDivision)
    ).pipe(catchError(handleError));

    this.assistLeaders$ = this.store.select(
      StatsSelectors.selectAssistLeadersFiltered(this.selectedSeason, this.selectedDivision)
    ).pipe(catchError(handleError));

    this.pointLeaders$ = this.store.select(
      StatsSelectors.selectPointLeadersFiltered(this.selectedSeason, this.selectedDivision)
    ).pipe(catchError(handleError));

    this.hitLeaders$ = this.store.select(
      StatsSelectors.selectHitLeadersFiltered(this.selectedSeason, this.selectedDivision)
    ).pipe(catchError(handleError));

    this.playerStatsList$ = this.store.select(
      StatsSelectors.selectSeasonPlayerStatsWithSortAndFilter(
        this.selectedSeason,
        this.currentSort,
        this.selectedDivision
      )
    ).pipe(catchError(handleError));
  }

  private loadSeasonStats(seasonId: string) {
    this.store.dispatch(StatsActions.loadStats({ seasonId }));
    this.selectedSeason = seasonId;
    this.updateStats();
  }

  // Optional: Add method to dismiss error
  dismissError() {
    // Dispatch an action to clear the error state
    this.store.dispatch(StatsActions.clearError());
  }

  sortTable(column: keyof PlayerStats | 'rank') {
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort = {
        column: column,
        direction: 'desc'
      };
    }
    this.updateStats();
  }

  getSortIcon(column: keyof PlayerStats | 'rank'): string {
    if (this.currentSort.column !== column) return 'fa-sort';
    return this.currentSort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
}
