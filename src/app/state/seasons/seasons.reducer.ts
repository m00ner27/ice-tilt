import { createReducer, on } from '@ngrx/store';
import { SeasonsState } from './seasons.model';
import * as SeasonsActions from './seasons.actions';

export const initialState: SeasonsState = {
  seasons: [],
  currentSeason: null,
  loading: false,
  error: null
};

export const seasonsReducer = createReducer(
  initialState,
  
  // Load Seasons
  on(SeasonsActions.loadSeasons, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(SeasonsActions.loadSeasonsSuccess, (state, { seasons }) => ({
    ...state,
    seasons,
    loading: false
  })),
  
  on(SeasonsActions.loadSeasonsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  // Create Season
  on(SeasonsActions.createSeason, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(SeasonsActions.createSeasonSuccess, (state, { season }) => ({
    ...state,
    seasons: [...state.seasons, season],
    loading: false
  })),
  
  on(SeasonsActions.createSeasonFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  // Update Season Status
  on(SeasonsActions.updateSeasonStatusSuccess, (state, { season }) => ({
    ...state,
    seasons: state.seasons.map(s => s.id === season.id ? season : s),
    currentSeason: state.currentSeason?.id === season.id ? season : state.currentSeason
  })),
  
  // Start Playoffs
  on(SeasonsActions.startPlayoffsSuccess, (state, { season }) => ({
    ...state,
    seasons: state.seasons.map(s => s.id === season.id ? season : s),
    currentSeason: state.currentSeason?.id === season.id ? season : state.currentSeason
  })),
  
  // Set Current Season
  on(SeasonsActions.setCurrentSeason, (state, { seasonId }) => ({
    ...state,
    currentSeason: state.seasons.find(season => season.id === seasonId) || null
  }))
); 