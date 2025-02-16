import { createReducer, on } from '@ngrx/store';
import { FreeAgent } from './free-agents.model';
import * as FreeAgentsActions from './free-agents.actions';

export interface FreeAgentsState {
  freeAgents: FreeAgent[];
  loading: boolean;
  error: string | null;
}

export const initialState: FreeAgentsState = {
  freeAgents: [],
  loading: false,
  error: null
};

export const freeAgentsReducer = createReducer(
  initialState,
  
  on(FreeAgentsActions.loadFreeAgents, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(FreeAgentsActions.loadFreeAgentsSuccess, (state, { freeAgents }) => ({
    ...state,
    freeAgents,
    loading: false
  })),
  
  on(FreeAgentsActions.loadFreeAgentsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  on(FreeAgentsActions.addToFreeAgentsSuccess, (state, { freeAgent }) => ({
    ...state,
    freeAgents: [...state.freeAgents, freeAgent]
  })),
  
  on(FreeAgentsActions.updateFreeAgentStatus, (state, { playerId, status }) => ({
    ...state,
    freeAgents: state.freeAgents.map(agent =>
      agent.playerId === playerId ? { ...agent, status } : agent
    )
  }))
); 