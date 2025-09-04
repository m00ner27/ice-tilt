import { createReducer, on } from '@ngrx/store';
import { Season } from './seasons.actions';
import * as SeasonsActions from './seasons.actions';

export interface SeasonsState {
  seasons: Season[];
  activeSeason: Season | null;
  loading: boolean;
  error: any;
}

export const initialState: SeasonsState = {
  seasons: [],
  activeSeason: null,
  loading: false,
  error: null,
};

export const seasonsReducer = createReducer(
  initialState,

  // Load Seasons
  on(SeasonsActions.loadSeasons, (state) => ({ ...state, loading: true, error: null })),
  on(SeasonsActions.loadSeasonsSuccess, (state, { seasons }) => ({ 
    ...state, 
    seasons, 
    activeSeason: seasons.find(s => s.isActive) || null,
    loading: false, 
    error: null 
  })),
  on(SeasonsActions.loadSeasonsFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Create Season
  on(SeasonsActions.createSeason, (state) => ({ ...state, loading: true, error: null })),
  on(SeasonsActions.createSeasonSuccess, (state, { season }) => ({ 
    ...state, 
    seasons: [...state.seasons, season], 
    loading: false, 
    error: null 
  })),
  on(SeasonsActions.createSeasonFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Update Season
  on(SeasonsActions.updateSeason, (state) => ({ ...state, loading: true, error: null })),
  on(SeasonsActions.updateSeasonSuccess, (state, { season }) => ({ 
    ...state, 
    seasons: state.seasons.map(s => s._id === season._id ? season : s),
    activeSeason: season.isActive ? season : state.activeSeason,
    loading: false, 
    error: null 
  })),
  on(SeasonsActions.updateSeasonFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Delete Season
  on(SeasonsActions.deleteSeason, (state) => ({ ...state, loading: true, error: null })),
  on(SeasonsActions.deleteSeasonSuccess, (state, { seasonId }) => ({ 
    ...state, 
    seasons: state.seasons.filter(s => s._id !== seasonId),
    activeSeason: state.activeSeason?._id === seasonId ? null : state.activeSeason,
    loading: false, 
    error: null 
  })),
  on(SeasonsActions.deleteSeasonFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Set Active Season
  on(SeasonsActions.setActiveSeason, (state) => ({ ...state, loading: true, error: null })),
  on(SeasonsActions.setActiveSeasonSuccess, (state, { season }) => ({ 
    ...state, 
    activeSeason: season,
    seasons: state.seasons.map(s => ({ ...s, isActive: s._id === season._id })),
    loading: false, 
    error: null 
  })),
  on(SeasonsActions.setActiveSeasonFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Clear Actions
  on(SeasonsActions.clearSeasons, (state) => ({ ...state, seasons: [], activeSeason: null }))
);
