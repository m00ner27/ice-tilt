import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import * as DivisionsActions from './divisions.actions';

@Injectable()
export class DivisionsEffects {
  loadDivisions$: any;
  loadDivisionsBySeason$: any;
  createDivision$: any;
  updateDivision$: any;
  deleteDivision$: any;

  constructor(
    private actions$: Actions,
    private apiService: ApiService
  ) {
    // Load Divisions Effect
    this.loadDivisions$ = createEffect(() =>
      this.actions$.pipe(
        ofType(DivisionsActions.loadDivisions),
        mergeMap(() =>
          this.apiService.getDivisions().pipe(
            map(divisions => DivisionsActions.loadDivisionsSuccess({ divisions })),
            catchError(error => of(DivisionsActions.loadDivisionsFailure({ error })))
          )
        )
      )
    );

    // Load Divisions by Season Effect
    this.loadDivisionsBySeason$ = createEffect(() =>
      this.actions$.pipe(
        ofType(DivisionsActions.loadDivisionsBySeason),
        mergeMap(({ seasonId }) =>
          this.apiService.getDivisionsBySeason(seasonId).pipe(
            map(divisions => DivisionsActions.loadDivisionsBySeasonSuccess({ divisions })),
            catchError(error => of(DivisionsActions.loadDivisionsBySeasonFailure({ error })))
          )
        )
      )
    );

    // Create Division Effect
    this.createDivision$ = createEffect(() =>
      this.actions$.pipe(
        ofType(DivisionsActions.createDivision),
        mergeMap(({ divisionData }) =>
          this.apiService.addDivision(divisionData).pipe(
            map(division => DivisionsActions.createDivisionSuccess({ division })),
            catchError(error => of(DivisionsActions.createDivisionFailure({ error })))
          )
        )
      )
    );

    // Update Division Effect
    this.updateDivision$ = createEffect(() =>
      this.actions$.pipe(
        ofType(DivisionsActions.updateDivision),
        mergeMap(({ division }) =>
          this.apiService.updateDivision(division).pipe(
            map(updatedDivision => DivisionsActions.updateDivisionSuccess({ division: updatedDivision })),
            catchError(error => of(DivisionsActions.updateDivisionFailure({ error })))
          )
        )
      )
    );

    // Delete Division Effect
    this.deleteDivision$ = createEffect(() =>
      this.actions$.pipe(
        ofType(DivisionsActions.deleteDivision),
        mergeMap(({ divisionId }) =>
          this.apiService.deleteDivision(divisionId).pipe(
            map(() => DivisionsActions.deleteDivisionSuccess({ divisionId })),
            catchError(error => of(DivisionsActions.deleteDivisionFailure({ error })))
          )
        )
      )
    );
  }
}
