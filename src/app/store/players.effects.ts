import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { PlayerProfileService } from './services/player-profile.service';
import { PlayerStatsService } from './services/player-stats.service';
import * as PlayersActions from './players.actions';
import { PlayerProfile } from './models/models/player-profile.model';

@Injectable()
export class PlayersEffects {
  loadPlayers$: any;
  loginWithDiscordProfile$: any;
  loadPlayerProfile$: any;
  mergeAndUpsertProfile$: any;
  loadPlayerStats$: any;

  constructor(
    private actions$: Actions,
    private playerProfileService: PlayerProfileService,
    private playerStatsService: PlayerStatsService
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
        map(({ discordProfile }) => {
          const name = discordProfile.name || discordProfile.nickname || discordProfile.email || '';
          return PlayersActions.loadPlayerProfile({ name, discordProfile });
        })
      );
    });

    this.loadPlayerProfile$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.loadPlayerProfile),
        mergeMap(({ name, discordProfile }) =>
          this.playerProfileService.getProfileByName(name).pipe(
            map(profile => PlayersActions.loadPlayerProfileSuccess({ profile, discordProfile })),
            catchError(error => of(PlayersActions.playerProfileFailure({ error })))
          )
        )
      );
    });

    this.mergeAndUpsertProfile$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.loadPlayerProfileSuccess),
        mergeMap(({ profile, discordProfile }) => {
          const name = discordProfile?.name || discordProfile?.nickname || discordProfile?.email || profile?.name || '';
          const mergedProfile: PlayerProfile = {
            name,
            handedness: profile?.handedness ?? undefined,
            position: profile?.position ?? 'Forward',
            secondaryPositions: profile?.secondaryPositions ?? [],
            location: profile?.location ?? '',
            region: profile?.region ?? '',
            psnId: profile?.psnId ?? '',
            xboxGamertag: profile?.xboxGamertag ?? '',
            bio: discordProfile?.bio || profile?.bio || '',
            status: profile?.status ?? 'Signed',
            currentClubId: profile?.currentClubId ?? null,
          };
          return this.playerProfileService.upsertPlayerProfile(mergedProfile).pipe(
            map(saved => PlayersActions.upsertPlayerProfileSuccess({ profile: saved })),
            catchError(error => of(PlayersActions.playerProfileFailure({ error })))
          );
        })
      );
    });

    this.loadPlayerStats$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(PlayersActions.loadPlayerStats),
        mergeMap(({ userId, gamertag }) =>
          this.playerStatsService.getPlayerStats(userId, gamertag).pipe(
            map(stats => PlayersActions.loadPlayerStatsSuccess({ stats: [stats] })),
            catchError(error => of(PlayersActions.loadPlayerStatsFailure({ error })))
          )
        )
      );
    });
  }
}
