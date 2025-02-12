import { createAction, props } from '@ngrx/store';
import { FreeAgent } from './free-agents.model';

export const loadFreeAgents = createAction(
  '[Free Agents] Load Free Agents',
  props<{ seasonId: string }>()
);

export const loadFreeAgentsSuccess = createAction(
  '[Free Agents] Load Free Agents Success',
  props<{ freeAgents: FreeAgent[] }>()
);

export const loadFreeAgentsFailure = createAction(
  '[Free Agents] Load Free Agents Failure',
  props<{ error: string }>()
);

export const addToFreeAgents = createAction(
  '[Free Agents] Add To Free Agents',
  props<{ playerId: string; seasonId: string }>()
);

export const addToFreeAgentsSuccess = createAction(
  '[Free Agents] Add To Free Agents Success',
  props<{ freeAgent: FreeAgent }>()
);

export const addToFreeAgentsFailure = createAction(
  '[Free Agents] Add To Free Agents Failure',
  props<{ error: string }>()
);

export const updateFreeAgentStatus = createAction(
  '[Free Agents] Update Status',
  props<{ playerId: string; status: FreeAgent['status'] }>()
);

export const signFreeAgent = createAction(
  '[Free Agents] Sign Free Agent',
  props<{ playerId: string; teamId: string }>()
);

export const signFreeAgentSuccess = createAction(
  '[Free Agents] Sign Free Agent Success',
  props<{ result: any }>()  // Replace 'any' with your actual result type
);

export const signFreeAgentFailure = createAction(
  '[Free Agents] Sign Free Agent Failure',
  props<{ error: string }>()
); 