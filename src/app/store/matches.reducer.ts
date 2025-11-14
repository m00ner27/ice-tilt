import { createReducer, on } from '@ngrx/store';
import { EashlMatch } from './services/match.service';
import * as MatchesActions from './matches.actions';

export interface MatchesState {
  matches: EashlMatch[];
  selectedMatch: EashlMatch | null;
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
  on(MatchesActions.loadMatchesSuccess, (state, { matches }) => {
    // Don't overwrite matches that have player stats with matches that don't
    // This prevents loadMatches() from overwriting matches loaded with loadMatchesBySeasonWithStats()
    const currentMatchesHaveStats = state.matches.some(m => 
      m.eashlData?.players || (m.playerStats && m.playerStats.length > 0)
    );
    const incomingMatchesHaveStats = matches.some(m => 
      m.eashlData?.players || (m.playerStats && m.playerStats.length > 0)
    );
    
    // Always prefer matches with stats - never overwrite stats with non-stats
    if (currentMatchesHaveStats && !incomingMatchesHaveStats) {
      console.warn('[MatchesReducer] loadMatchesSuccess - Rejecting matches without stats, keeping current matches with stats');
      // Keep current matches with stats, don't overwrite
      return { 
        ...state, 
        loading: false, 
        error: null 
      };
    }
    
    // Overwrite if: current has no stats, or incoming has stats (prefer stats)
    return { 
      ...state, 
      matches, 
      loading: false, 
      error: null 
    };
  }),
  on(MatchesActions.loadMatchesFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Matches With Stats (includes full player data)
  on(MatchesActions.loadMatchesWithStats, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.loadMatchesWithStatsSuccess, (state, { matches }) => ({ 
    ...state, 
    matches, 
    loading: false, 
    error: null 
  })),
  on(MatchesActions.loadMatchesWithStatsFailure, (state, { error }) => ({ 
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

  // Load Single Match With Stats (includes full player data)
  on(MatchesActions.loadMatchWithStats, (state) => {
    console.log('[MatchesReducer] loadMatchWithStats action received');
    return { ...state, loading: true, error: null };
  }),
  on(MatchesActions.loadMatchWithStatsSuccess, (state, { match }) => {
    console.log('[MatchesReducer] loadMatchWithStatsSuccess - Received match');
    if (match) {
      console.log('[MatchesReducer] loadMatchWithStatsSuccess - Match has eashlData:', !!match.eashlData);
      console.log('[MatchesReducer] loadMatchWithStatsSuccess - Match has eashlData.players:', !!match.eashlData?.players);
      console.log('[MatchesReducer] loadMatchWithStatsSuccess - Match has playerStats:', !!match.playerStats);
      console.log('[MatchesReducer] loadMatchWithStatsSuccess - Match playerStats length:', match.playerStats?.length || 0);
    }
    // Update both selectedMatch and add to matches array if not already present
    const existingMatchIndex = state.matches.findIndex(m => m.id === match.id);
    const updatedMatches = existingMatchIndex >= 0
      ? state.matches.map((m, i) => i === existingMatchIndex ? match : m)
      : [...state.matches, match];
    
    return { 
      ...state, 
      selectedMatch: match,
      matches: updatedMatches,
      loading: false, 
      error: null 
    };
  }),
  on(MatchesActions.loadMatchWithStatsFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Matches by Season
  on(MatchesActions.loadMatchesBySeason, (state) => ({ ...state, loading: true, error: null })),
  on(MatchesActions.loadMatchesBySeasonSuccess, (state, { matches }) => {
    // Don't overwrite matches that have player stats with matches that don't
    // This prevents loadMatchesBySeason() from overwriting matches loaded with loadMatchesBySeasonWithStats()
    const currentMatchesHaveStats = state.matches.some(m => 
      m.eashlData?.players || (m.playerStats && m.playerStats.length > 0)
    );
    const incomingMatchesHaveStats = matches.some(m => 
      m.eashlData?.players || (m.playerStats && m.playerStats.length > 0)
    );
    
    // Always prefer matches with stats - never overwrite stats with non-stats
    if (currentMatchesHaveStats && !incomingMatchesHaveStats) {
      console.warn('[MatchesReducer] loadMatchesBySeasonSuccess - Rejecting matches without stats, keeping current matches with stats');
      // Keep current matches with stats, don't overwrite
      return { 
        ...state, 
        loading: false, 
        error: null 
      };
    }
    
    // Overwrite if: current has no stats, or incoming has stats (prefer stats)
    return { 
      ...state, 
      matches, 
      loading: false, 
      error: null 
    };
  }),
  on(MatchesActions.loadMatchesBySeasonFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Matches by Season With Stats (includes full player data)
  on(MatchesActions.loadMatchesBySeasonWithStats, (state) => {
    console.log('[MatchesReducer] loadMatchesBySeasonWithStats action received');
    return { ...state, loading: true, error: null };
  }),
  on(MatchesActions.loadMatchesBySeasonWithStatsSuccess, (state, { matches }) => {
    console.log('[MatchesReducer] loadMatchesBySeasonWithStatsSuccess - Received', matches?.length || 0, 'matches');
    if (matches && matches.length > 0) {
      const sampleMatch = matches[0];
      console.log('[MatchesReducer] loadMatchesBySeasonWithStatsSuccess - Sample match has eashlData:', !!sampleMatch.eashlData);
      console.log('[MatchesReducer] loadMatchesBySeasonWithStatsSuccess - Sample match has eashlData.players:', !!sampleMatch.eashlData?.players);
      console.log('[MatchesReducer] loadMatchesBySeasonWithStatsSuccess - Sample match has playerStats:', !!sampleMatch.playerStats);
      console.log('[MatchesReducer] loadMatchesBySeasonWithStatsSuccess - Sample match playerStats length:', sampleMatch.playerStats?.length || 0);
      if (sampleMatch.eashlData?.players) {
        console.log('[MatchesReducer] loadMatchesBySeasonWithStatsSuccess - Sample match eashlData.players is an object with keys:', Object.keys(sampleMatch.eashlData.players).length);
      }
    }
    return { 
      ...state, 
      matches, 
      loading: false, 
      error: null 
    };
  }),
  on(MatchesActions.loadMatchesBySeasonWithStatsFailure, (state, { error }) => ({ 
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
