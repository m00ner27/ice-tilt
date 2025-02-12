import { createReducer, on } from '@ngrx/store';
import { StatsState } from './stats.model';
import * as StatsActions from './stats.actions';

export const initialState: StatsState = {
  playerStats: [],
  goalieStats: [],
  loading: false,
  error: null
};

export const statsReducer = createReducer(
  initialState,
  
  // Load Stats
  on(StatsActions.loadStats, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(StatsActions.loadStatsSuccess, (state, { stats }) => ({
    ...state,
    playerStats: stats.playerStats,
    goalieStats: stats.goalieStats,
    loading: false
  })),
  
  on(StatsActions.loadStatsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  // Update Player Stats
  on(StatsActions.updatePlayerStatsSuccess, (state, { stats }) => ({
    ...state,
    playerStats: state.playerStats.map(ps => 
      ps.playerId === stats.playerId && ps.seasonId === stats.seasonId
        ? stats
        : ps
    )
  })),
  
  // Update Goalie Stats
  on(StatsActions.updateGoalieStatsSuccess, (state, { stats }) => ({
    ...state,
    goalieStats: state.goalieStats.map(gs => 
      gs.playerId === stats.playerId && gs.seasonId === stats.seasonId
        ? stats
        : gs
    )
  })),
  
  // Record Game Stats
  on(StatsActions.recordGameStatsSuccess, (state, { playerStats, goalieStats }) => {
    const updatedPlayerStats = state.playerStats.map(existingStat => {
      const updatedStat = playerStats.find(
        ps => ps.playerId === existingStat.playerId && ps.seasonId === existingStat.seasonId
      );
      return updatedStat || existingStat;
    });

    const updatedGoalieStats = state.goalieStats.map(existingStat => {
      const updatedStat = goalieStats.find(
        gs => gs.playerId === existingStat.playerId && gs.seasonId === existingStat.seasonId
      );
      return updatedStat || existingStat;
    });

    return {
      ...state,
      playerStats: updatedPlayerStats,
      goalieStats: updatedGoalieStats
    };
  }),
  
  // Clear Error
  on(StatsActions.clearError, state => ({
    ...state,
    error: null
  }))
); 