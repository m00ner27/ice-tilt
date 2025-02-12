import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SeasonsState, Season } from './seasons.model';

export const selectSeasonsState = createFeatureSelector<SeasonsState>('seasons');

export const selectAllSeasons = createSelector(
  selectSeasonsState,
  (state) => state.seasons
);

export const selectCurrentSeason = createSelector(
  selectSeasonsState,
  (state) => state.currentSeason
);

export const selectSeasonsLoading = createSelector(
  selectSeasonsState,
  (state) => state.loading
);

export const selectSeasonsError = createSelector(
  selectSeasonsState,
  (state) => state.error
);

export const selectSeasonById = (seasonId: string) => createSelector(
  selectAllSeasons,
  (seasons) => seasons.find(season => season.id === seasonId)
);

export const selectActiveSeasons = createSelector(
  selectAllSeasons,
  (seasons) => seasons.filter(season => season.status === 'IN_PROGRESS')
);

export const selectUpcomingSeasons = createSelector(
  selectAllSeasons,
  (seasons) => seasons.filter(season => season.status === 'UPCOMING')
);

export const selectCompletedSeasons = createSelector(
  selectAllSeasons,
  (seasons) => seasons.filter(season => season.status === 'COMPLETED')
);

export const selectPlayoffSeasons = createSelector(
  selectAllSeasons,
  (seasons) => seasons.filter(season => season.isPlayoffs)
);

export const selectCurrentSeasonId = createSelector(
  selectCurrentSeason,
  (season) => season?.id
);

export const selectIsPlayoffSeason = createSelector(
  selectCurrentSeason,
  (season) => season?.isPlayoffs || false
); 