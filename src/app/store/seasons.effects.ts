import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import * as SeasonsActions from './seasons.actions';

@Injectable()
export class SeasonsEffects {
  loadSeasons$: any;
  createSeason$: any;
  updateSeason$: any;
  deleteSeason$: any;
  setActiveSeason$: any;

  constructor(
    private actions$: Actions,
    private apiService: ApiService
  ) {
    // Load Seasons Effect
    this.loadSeasons$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SeasonsActions.loadSeasons),
        mergeMap(() =>
          this.apiService.getSeasons().pipe(
            map(seasons => SeasonsActions.loadSeasonsSuccess({ seasons: seasons || [] })),
            catchError(error => of(SeasonsActions.loadSeasonsFailure({ error })))
          )
        )
      )
    );

    // Create Season Effect
    this.createSeason$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SeasonsActions.createSeason),
        mergeMap(({ seasonData }) =>
          this.apiService.addSeason(seasonData).pipe(
            map(season => SeasonsActions.createSeasonSuccess({ season })),
            catchError(error => of(SeasonsActions.createSeasonFailure({ error })))
          )
        )
      )
    );

    // Update Season Effect
    this.updateSeason$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SeasonsActions.updateSeason),
        mergeMap(({ season }) =>
          this.apiService.updateSeason(season).pipe(
            map(updatedSeason => SeasonsActions.updateSeasonSuccess({ season: updatedSeason })),
            catchError(error => of(SeasonsActions.updateSeasonFailure({ error })))
          )
        )
      )
    );

    // Delete Season Effect
    this.deleteSeason$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SeasonsActions.deleteSeason),
        mergeMap(({ seasonId }) =>
          this.apiService.deleteSeason(seasonId).pipe(
            map(() => SeasonsActions.deleteSeasonSuccess({ seasonId })),
            catchError(error => of(SeasonsActions.deleteSeasonFailure({ error })))
          )
        )
      )
    );

    // Set Active Season Effect
    this.setActiveSeason$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SeasonsActions.setActiveSeason),
        mergeMap(({ seasonId }) => {
          // First, deactivate all seasons, then activate the selected one
          const deactivateAll = this.apiService.updateSeason({ _id: '', isActive: false });
          const activateSelected = this.apiService.updateSeason({ _id: seasonId, isActive: true });
          
          return activateSelected.pipe(
            map(season => SeasonsActions.setActiveSeasonSuccess({ season })),
            catchError(error => of(SeasonsActions.setActiveSeasonFailure({ error })))
          );
        })
      )
    );
  }
}
