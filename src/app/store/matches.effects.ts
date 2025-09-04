import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import * as MatchesActions from './matches.actions';

@Injectable()
export class MatchesEffects {

  // Load Matches Effect
  loadMatches$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.loadMatches),
      mergeMap(() =>
        this.apiService.getGames().pipe(
          map(matches => MatchesActions.loadMatchesSuccess({ matches })),
          catchError(error => of(MatchesActions.loadMatchesFailure({ error })))
        )
      )
    )
  );

  // Load Single Match Effect
  loadMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.loadMatch),
      mergeMap(({ matchId }) =>
        this.apiService.getGame(matchId).pipe(
          map(match => MatchesActions.loadMatchSuccess({ match })),
          catchError(error => of(MatchesActions.loadMatchFailure({ error })))
        )
      )
    )
  );

  // Load Matches by Season Effect
  loadMatchesBySeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.loadMatchesBySeason),
      mergeMap(({ seasonId }) =>
        this.apiService.getGamesBySeason(seasonId).pipe(
          map(matches => MatchesActions.loadMatchesBySeasonSuccess({ matches })),
          catchError(error => of(MatchesActions.loadMatchesBySeasonFailure({ error })))
        )
      )
    )
  );

  // Create Match Effect
  createMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.createMatch),
      mergeMap(({ matchData }) =>
        this.apiService.addGame(matchData).pipe(
          map(match => MatchesActions.createMatchSuccess({ match })),
          catchError(error => of(MatchesActions.createMatchFailure({ error })))
        )
      )
    )
  );

  // Delete Match Effect
  deleteMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.deleteMatch),
      mergeMap(({ matchId }) =>
        this.apiService.deleteGame(matchId).pipe(
          map(() => MatchesActions.deleteMatchSuccess({ matchId })),
          catchError(error => of(MatchesActions.deleteMatchFailure({ error })))
        )
      )
    )
  );

  // Bulk Update Matches Effect
  bulkUpdateMatches$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.bulkUpdateMatches),
      mergeMap(({ updates }) =>
        this.apiService.bulkUpdateGames(updates).pipe(
          map(matches => MatchesActions.bulkUpdateMatchesSuccess({ matches })),
          catchError(error => of(MatchesActions.bulkUpdateMatchesFailure({ error })))
        )
      )
    )
  );

  // Merge Matches Effect
  mergeMatches$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.mergeMatches),
      mergeMap(({ primaryMatchId, secondaryMatchId }) =>
        this.apiService.mergeGames(primaryMatchId, secondaryMatchId).pipe(
          map(match => MatchesActions.mergeMatchesSuccess({ match })),
          catchError(error => of(MatchesActions.mergeMatchesFailure({ error })))
        )
      )
    )
  );

  // Save Game Stats Effect
  saveGameStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.saveGameStats),
      mergeMap(({ stats }) =>
        this.apiService.saveGameStats(stats).pipe(
          map(match => MatchesActions.saveGameStatsSuccess({ match })),
          catchError(error => of(MatchesActions.saveGameStatsFailure({ error })))
        )
      )
    )
  );

  // Save Manual Game Stats Effect
  saveManualGameStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.saveManualGameStats),
      mergeMap(({ gameStats }) =>
        this.apiService.saveManualGameStats(gameStats).pipe(
          map(match => MatchesActions.saveManualGameStatsSuccess({ match })),
          catchError(error => of(MatchesActions.saveManualGameStatsFailure({ error })))
        )
      )
    )
  );

  // Load Match EASHL Data Effect
  loadMatchEashlData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.loadMatchEashlData),
      mergeMap(({ matchId }) =>
        this.apiService.getGameEashlData(matchId).pipe(
          map(eashlData => MatchesActions.loadMatchEashlDataSuccess({ matchId, eashlData })),
          catchError(error => of(MatchesActions.loadMatchEashlDataFailure({ error })))
        )
      )
    )
  );

  // Unlink Game Stats Effect
  unlinkGameStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchesActions.unlinkGameStats),
      mergeMap(({ matchId }) =>
        this.apiService.unlinkGameStats(matchId).pipe(
          map(() => MatchesActions.unlinkGameStatsSuccess({ matchId })),
          catchError(error => of(MatchesActions.unlinkGameStatsFailure({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private apiService: ApiService
  ) {}
}
