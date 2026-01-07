import { createReducer, on } from '@ngrx/store';
import { loadPlayersSuccess, upsertPlayerProfileSuccess, loadPlayerProfile, playerProfileFailure, loadPlayerStats, loadPlayerStatsSuccess, loadPlayerStatsFailure, createPlayer, createPlayerSuccess, createPlayerFailure, loadFreeAgents, loadFreeAgentsSuccess, loadFreeAgentsFailure, loadFreeAgentsForSeason, loadFreeAgentsForSeasonSuccess, loadFreeAgentsForSeasonFailure, deletePlayer, deletePlayerSuccess, deletePlayerFailure, Player } from './players.actions';
import { PlayerProfile } from './models/models/player-profile.model';

export interface PlayersState {
  players: PlayerProfile[];
  loading: boolean;
  error: any;
  currentProfile: PlayerProfile | null;
  playerStats: any[];
  statsLoading: boolean;
  statsError: any;
  // Admin Player Management
  freeAgents: Player[];
  freeAgentsBySeason: { [seasonId: string]: Player[] };
  adminLoading: boolean;
  adminError: any;
}

export const initialState: PlayersState = {
  players: [],
  loading: false,
  error: null,
  currentProfile: null,
  playerStats: [],
  statsLoading: false,
  statsError: null,
  // Admin Player Management
  freeAgents: [],
  freeAgentsBySeason: {},
  adminLoading: false,
  adminError: null,
};

export const playersReducer = createReducer(
  initialState,
  on(loadPlayersSuccess, (state, { players }) => ({ ...state, players })),
  on(loadPlayerProfile, (state) => ({ ...state, loading: true, error: null })),
  on(upsertPlayerProfileSuccess, (state, { profile }) => ({ ...state, loading: false, currentProfile: profile })),
  on(playerProfileFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(loadPlayerStats, (state) => ({ ...state, statsLoading: true, statsError: null })),
  on(loadPlayerStatsSuccess, (state, { stats }) => ({ ...state, statsLoading: false, playerStats: stats })),
  on(loadPlayerStatsFailure, (state, { error }) => ({ ...state, statsLoading: false, statsError: error })),
  
  // Admin Player Management
  on(createPlayer, (state) => {
    console.log('PlayersReducer: createPlayer action received');
    return { ...state, adminLoading: true, adminError: null };
  }),
  on(createPlayerSuccess, (state, { player }) => {
    console.log('PlayersReducer: createPlayerSuccess action received', player);
    return { 
      ...state, 
      adminLoading: false, 
      freeAgents: [...state.freeAgents, player],
      adminError: null 
    };
  }),
  on(createPlayerFailure, (state, { error }) => {
    console.log('PlayersReducer: createPlayerFailure action received', error);
    return { 
      ...state, 
      adminLoading: false, 
      adminError: error 
    };
  }),
  
  on(loadFreeAgents, (state) => ({ ...state, adminLoading: true, adminError: null })),
  on(loadFreeAgentsSuccess, (state, { freeAgents }) => ({ 
    ...state, 
    adminLoading: false, 
    freeAgents,
    adminError: null 
  })),
  on(loadFreeAgentsFailure, (state, { error }) => ({ 
    ...state, 
    adminLoading: false, 
    adminError: error 
  })),

  // Season-specific free agents
  on(loadFreeAgentsForSeason, (state) => {
    console.log('PlayersReducer: loadFreeAgentsForSeason action received');
    return { ...state, adminLoading: true, adminError: null };
  }),
  on(loadFreeAgentsForSeasonSuccess, (state, { seasonId, freeAgents }) => {
    console.log('PlayersReducer: loadFreeAgentsForSeasonSuccess action received for season', seasonId, 'with', freeAgents.length, 'agents');
    return { 
      ...state, 
      adminLoading: false, 
      freeAgentsBySeason: { ...state.freeAgentsBySeason, [seasonId]: freeAgents },
      adminError: null 
    };
  }),
  on(loadFreeAgentsForSeasonFailure, (state, { seasonId, error }) => {
    console.error('PlayersReducer: loadFreeAgentsForSeasonFailure action received for season', seasonId, 'with error:', error);
    return { 
      ...state, 
      adminLoading: false, 
      adminError: error 
    };
  }),

  // Delete Player
  on(deletePlayer, (state) => {
    console.log('PlayersReducer: deletePlayer action received');
    return { ...state, adminLoading: true, adminError: null };
  }),
  on(deletePlayerSuccess, (state, { playerId }) => {
    console.log('PlayersReducer: deletePlayerSuccess action received for playerId:', playerId);
    return { 
      ...state, 
      adminLoading: false, 
      freeAgents: state.freeAgents.filter(player => player._id !== playerId),
      adminError: null 
    };
  }),
  on(deletePlayerFailure, (state, { error }) => {
    console.log('PlayersReducer: deletePlayerFailure action received', error);
    return { 
      ...state, 
      adminLoading: false, 
      adminError: error 
    };
  })
);
