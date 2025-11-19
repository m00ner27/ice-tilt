import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import * as PlayoffsActions from './playoffs.actions';

@Injectable()
export class PlayoffsEffects {
  loadBrackets$: any;
  loadBracket$: any;
  createBracket$: any;
  updateBracket$: any;
  deleteBracket$: any;
  updateRoundMatchups$: any;
  generateMatchups$: any;
  loadSeries$: any;
  loadSeriesById$: any;
  advanceSeries$: any;
  loadPlayerStats$: any;
  loadGoalieStats$: any;

  constructor(
    private actions$: Actions,
    private apiService: ApiService
  ) {
    // Load Brackets Effect
    this.loadBrackets$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.loadPlayoffBrackets),
        mergeMap(({ seasonId, divisionId, status }) =>
          this.apiService.getPlayoffBrackets(seasonId, divisionId, status).pipe(
            map((brackets) => PlayoffsActions.loadPlayoffBracketsSuccess({ brackets })),
            catchError((error) => of(PlayoffsActions.loadPlayoffBracketsFailure({ error })))
          )
        )
      )
    );

    // Load Single Bracket Effect
    this.loadBracket$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.loadPlayoffBracket),
        mergeMap(({ bracketId }) =>
          this.apiService.getPlayoffBracket(bracketId).pipe(
            map((bracket) => PlayoffsActions.loadPlayoffBracketSuccess({ bracket })),
            catchError((error) => of(PlayoffsActions.loadPlayoffBracketFailure({ error })))
          )
        )
      )
    );

    // Create Bracket Effect
    this.createBracket$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.createPlayoffBracket),
        mergeMap(({ bracketData }) =>
          this.apiService.createPlayoffBracket(bracketData).pipe(
            map((bracket) => PlayoffsActions.createPlayoffBracketSuccess({ bracket })),
            catchError((error) => of(PlayoffsActions.createPlayoffBracketFailure({ error })))
          )
        )
      )
    );

    // Update Bracket Effect
    this.updateBracket$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.updatePlayoffBracket),
        mergeMap(({ bracketId, bracketData }) =>
          this.apiService.updatePlayoffBracket(bracketId, bracketData).pipe(
            map((bracket) => PlayoffsActions.updatePlayoffBracketSuccess({ bracket })),
            catchError((error) => of(PlayoffsActions.updatePlayoffBracketFailure({ error })))
          )
        )
      )
    );

    // Delete Bracket Effect
    this.deleteBracket$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.deletePlayoffBracket),
        mergeMap(({ bracketId }) =>
          this.apiService.deletePlayoffBracket(bracketId).pipe(
            map(() => PlayoffsActions.deletePlayoffBracketSuccess({ bracketId })),
            catchError((error) => of(PlayoffsActions.deletePlayoffBracketFailure({ error })))
          )
        )
      )
    );

    // Update Round Matchups Effect
    this.updateRoundMatchups$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.updateRoundMatchups),
        mergeMap(({ bracketId, roundOrder, matchups }) =>
          this.apiService.updateRoundMatchups(bracketId, roundOrder, matchups).pipe(
            map((bracket) => PlayoffsActions.updateRoundMatchupsSuccess({ bracket })),
            catchError((error) => of(PlayoffsActions.updateRoundMatchupsFailure({ error })))
          )
        )
      )
    );

    // Generate Matchups Effect
    this.generateMatchups$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.generatePlayoffMatchups),
        mergeMap(({ bracketId }) =>
          this.apiService.generatePlayoffMatchups(bracketId).pipe(
            map((bracket) => PlayoffsActions.generatePlayoffMatchupsSuccess({ bracket })),
            catchError((error) => of(PlayoffsActions.generatePlayoffMatchupsFailure({ error })))
          )
        )
      )
    );

    // Load Series Effect
    this.loadSeries$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.loadPlayoffSeries),
        mergeMap(({ bracketId }) =>
          this.apiService.getPlayoffBracketSeries(bracketId).pipe(
            map((series) => PlayoffsActions.loadPlayoffSeriesSuccess({ series })),
            catchError((error) => of(PlayoffsActions.loadPlayoffSeriesFailure({ error })))
          )
        )
      )
    );

    // Load Series By Id Effect
    this.loadSeriesById$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.loadPlayoffSeriesById),
        mergeMap(({ seriesId, bracketId }) =>
          this.apiService.getPlayoffSeries(seriesId, bracketId).pipe(
            map((series) => PlayoffsActions.loadPlayoffSeriesByIdSuccess({ series })),
            catchError((error) => of(PlayoffsActions.loadPlayoffSeriesByIdFailure({ error })))
          )
        )
      )
    );

    // Advance Series Effect
    this.advanceSeries$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.advancePlayoffSeries),
        mergeMap(({ seriesId, bracketId }) =>
          this.apiService.advancePlayoffSeries(seriesId, bracketId).pipe(
            map((bracket) => PlayoffsActions.advancePlayoffSeriesSuccess({ bracket })),
            catchError((error) => of(PlayoffsActions.advancePlayoffSeriesFailure({ error })))
          )
        )
      )
    );

    // Load Player Stats Effect
    this.loadPlayerStats$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.loadPlayoffPlayerStats),
        mergeMap(({ bracketId, seasonId, clubId }) =>
          this.apiService.getPlayoffPlayerStats(bracketId, seasonId, clubId).pipe(
            map((response) => {
              // Handle both direct array response and wrapped response
              const stats = Array.isArray(response) ? response : (response?.data || response || []);
              return PlayoffsActions.loadPlayoffPlayerStatsSuccess({ stats });
            }),
            catchError((error) => of(PlayoffsActions.loadPlayoffPlayerStatsFailure({ error })))
          )
        )
      )
    );

    // Load Goalie Stats Effect
    this.loadGoalieStats$ = createEffect(() =>
      this.actions$.pipe(
        ofType(PlayoffsActions.loadPlayoffGoalieStats),
        mergeMap(({ bracketId, seasonId, clubId }) =>
          this.apiService.getPlayoffGoalieStats(bracketId, seasonId, clubId).pipe(
            map((response) => {
              // Handle both direct array response and wrapped response
              const stats = Array.isArray(response) ? response : (response?.data || response || []);
              return PlayoffsActions.loadPlayoffGoalieStatsSuccess({ stats });
            }),
            catchError((error) => of(PlayoffsActions.loadPlayoffGoalieStatsFailure({ error })))
          )
        )
      )
    );
  }
}

