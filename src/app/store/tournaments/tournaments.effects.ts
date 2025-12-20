import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import * as TournamentsActions from './tournaments.actions';

@Injectable()
export class TournamentsEffects {
  loadTournaments$: any;
  loadTournament$: any;
  loadBrackets$: any;
  loadBracket$: any;
  createBracket$: any;
  updateBracket$: any;
  deleteBracket$: any;
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
    // Load Tournaments Effect
    this.loadTournaments$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.loadTournaments),
        mergeMap(() =>
          this.apiService.getTournaments().pipe(
            map((tournaments) => TournamentsActions.loadTournamentsSuccess({ tournaments })),
            catchError((error) => of(TournamentsActions.loadTournamentsFailure({ error })))
          )
        )
      )
    );

    // Load Single Tournament Effect
    this.loadTournament$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.loadTournament),
        mergeMap(({ tournamentId }) =>
          this.apiService.getTournamentById(tournamentId).pipe(
            map((tournament) => TournamentsActions.loadTournamentSuccess({ tournament })),
            catchError((error) => of(TournamentsActions.loadTournamentFailure({ error })))
          )
        )
      )
    );

    // Load Brackets Effect
    this.loadBrackets$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.loadTournamentBrackets),
        mergeMap(({ tournamentId, status }) =>
          this.apiService.getTournamentBrackets(tournamentId, status).pipe(
            map((brackets) => TournamentsActions.loadTournamentBracketsSuccess({ brackets })),
            catchError((error) => of(TournamentsActions.loadTournamentBracketsFailure({ error })))
          )
        )
      )
    );

    // Load Single Bracket Effect
    this.loadBracket$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.loadTournamentBracket),
        mergeMap(({ bracketId }) =>
          this.apiService.getTournamentBracketById(bracketId).pipe(
            map((bracket) => TournamentsActions.loadTournamentBracketSuccess({ bracket })),
            catchError((error) => of(TournamentsActions.loadTournamentBracketFailure({ error })))
          )
        )
      )
    );

    // Create Bracket Effect
    this.createBracket$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.createTournamentBracket),
        mergeMap(({ bracketData }) =>
          this.apiService.createTournamentBracket(bracketData).pipe(
            map((bracket) => TournamentsActions.createTournamentBracketSuccess({ bracket })),
            catchError((error) => of(TournamentsActions.createTournamentBracketFailure({ error })))
          )
        )
      )
    );

    // Update Bracket Effect
    this.updateBracket$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.updateTournamentBracket),
        mergeMap(({ bracketId, bracketData }) =>
          this.apiService.updateTournamentBracket(bracketId, bracketData).pipe(
            map((bracket) => TournamentsActions.updateTournamentBracketSuccess({ bracket })),
            catchError((error) => of(TournamentsActions.updateTournamentBracketFailure({ error })))
          )
        )
      )
    );

    // Delete Bracket Effect
    this.deleteBracket$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.deleteTournamentBracket),
        mergeMap(({ bracketId }) =>
          this.apiService.deleteTournamentBracket(bracketId).pipe(
            map(() => TournamentsActions.deleteTournamentBracketSuccess({ bracketId })),
            catchError((error) => of(TournamentsActions.deleteTournamentBracketFailure({ error })))
          )
        )
      )
    );

    // Generate Matchups Effect
    this.generateMatchups$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.generateTournamentMatchups),
        mergeMap(({ bracketId }) =>
          this.apiService.generateTournamentMatchups(bracketId).pipe(
            map((bracket) => TournamentsActions.generateTournamentMatchupsSuccess({ bracket })),
            catchError((error) => {
              try {
                // Handle 400 error (matchups already exist) more gracefully
                let errorMessage = 'Unknown error';
                let errorStatus = 0;
                
                if (error) {
                  if (typeof error === 'object') {
                    errorStatus = error.status || error.error?.status || 0;
                    errorMessage = error.error?.message || error.message || 'Unknown error';
                  } else if (typeof error === 'string') {
                    errorMessage = error;
                  }
                }
                
                // If matchups already exist, reload the bracket instead of failing
                if (errorStatus === 400 && (errorMessage.includes('already generated') || errorMessage.includes('Matchups already'))) {
                  return this.apiService.getTournamentBracketById(bracketId).pipe(
                    map((bracket) => TournamentsActions.generateTournamentMatchupsSuccess({ bracket })),
                    catchError((reloadError) => {
                      const safeError = reloadError || { message: 'Failed to reload bracket' };
                      return of(TournamentsActions.generateTournamentMatchupsFailure({ error: safeError }));
                    })
                  );
                }
                
                // Return a safe error object
                const safeError = error || { message: 'Unknown error occurred' };
                return of(TournamentsActions.generateTournamentMatchupsFailure({ error: safeError }));
              } catch (e) {
                // If anything goes wrong in error handling, return a safe error
                return of(TournamentsActions.generateTournamentMatchupsFailure({ 
                  error: { message: 'Error generating matchups', originalError: String(e) }
                }));
              }
            })
          )
        )
      )
    );

    // Load Series Effect
    this.loadSeries$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.loadTournamentSeries),
        mergeMap(({ bracketId }) =>
          this.apiService.getTournamentBracketSeries(bracketId).pipe(
            map((series) => TournamentsActions.loadTournamentSeriesSuccess({ series })),
            catchError((error) => of(TournamentsActions.loadTournamentSeriesFailure({ error })))
          )
        )
      )
    );

    // Load Series By Id Effect
    this.loadSeriesById$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.loadTournamentSeriesById),
        mergeMap(({ seriesId, bracketId }) =>
          this.apiService.getTournamentSeries(seriesId, bracketId).pipe(
            map((series) => TournamentsActions.loadTournamentSeriesByIdSuccess({ series })),
            catchError((error) => of(TournamentsActions.loadTournamentSeriesByIdFailure({ error })))
          )
        )
      )
    );

    // Advance Series Effect
    this.advanceSeries$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.advanceTournamentSeries),
        mergeMap(({ seriesId, bracketId }) =>
          this.apiService.advanceTournamentSeries(seriesId, bracketId).pipe(
            map((bracket) => TournamentsActions.advanceTournamentSeriesSuccess({ bracket })),
            catchError((error) => of(TournamentsActions.advanceTournamentSeriesFailure({ error })))
          )
        )
      )
    );

    // Load Player Stats Effect
    this.loadPlayerStats$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.loadTournamentPlayerStats),
        mergeMap(({ bracketId, tournamentId, clubId }) =>
          this.apiService.getTournamentPlayerStats(bracketId, tournamentId, clubId).pipe(
            map((response) => {
              const stats = Array.isArray(response) ? response : (response?.data || response || []);
              return TournamentsActions.loadTournamentPlayerStatsSuccess({ stats });
            }),
            catchError((error) => of(TournamentsActions.loadTournamentPlayerStatsFailure({ error })))
          )
        )
      )
    );

    // Load Goalie Stats Effect
    this.loadGoalieStats$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TournamentsActions.loadTournamentGoalieStats),
        mergeMap(({ bracketId, tournamentId, clubId }) =>
          this.apiService.getTournamentGoalieStats(bracketId, tournamentId, clubId).pipe(
            map((response) => {
              const stats = Array.isArray(response) ? response : (response?.data || response || []);
              return TournamentsActions.loadTournamentGoalieStatsSuccess({ stats });
            }),
            catchError((error) => of(TournamentsActions.loadTournamentGoalieStatsFailure({ error })))
          )
        )
      )
    );
  }
}

