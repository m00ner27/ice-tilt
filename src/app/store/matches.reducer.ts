import { createReducer, on } from '@ngrx/store';
import { Match } from './models/models/match.interface';
import * as MatchesActions from './matches.actions';

export interface MatchesState {
  matches: Match[];
  selectedMatch: Match | null;
  eashlData: { [matchId: string]: any };
  loading: boolean;
  error: any;
  statsLoading: boolean;
  statsError: any;
}

export const initialState: MatchesState = {
  matches: [],
  selectedMatch: null,
  eashlData: {},
  loading: false,
  error: null,
  statsLoading: false,
  statsError: null,
};

export const matchesReducer = createReducer(
  initialState,

  // Load Matches
  on(MatchesActions.loadMatches, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.loadMatchesSuccess, (state, { matches }) => ({ 
    ...state, 
    matches, 
    loading: false, 
    error: null 
  })),
  on(MatchesActions.loadMatchesFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Single Match
  on(MatchesActions.loadMatch, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.loadMatchSuccess, (state, { match }) => ({ 
    ...state, 
    selectedMatch: match, 
    loading: false, 
    error: null 
  })),
  on(MatchesActions.loadMatchFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Matches by Season
  on(MatchesActions.loadMatchesBySeason, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.loadMatchesBySeasonSuccess, (state, { matches }) => ({ 
    ...state, 
    matches, 
    loading: false, 
    error: null 
  })),
  on(MatchesActions.loadMatchesBySeasonFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Create Match
  on(MatchesActions.createMatch, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.createMatchSuccess, (state, { match }) => ({ 
    ...state, 
    matches: [...state.matches, match], 
    loading: false, 
    error: null 
  })),
  on(MatchesActions.createMatchFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Update Match
  on(MatchesActions.updateMatch, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.updateMatchSuccess, (state, { match }) => ({ 
    ...state, 
    matches: state.matches.map(m => m.id === match.id ? match : m),
    selectedMatch: state.selectedMatch?.id === match.id ? match : state.selectedMatch,
    loading: false, 
    error: null 
  })),
  on(MatchesActions.updateMatchFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Delete Match
  on(MatchesActions.deleteMatch, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.deleteMatchSuccess, (state, { matchId }) => ({ 
    ...state, 
    matches: state.matches.filter(m => m.id !== matchId),
    selectedMatch: state.selectedMatch?.id === matchId ? null : state.selectedMatch,
    loading: false, 
    error: null 
  })),
  on(MatchesActions.deleteMatchFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Bulk Update Matches
  on(MatchesActions.bulkUpdateMatches, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.bulkUpdateMatchesSuccess, (state, { matches }) => ({ 
    ...state, 
    matches, 
    loading: false, 
    error: null 
  })),
  on(MatchesActions.bulkUpdateMatchesFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Merge Matches
  on(MatchesActions.mergeMatches, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.mergeMatchesSuccess, (state, { match }) => ({ 
    ...state, 
    matches: state.matches.map(m => m.id === match.id ? match : m),
    selectedMatch: state.selectedMatch?.id === match.id ? match : state.selectedMatch,
    loading: false, 
    error: null 
  })),
  on(MatchesActions.mergeMatchesFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Save Game Stats
  on(MatchesActions.saveGameStats, (state) => ({ ...state, statsLoading: true, statsError: null })),
  on(MatchesActions.saveGameStatsSuccess, (state, { match }) => ({ 
    ...state, 
    matches: state.matches.map(m => m.id === match.id ? match : m),
    selectedMatch: state.selectedMatch?.id === match.id ? match : state.selectedMatch,
    statsLoading: false, 
    statsError: null 
  })),
  on(MatchesActions.saveGameStatsFailure, (state, { error }) => ({ 
    ...state, 
    statsLoading: false, 
    statsError: error 
  })),

  // Save Manual Game Stats
  on(MatchesActions.saveManualGameStats, (state) => ({ ...state, statsLoading: true, statsError: null })),
  on(MatchesActions.saveManualGameStatsSuccess, (state, { match }) => ({ 
    ...state, 
    matches: state.matches.map(m => m.id === match.id ? match : m),
    selectedMatch: state.selectedMatch?.id === match.id ? match : state.selectedMatch,
    statsLoading: false, 
    statsError: null 
  })),
  on(MatchesActions.saveManualGameStatsFailure, (state, { error }) => ({ 
    ...state, 
    statsLoading: false, 
    statsError: error 
  })),

  // Load Match EASHL Data
  on(MatchesActions.loadMatchEashlData, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.loadMatchEashlDataSuccess, (state, { matchId, eashlData }) => ({ 
    ...state, 
    eashlData: { ...state.eashlData, [matchId]: eashlData },
    loading: false, 
    error: null 
  })),
  on(MatchesActions.loadMatchEashlDataFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Unlink Game Stats
  on(MatchesActions.unlinkGameStats, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.unlinkGameStatsSuccess, (state, { matchId }) => ({ 
    ...state, 
    eashlData: { ...state.eashlData, [matchId]: null },
    loading: false, 
    error: null 
  })),
  on(MatchesActions.unlinkGameStatsFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Clear Actions
  on(MatchesActions.clearMatches, (state) => ({ ...state, matches: [], selectedMatch: null })),
  on(MatchesActions.clearSelectedMatch, (state) => ({ ...state, selectedMatch: null }))
);
