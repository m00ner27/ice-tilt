import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GamesState } from './games.reducer';

export const selectGamesState = createFeatureSelector<GamesState>('games');

export const selectAllGames = createSelector(
  selectGamesState,
  (state) => state.games
);

export const selectSelectedGame = createSelector(
  selectGamesState,
  (state) => state.selectedGame
);

export const selectGamesLoading = createSelector(
  selectGamesState,
  (state) => state.loading
);

export const selectGamesError = createSelector(
  selectGamesState,
  (state) => state.error
);

export const selectGamesByClub = (clubId: string) => createSelector(
  selectAllGames,
  (games) => games.filter(game => 
    game.homeTeamId === clubId || game.awayTeamId === clubId
  )
);

export const selectGamesByStatus = (status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINAL') => createSelector(
  selectAllGames,
  (games) => games.filter(game => game.status === status)
);

export const selectUpcomingGames = createSelector(
  selectAllGames,
  (games) => games.filter(game => game.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
);

export const selectRecentGames = createSelector(
  selectAllGames,
  (games) => games.filter(game => game.status === 'FINAL')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
); 