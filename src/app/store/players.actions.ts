import { createAction, props } from '@ngrx/store';
import { PlayerProfile } from './models/models/player-profile.model';

// Player interface for the admin system
export interface Player {
  _id: string;
  gamertag: string;
  discordId?: string;
  discordUsername?: string;
  platform: string;
  position: string;
  status: string;
  playerProfile?: {
    position?: string;
    status?: string;
    handedness?: string;
    location?: string;
    region?: string;
  };
}

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

// Player Stats actions
export const loadPlayerStats = createAction('[Player] Load Player Stats', props<{ userId: string; gamertag: string }>());
export const loadPlayerStatsSuccess = createAction('[Player] Load Player Stats Success', props<{ stats: any[] }>());
export const loadPlayerStatsFailure = createAction('[Player] Load Player Stats Failure', props<{ error: any }>());

// Admin Player Management actions
export const createPlayer = createAction('[Players] Create Player', props<{ playerData: Partial<Player> }>());
export const createPlayerSuccess = createAction('[Players] Create Player Success', props<{ player: Player }>());
export const createPlayerFailure = createAction('[Players] Create Player Failure', props<{ error: any }>());

export const loadFreeAgents = createAction('[Players] Load Free Agents');
export const loadFreeAgentsSuccess = createAction('[Players] Load Free Agents Success', props<{ freeAgents: Player[] }>());
export const loadFreeAgentsFailure = createAction('[Players] Load Free Agents Failure', props<{ error: any }>());

// Season-specific free agents
export const loadFreeAgentsForSeason = createAction('[Players] Load Free Agents For Season', props<{ seasonId: string }>());
export const loadFreeAgentsForSeasonSuccess = createAction('[Players] Load Free Agents For Season Success', props<{ seasonId: string; freeAgents: Player[] }>());
export const loadFreeAgentsForSeasonFailure = createAction('[Players] Load Free Agents For Season Failure', props<{ seasonId: string; error: any }>());

export const deletePlayer = createAction('[Players] Delete Player', props<{ playerId: string }>());
export const deletePlayerSuccess = createAction('[Players] Delete Player Success', props<{ playerId: string }>());
export const deletePlayerFailure = createAction('[Players] Delete Player Failure', props<{ error: any }>());

// Load all players (admin-created players) - public endpoint
export const loadAllPlayers = createAction('[Players] Load All Players');
export const loadAllPlayersSuccess = createAction('[Players] Load All Players Success', props<{ players: Player[] }>());
export const loadAllPlayersFailure = createAction('[Players] Load All Players Failure', props<{ error: any }>());
