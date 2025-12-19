import { createReducer, on } from '@ngrx/store';
import * as TournamentsActions from './tournaments.actions';

export interface TournamentsState {
  tournaments: TournamentsActions.Tournament[];
  currentTournament: TournamentsActions.Tournament | null;
  brackets: TournamentsActions.TournamentBracket[];
  currentBracket: TournamentsActions.TournamentBracket | null;
  series: TournamentsActions.TournamentSeries[];
  currentSeries: TournamentsActions.TournamentSeries | null;
  playerStats: any;
  goalieStats: any;
  loading: boolean;
  error: any;
  statsLoading: boolean;
  statsError: any;
}

export const initialState: TournamentsState = {
  tournaments: [],
  currentTournament: null,
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

export const tournamentsReducer = createReducer(
  initialState,

  // Load Tournaments
  on(TournamentsActions.loadTournaments, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.loadTournamentsSuccess, (state, { tournaments }) => ({
    ...state,
    tournaments,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.loadTournamentsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Single Tournament
  on(TournamentsActions.loadTournament, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.loadTournamentSuccess, (state, { tournament }) => ({
    ...state,
    currentTournament: tournament,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.loadTournamentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Brackets
  on(TournamentsActions.loadTournamentBrackets, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.loadTournamentBracketsSuccess, (state, { brackets }) => ({
    ...state,
    brackets,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.loadTournamentBracketsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Single Bracket
  on(TournamentsActions.loadTournamentBracket, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.loadTournamentBracketSuccess, (state, { bracket }) => ({
    ...state,
    currentBracket: bracket,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.loadTournamentBracketFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Create Bracket
  on(TournamentsActions.createTournamentBracket, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.createTournamentBracketSuccess, (state, { bracket }) => ({
    ...state,
    brackets: [...state.brackets, bracket],
    currentBracket: bracket,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.createTournamentBracketFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update Bracket
  on(TournamentsActions.updateTournamentBracket, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.updateTournamentBracketSuccess, (state, { bracket }) => ({
    ...state,
    brackets: state.brackets.map((b) => (b._id === bracket._id ? bracket : b)),
    currentBracket: state.currentBracket?._id === bracket._id ? bracket : state.currentBracket,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.updateTournamentBracketFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Delete Bracket
  on(TournamentsActions.deleteTournamentBracket, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.deleteTournamentBracketSuccess, (state, { bracketId }) => ({
    ...state,
    brackets: state.brackets.filter((b) => b._id !== bracketId),
    currentBracket: state.currentBracket?._id === bracketId ? null : state.currentBracket,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.deleteTournamentBracketFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Generate Matchups
  on(TournamentsActions.generateTournamentMatchups, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.generateTournamentMatchupsSuccess, (state, { bracket }) => ({
    ...state,
    brackets: state.brackets.map((b) => (b._id === bracket._id ? bracket : b)),
    currentBracket: state.currentBracket?._id === bracket._id ? bracket : state.currentBracket,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.generateTournamentMatchupsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Series
  on(TournamentsActions.loadTournamentSeries, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.loadTournamentSeriesSuccess, (state, { series }) => ({
    ...state,
    series,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.loadTournamentSeriesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Single Series
  on(TournamentsActions.loadTournamentSeriesById, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.loadTournamentSeriesByIdSuccess, (state, { series }) => ({
    ...state,
    currentSeries: series,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.loadTournamentSeriesByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Advance Series
  on(TournamentsActions.advanceTournamentSeries, (state) => ({ ...state, loading: true, error: null })),
  on(TournamentsActions.advanceTournamentSeriesSuccess, (state, { bracket }) => ({
    ...state,
    brackets: state.brackets.map((b) => (b._id === bracket._id ? bracket : b)),
    currentBracket: state.currentBracket?._id === bracket._id ? bracket : state.currentBracket,
    loading: false,
    error: null,
  })),
  on(TournamentsActions.advanceTournamentSeriesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Player Stats
  on(TournamentsActions.loadTournamentPlayerStats, (state) => ({ ...state, statsLoading: true, statsError: null })),
  on(TournamentsActions.loadTournamentPlayerStatsSuccess, (state, { stats }) => ({
    ...state,
    playerStats: stats,
    statsLoading: false,
    statsError: null,
  })),
  on(TournamentsActions.loadTournamentPlayerStatsFailure, (state, { error }) => ({
    ...state,
    statsLoading: false,
    statsError: error,
  })),

  // Load Goalie Stats
  on(TournamentsActions.loadTournamentGoalieStats, (state) => ({ ...state, statsLoading: true, statsError: null })),
  on(TournamentsActions.loadTournamentGoalieStatsSuccess, (state, { stats }) => ({
    ...state,
    goalieStats: stats,
    statsLoading: false,
    statsError: null,
  })),
  on(TournamentsActions.loadTournamentGoalieStatsFailure, (state, { error }) => ({
    ...state,
    statsLoading: false,
    statsError: error,
  })),

  // Clear Actions
  on(TournamentsActions.clearTournamentBrackets, (state) => ({
    ...state,
    brackets: [],
    currentBracket: null,
  })),
  on(TournamentsActions.clearCurrentTournamentBracket, (state) => ({
    ...state,
    currentBracket: null,
  }))
);

