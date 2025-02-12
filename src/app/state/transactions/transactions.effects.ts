import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as TransactionsActions from './transactions.actions';
import { TransactionsService } from './transactions.service';
import { BaseEffects } from '../base.effects';
import { Transaction } from './transactions.model';

@Injectable()
export class TransactionsEffects extends BaseEffects {
  loadTransactions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionsActions.loadTransactions),
      switchMap((action: { seasonId: string }) =>
        this.transactionsService.getTransactions(action.seasonId).pipe(
          map(transactions => TransactionsActions.loadTransactionsSuccess({ transactions })),
          catchError(error => of(TransactionsActions.loadTransactionsFailure({ error: error.message })))
        )
      )
    )
  );

  createTransaction$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionsActions.createTransaction),
      switchMap((action: { transaction: Omit<Transaction, 'id'> }) =>
        this.transactionsService.createTransaction(action.transaction).pipe(
          map(newTransaction => TransactionsActions.createTransactionSuccess({ transaction: newTransaction })),
          catchError(error => of(TransactionsActions.createTransactionFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private transactionsService: TransactionsService
  ) {
    super(actions$);
  }
} 