import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import * as DivisionsActions from './divisions.actions';

@Injectable()
export class DivisionsEffects {

  // Load Divisions Effect
  loadDivisions$ = createEffect(() =>
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
  loadDivisionsBySeason$ = createEffect(() =>
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
  createDivision$ = createEffect(() =>
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
  updateDivision$ = createEffect(() =>
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
  deleteDivision$ = createEffect(() =>
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

  constructor(
    private actions$: Actions,
    private apiService: ApiService
  ) {}
}
