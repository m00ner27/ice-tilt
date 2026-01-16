import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { PlayerProfileService } from './services/player-profile.service';
import { PlayerStatsService } from './services/player-stats.service';
import { ApiService } from './services/api.service';
import * as PlayersActions from './players.actions';
import { PlayerProfile } from './models/models/player-profile.model';

@Injectable()
export class PlayersEffects {
  loadPlayers$: any;
  loginWithDiscordProfile$: any;
  loadPlayerProfile$: any;
  mergeAndUpsertProfile$: any;
  loadPlayerStats$: any;
  createPlayer$: any;
  loadFreeAgents$: any;
  loadFreeAgentsForSeason$: any;
  deletePlayer$: any;
  loadAllPlayers$: any;

  constructor(
    private actions$: Actions,
    private playerProfileService: PlayerProfileService,
    private playerStatsService: PlayerStatsService,
    private apiService: ApiService
  ) {
    this.loadPlayers$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.loadPlayers),
        mergeMap(() =>
          this.playerProfileService.getAllPlayerProfiles().pipe(
            map((players: PlayerProfile[]) => PlayersActions.loadPlayersSuccess({ players })),
            catchError(error => of(PlayersActions.loadPlayersFailure({ error })))
          )
        )
      );
    });

    this.loginWithDiscordProfile$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.loginWithDiscordProfile),
        mergeMap(({ discordProfile }) => {
          // For now, just return a success with null profile since the service doesn't have this method
          return of(PlayersActions.loadPlayerProfileSuccess({ profile: null, discordProfile }));
        })
      );
    });

    this.loadPlayerProfile$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.loadPlayerProfile),
        mergeMap(({ name, discordProfile }) =>
          this.playerProfileService.getProfileByName(name).pipe(
            map((profile: PlayerProfile | null) => PlayersActions.loadPlayerProfileSuccess({ profile, discordProfile })),
            catchError(error => of(PlayersActions.playerProfileFailure({ error })))
          )
        )
      );
    });

    this.mergeAndUpsertProfile$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.upsertPlayerProfile),
        mergeMap(({ profile }) =>
          this.playerProfileService.upsertPlayerProfile(profile).pipe(
            map((updatedProfile: PlayerProfile) => PlayersActions.upsertPlayerProfileSuccess({ profile: updatedProfile })),
            catchError(error => of(PlayersActions.playerProfileFailure({ error })))
          )
        )
      );
    });

    this.loadPlayerStats$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.loadPlayerStats),
        mergeMap(({ userId, gamertag }) =>
          this.playerStatsService.getPlayerStats(userId, gamertag).pipe(
            map((stats: any) => PlayersActions.loadPlayerStatsSuccess({ stats: [stats] })),
            catchError(error => of(PlayersActions.loadPlayerStatsFailure({ error })))
          )
        )
      );
    });

    this.createPlayer$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.createPlayer),
        mergeMap(({ playerData }) => {
          console.log('PlayersEffects: createPlayer action received', playerData);
          return this.apiService.createPlayer(playerData).pipe(
            map((response: any) => {
              console.log('PlayersEffects: createPlayer API success', response);
              return PlayersActions.createPlayerSuccess({ player: response });
            }),
            catchError(error => {
              console.error('PlayersEffects: createPlayer API error', error);
              return of(PlayersActions.createPlayerFailure({ error }));
            })
          );
        })
      );
    });

    this.loadFreeAgents$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.loadFreeAgents),
        mergeMap(() =>
          this.apiService.getFreeAgents().pipe(
            map((agents: any[]) => {
              // Map API response to Player objects
              const players = agents.map((agent: any): PlayersActions.Player => ({
                _id: agent._id,
                gamertag: agent.gamertag || 'Unknown',
                discordId: agent.discordId,
                discordUsername: agent.discordUsername,
                platform: agent.platform || 'PS5',
                position: agent.playerProfile?.position || 'C',
                status: agent.playerProfile?.status || 'Free Agent',
                playerProfile: agent.playerProfile
              }));
              return PlayersActions.loadFreeAgentsSuccess({ freeAgents: players });
            }),
            catchError(error => of(PlayersActions.loadFreeAgentsFailure({ error })))
          )
        )
      );
    });

    this.loadFreeAgentsForSeason$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.loadFreeAgentsForSeason),
        mergeMap(({ seasonId }) => {
          console.log('PlayersEffects: loadFreeAgentsForSeason action received for season:', seasonId);
          return this.apiService.getFreeAgentsForSeason(seasonId).pipe(
            map((agents: any[]) => {
              console.log('PlayersEffects: getFreeAgentsForSeason API response for season', seasonId, ':', agents?.length || 0, 'agents');
              // Map API response to Player objects
              const players = agents.map((agent: any): PlayersActions.Player => ({
                _id: agent._id,
                gamertag: agent.gamertag || 'Unknown',
                discordId: agent.discordId,
                discordUsername: agent.discordUsername,
                platform: agent.platform || 'PS5',
                position: agent.playerProfile?.position || 'C',
                status: agent.playerProfile?.status || 'Free Agent',
                playerProfile: agent.playerProfile
              }));
              console.log('PlayersEffects: Mapped players for season', seasonId, ':', players.length);
              return PlayersActions.loadFreeAgentsForSeasonSuccess({ seasonId, freeAgents: players });
            }),
            catchError(error => {
              console.error('PlayersEffects: Error loading free agents for season', seasonId, ':', error);
              return of(PlayersActions.loadFreeAgentsForSeasonFailure({ seasonId, error }));
            })
          );
        })
      );
    });

    this.deletePlayer$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.deletePlayer),
        mergeMap(({ playerId }) => {
          console.log('PlayersEffects: deletePlayer action received for playerId:', playerId);
          return this.apiService.deletePlayer(playerId).pipe(
            map((response: any) => {
              console.log('PlayersEffects: deletePlayer API success', response);
              return PlayersActions.deletePlayerSuccess({ playerId });
            }),
            catchError(error => {
              console.error('PlayersEffects: deletePlayer API error', error);
              return of(PlayersActions.deletePlayerFailure({ error }));
            })
          );
        })
      );
    });

    this.loadAllPlayers$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.loadAllPlayers),
        mergeMap(() =>
          this.apiService.getAllPlayers().pipe(
            map((players: any[]) => {
              // Map API response to Player objects
              const mappedPlayers = players.map((player: any): PlayersActions.Player => ({
                _id: player._id,
                gamertag: player.gamertag || 'Unknown',
                discordId: player.discordId,
                discordUsername: player.discordUsername,
                platform: player.platform || 'PS5',
                position: player.playerProfile?.position || 'C',
                status: player.playerProfile?.status || 'Free Agent',
                playerProfile: player.playerProfile
              }));
              return PlayersActions.loadAllPlayersSuccess({ players: mappedPlayers });
            }),
            catchError(error => of(PlayersActions.loadAllPlayersFailure({ error })))
          )
        )
      );
    });
  }
}