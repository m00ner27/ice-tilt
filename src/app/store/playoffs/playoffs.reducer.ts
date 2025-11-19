import { createReducer, on } from '@ngrx/store';
import * as PlayoffsActions from './playoffs.actions';

export interface PlayoffsState {
  brackets: PlayoffsActions.PlayoffBracket[];
  currentBracket: PlayoffsActions.PlayoffBracket | null;
  series: PlayoffsActions.PlayoffSeries[];
  currentSeries: PlayoffsActions.PlayoffSeries | null;
  playerStats: any;
  goalieStats: any;
  loading: boolean;
  error: any;
  statsLoading: boolean;
  statsError: any;
}

export const initialState: PlayoffsState = {
  brackets: [],
  currentBracket: null,
  series: [],
  currentSeries: null,
  playerStats: null,
  goalieStats: null,
  loading: false,
  error: null,
  statsLoading: false,
  statsError: null,
};

export const playoffsReducer = createReducer(
  initialState,

  // Load Brackets
  on(PlayoffsActions.loadPlayoffBrackets, (state) => ({ ...state, loading: true, error: null })),
  on(PlayoffsActions.loadPlayoffBracketsSuccess, (state, { brackets }) => ({
    ...state,
    brackets,
    loading: false,
    error: null,
  })),
  on(PlayoffsActions.loadPlayoffBracketsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Single Bracket
  on(PlayoffsActions.loadPlayoffBracket, (state) => ({ ...state, loading: true, error: null })),
  on(PlayoffsActions.loadPlayoffBracketSuccess, (state, { bracket }) => ({
    ...state,
    currentBracket: bracket,
    loading: false,
    error: null,
  })),
  on(PlayoffsActions.loadPlayoffBracketFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Create Bracket
  on(PlayoffsActions.createPlayoffBracket, (state) => ({ ...state, loading: true, error: null })),
  on(PlayoffsActions.createPlayoffBracketSuccess, (state, { bracket }) => ({
    ...state,
    brackets: [...state.brackets, bracket],
    currentBracket: bracket,
    loading: false,
    error: null,
  })),
  on(PlayoffsActions.createPlayoffBracketFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update Bracket
  on(PlayoffsActions.updatePlayoffBracket, (state) => ({ ...state, loading: true, error: null })),
  on(PlayoffsActions.updatePlayoffBracketSuccess, (state, { bracket }) => ({
    ...state,
    brackets: state.brackets.map((b) => (b._id === bracket._id ? bracket : b)),
    currentBracket: state.currentBracket?._id === bracket._id ? bracket : state.currentBracket,
    loading: false,
    error: null,
  })),
  on(PlayoffsActions.updatePlayoffBracketFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Delete Bracket
  on(PlayoffsActions.deletePlayoffBracket, (state) => ({ ...state, loading: true, error: null })),
  on(PlayoffsActions.deletePlayoffBracketSuccess, (state, { bracketId }) => ({
    ...state,
    brackets: state.brackets.filter((b) => b._id !== bracketId),
    currentBracket: state.currentBracket?._id === bracketId ? null : state.currentBracket,
    loading: false,
    error: null,
  })),
  on(PlayoffsActions.deletePlayoffBracketFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update Round Matchups
  on(PlayoffsActions.updateRoundMatchups, (state) => ({ ...state, loading: true, error: null })),
  on(PlayoffsActions.updateRoundMatchupsSuccess, (state, { bracket }) => ({
    ...state,
    brackets: state.brackets.map((b) => (b._id === bracket._id ? bracket : b)),
    currentBracket: state.currentBracket?._id === bracket._id ? bracket : state.currentBracket,
    loading: false,
    error: null,
  })),
  on(PlayoffsActions.updateRoundMatchupsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Generate Matchups
  on(PlayoffsActions.generatePlayoffMatchups, (state) => ({ ...state, loading: true, error: null })),
  on(PlayoffsActions.generatePlayoffMatchupsSuccess, (state, { bracket }) => ({
    ...state,
    brackets: state.brackets.map((b) => (b._id === bracket._id ? bracket : b)),
    currentBracket: state.currentBracket?._id === bracket._id ? bracket : state.currentBracket,
    loading: false,
    error: null,
  })),
  on(PlayoffsActions.generatePlayoffMatchupsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Series
  on(PlayoffsActions.loadPlayoffSeries, (state) => ({ ...state, loading: true, error: null })),
  on(PlayoffsActions.loadPlayoffSeriesSuccess, (state, { series }) => ({
    ...state,
    series,
    loading: false,
    error: null,
  })),
  on(PlayoffsActions.loadPlayoffSeriesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Single Series
  on(PlayoffsActions.loadPlayoffSeriesById, (state) => ({ ...state, loading: true, error: null })),
  on(PlayoffsActions.loadPlayoffSeriesByIdSuccess, (state, { series }) => ({
    ...state,
    currentSeries: series,
    loading: false,
    error: null,
  })),
  on(PlayoffsActions.loadPlayoffSeriesByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Advance Series
  on(PlayoffsActions.advancePlayoffSeries, (state) => ({ ...state, loading: true, error: null })),
  on(PlayoffsActions.advancePlayoffSeriesSuccess, (state, { bracket }) => ({
    ...state,
    brackets: state.brackets.map((b) => (b._id === bracket._id ? bracket : b)),
    currentBracket: state.currentBracket?._id === bracket._id ? bracket : state.currentBracket,
    loading: false,
    error: null,
  })),
  on(PlayoffsActions.advancePlayoffSeriesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Player Stats
  on(PlayoffsActions.loadPlayoffPlayerStats, (state) => ({ ...state, statsLoading: true, statsError: null })),
  on(PlayoffsActions.loadPlayoffPlayerStatsSuccess, (state, { stats }) => ({
    ...state,
    playerStats: stats,
    statsLoading: false,
    statsError: null,
  })),
  on(PlayoffsActions.loadPlayoffPlayerStatsFailure, (state, { error }) => ({
    ...state,
    statsLoading: false,
    statsError: error,
  })),

  // Load Goalie Stats
  on(PlayoffsActions.loadPlayoffGoalieStats, (state) => ({ ...state, statsLoading: true, statsError: null })),
  on(PlayoffsActions.loadPlayoffGoalieStatsSuccess, (state, { stats }) => ({
    ...state,
    goalieStats: stats,
    statsLoading: false,
    statsError: null,
  })),
  on(PlayoffsActions.loadPlayoffGoalieStatsFailure, (state, { error }) => ({
    ...state,
    statsLoading: false,
    statsError: error,
  })),

  // Clear Actions
  on(PlayoffsActions.clearPlayoffBrackets, (state) => ({
    ...state,
    brackets: [],
    currentBracket: null,
  })),
  on(PlayoffsActions.clearCurrentPlayoffBracket, (state) => ({
    ...state,
    currentBracket: null,
  }))
);

