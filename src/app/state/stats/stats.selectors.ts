import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StatsState, PlayerStats, GoalieStats, Division } from './stats.model';

export const selectStatsState = createFeatureSelector<StatsState>('stats');

// Basic Selectors
export const selectAllPlayerStats = createSelector(
  selectStatsState,
  (state) => state.playerStats
);

export const selectAllGoalieStats = createSelector(
  selectStatsState,
  (state) => state.goalieStats
);

export const selectStatsLoading = createSelector(
  selectStatsState,
  (state) => state.loading
);

export const selectStatsError = createSelector(
  selectStatsState,
  (state) => state.error
);

// Season-specific Selectors
export const selectSeasonPlayerStats = (seasonId: string) => createSelector(
  selectAllPlayerStats,
  (stats) => stats.filter(stat => stat.seasonId === seasonId)
);

export const selectSeasonGoalieStats = (seasonId: string) => createSelector(
  selectAllGoalieStats,
  (stats) => stats.filter(stat => stat.seasonId === seasonId)
);

// Player Leaderboards
export const selectPointLeaders = (seasonId: string, limit = 10) => createSelector(
  selectSeasonPlayerStats(seasonId),
  (stats) => [...stats]
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
);

export const selectGoalLeaders = (seasonId: string, limit = 10) => createSelector(
  selectSeasonPlayerStats(seasonId),
  (stats) => [...stats]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit)
);

export const selectAssistLeaders = (seasonId: string, limit = 10) => createSelector(
  selectSeasonPlayerStats(seasonId),
  (stats) => [...stats]
    .sort((a, b) => b.assists - a.assists)
    .slice(0, limit)
);

export const selectHitLeaders = (seasonId: string, limit = 10) => createSelector(
  selectSeasonPlayerStats(seasonId),
  (stats) => [...stats]
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
);

// Goalie Leaderboards
export const selectGoalieWinLeaders = (seasonId: string, limit = 10) => createSelector(
  selectSeasonGoalieStats(seasonId),
  (stats) => [...stats]
    .sort((a, b) => b.wins - a.wins)
    .slice(0, limit)
);

export const selectGoalieShutoutLeaders = (seasonId: string, limit = 10) => createSelector(
  selectSeasonGoalieStats(seasonId),
  (stats) => [...stats]
    .sort((a, b) => b.shutouts - a.shutouts)
    .slice(0, limit)
);

export const selectGoalieSavePercentageLeaders = (seasonId: string, limit = 10) => createSelector(
  selectSeasonGoalieStats(seasonId),
  (stats) => [...stats]
    .filter(stat => stat.gamesPlayed > 0) // Minimum games played filter
    .sort((a, b) => b.savePercentage - a.savePercentage)
    .slice(0, limit)
);

// Individual Player/Goalie Stats
export const selectPlayerStats = (playerId: string, seasonId: string) => createSelector(
  selectAllPlayerStats,
  (stats) => stats.find(stat => 
    stat.playerId === playerId && stat.seasonId === seasonId
  )
);

export const selectGoalieStats = (playerId: string, seasonId: string) => createSelector(
  selectAllGoalieStats,
  (stats) => stats.find(stat => 
    stat.playerId === playerId && stat.seasonId === seasonId
  )
);

// Add this new selector
export const selectSeasonPlayerStatsWithSortAndFilter = (
  seasonId: string,
  sort: { column: keyof PlayerStats | 'rank'; direction: 'asc' | 'desc' },
  division: Division
) => createSelector(
  selectSeasonPlayerStats(seasonId),
  (stats) => {
    let filteredStats = [...stats];
    
    // Apply division filter if not "All Divisions"
    if (division !== 'All Divisions') {
      filteredStats = filteredStats.filter(stat => stat.division === division);
    }

    // Apply sorting
    const sortedStats = filteredStats.sort((a, b) => {
      let comparison = 0;
      if (sort.column === 'rank') {
        comparison = a.points - b.points;
      } else {
        const aValue = a[sort.column];
        const bValue = b[sort.column];
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        }
      }
      return sort.direction === 'asc' ? comparison : -comparison;
    })
    .map((stat, index) => ({
      ...stat,
      rank: index + 1
    }));

    return sortedStats;
  }
);

// Update leaderboard selectors to include division filtering
export const selectPointLeadersFiltered = (
  seasonId: string, 
  division: Division,
  limit = 10
) => createSelector(
  selectSeasonPlayerStats(seasonId),
  (stats) => {
    let filteredStats = [...stats];
    if (division !== 'All Divisions') {
      filteredStats = filteredStats.filter(stat => stat.division === division);
    }
    return filteredStats
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }
);

// Add similar filtered selectors for goals, assists, and hits 
export const selectAssistLeadersFiltered = (seasonId: string, division: Division, limit = 10) => createSelector(
  selectSeasonPlayerStats(seasonId),
  (stats) => {
    let filteredStats = [...stats];
    if (division !== 'All Divisions') {
      filteredStats = filteredStats.filter(stat => stat.division === division);
    }
    return filteredStats
      .sort((a, b) => b.assists - a.assists)
      .slice(0, limit);
  }
);

export const selectGoalLeadersFiltered = selectAssistLeadersFiltered;  // Same pattern
export const selectHitLeadersFiltered = selectAssistLeadersFiltered;   // Same pattern 