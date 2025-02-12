import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ScheduleState, ScheduleGame } from './schedule.model';

export const selectScheduleState = createFeatureSelector<ScheduleState>('schedule');

export const selectAllScheduledGames = createSelector(
  selectScheduleState,
  (state) => state.games
);

export const selectScheduleLoading = createSelector(
  selectScheduleState,
  (state) => state.loading
);

export const selectScheduleError = createSelector(
  selectScheduleState,
  (state) => state.error
);

export const selectScheduleBySeasonId = (seasonId: string) => createSelector(
  selectAllScheduledGames,
  (games) => games.filter(game => game.seasonId === seasonId)
);

export const selectTeamSchedule = (teamId: string) => createSelector(
  selectAllScheduledGames,
  (games) => games.filter(game => 
    game.homeTeamId === teamId || game.awayTeamId === teamId
  )
);

export const selectUpcomingGames = createSelector(
  selectAllScheduledGames,
  (games) => games
    .filter(game => game.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
);

export const selectPlayoffGames = createSelector(
  selectAllScheduledGames,
  (games) => games.filter(game => game.isPlayoff)
);

export const selectGamesByRound = (round: number) => createSelector(
  selectAllScheduledGames,
  (games) => games.filter(game => game.round === round)
);

export const selectGameById = (gameId: string) => createSelector(
  selectAllScheduledGames,
  (games) => games.find(game => game.id === gameId)
); 