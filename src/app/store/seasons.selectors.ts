import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SeasonsState } from './seasons.reducer';

// Feature selector
export const selectSeasonsState = createFeatureSelector<SeasonsState>('seasons');

// Basic selectors
export const selectAllSeasons = createSelector(
  selectSeasonsState,
  (state: SeasonsState) => state?.seasons || []
);

export const selectActiveSeason = createSelector(
  selectSeasonsState,
  (state: SeasonsState) => state?.activeSeason || null
);

export const selectSeasonsLoading = createSelector(
  selectSeasonsState,
  (state: SeasonsState) => state?.loading || false
);

export const selectSeasonsError = createSelector(
  selectSeasonsState,
  (state: SeasonsState) => state?.error || null
);

// Computed selectors
export const selectSeasonById = (seasonId: string) => createSelector(
  selectAllSeasons,
  (seasons) => seasons.find(season => season._id === seasonId)
);

export const selectActiveSeasons = createSelector(
  selectAllSeasons,
  (seasons) => seasons.filter(season => season.isActive)
);

export const selectInactiveSeasons = createSelector(
  selectAllSeasons,
  (seasons) => seasons.filter(season => !season.isActive)
);

export const selectCurrentSeason = createSelector(
  selectAllSeasons,
  (seasons) => {
    const now = new Date();
    return seasons.find(season => 
      season.isActive && 
      new Date(season.startDate) <= now && 
      new Date(season.endDate) >= now
    );
  }
);

export const selectUpcomingSeasons = createSelector(
  selectAllSeasons,
  (seasons) => {
    const now = new Date();
    return seasons.filter(season => 
      new Date(season.startDate) > now
    ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }
);

export const selectPastSeasons = createSelector(
  selectAllSeasons,
  (seasons) => {
    const now = new Date();
    return seasons.filter(season => 
      new Date(season.endDate) < now
    ).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }
);

// Loading states
export const selectSeasonsLoadingState = createSelector(
  selectSeasonsLoading,
  selectSeasonsError,
  (loading, error) => ({ loading, error })
);
