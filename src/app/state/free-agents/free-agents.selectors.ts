import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FreeAgentsState } from './free-agents.model';

export const selectFreeAgentsState = createFeatureSelector<FreeAgentsState>('freeAgents');

export const selectAllFreeAgents = createSelector(
  selectFreeAgentsState,
  (state) => state.freeAgents
);

export const selectFreeAgentsLoading = createSelector(
  selectFreeAgentsState,
  (state) => state.loading
);

export const selectFreeAgentsError = createSelector(
  selectFreeAgentsState,
  (state) => state.error
);

export const selectAvailableFreeAgents = createSelector(
  selectAllFreeAgents,
  (freeAgents) => freeAgents.filter(agent => agent.status === 'AVAILABLE')
);

export const selectPendingSignings = createSelector(
  selectAllFreeAgents,
  (freeAgents) => freeAgents.filter(agent => agent.status === 'PENDING_SIGNING')
);

export const selectFreeAgentsByLastClub = (clubId: string) => createSelector(
  selectAllFreeAgents,
  (freeAgents) => freeAgents.filter(agent => agent.lastClubId === clubId)
); 