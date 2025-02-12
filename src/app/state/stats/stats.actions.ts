import { createAction, props } from '@ngrx/store';
import { PlayerStats, GoalieStats } from './stats.model';

// Load Stats
export const loadStats = createAction(
  '[Stats] Load Stats',
  props<{ seasonId: string }>()
);

export const loadStatsSuccess = createAction(
  '[Stats] Load Stats Success',
  props<{ stats: { playerStats: PlayerStats[]; goalieStats: GoalieStats[] } }>()
);

export const loadStatsFailure = createAction(
  '[Stats] Load Stats Failure',
  props<{ error: string }>()
);

// Update Player Stats
export const updatePlayerStats = createAction(
  '[Stats] Update Player Stats',
  props<{ playerId: string; seasonId: string; updates: Partial<PlayerStats> }>()
);
export const updatePlayerStatsSuccess = createAction(
  '[Stats] Update Player Stats Success',
  props<{ stats: PlayerStats }>()
);
export const updatePlayerStatsFailure = createAction(
  '[Stats] Update Player Stats Failure',
  props<{ error: string }>()
);

// Update Goalie Stats
export const updateGoalieStats = createAction(
  '[Stats] Update Goalie Stats',
  props<{ playerId: string; seasonId: string; updates: Partial<GoalieStats> }>()
);
export const updateGoalieStatsSuccess = createAction(
  '[Stats] Update Goalie Stats Success',
  props<{ stats: GoalieStats }>()
);
export const updateGoalieStatsFailure = createAction(
  '[Stats] Update Goalie Stats Failure',
  props<{ error: string }>()
);

// Record Game Stats
export const recordGameStats = createAction(
  '[Stats] Record Game Stats',
  props<{ 
    gameId: string;
    seasonId: string;
    playerStats: Partial<PlayerStats>[];
    goalieStats: Partial<GoalieStats>[];
  }>()
);
export const recordGameStatsSuccess = createAction(
  '[Stats] Record Game Stats Success',
  props<{ playerStats: PlayerStats[]; goalieStats: GoalieStats[] }>()
);
export const recordGameStatsFailure = createAction(
  '[Stats] Record Game Stats Failure',
  props<{ error: string }>()
);

// Add to your existing actions
export const clearError = createAction('[Stats] Clear Error'); 