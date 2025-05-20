import { createAction, props } from '@ngrx/store';
import { PlayerProfile } from './models/models/player-profile.model';

export const loadPlayers = createAction('[Players] Load Players');
export const loadPlayersSuccess = createAction('[Players] Load Players Success', props<{ players: PlayerProfile[] }>());
export const loadPlayersFailure = createAction('[Players] Load Players Failure', props<{ error: any }>());

// Auth/Profile actions
export const loginWithDiscordProfile = createAction('[Player] Login With Discord Profile', props<{ discordProfile: any }>());
export const loadPlayerProfile = createAction('[Player] Load Player Profile', props<{ name: string; discordProfile: any }>());
export const loadPlayerProfileSuccess = createAction('[Player] Load Player Profile Success', props<{ profile: PlayerProfile | null; discordProfile: any }>());
export const upsertPlayerProfile = createAction('[Player] Upsert Player Profile', props<{ profile: PlayerProfile }>());
export const upsertPlayerProfileSuccess = createAction('[Player] Upsert Player Profile Success', props<{ profile: PlayerProfile }>());
export const playerProfileFailure = createAction('[Player] Player Profile Failure', props<{ error: any }>());
