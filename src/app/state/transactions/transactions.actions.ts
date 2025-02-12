import { createAction, props } from '@ngrx/store';
import { Transaction } from './transactions.model';

export const loadTransactions = createAction(
  '[Transactions] Load Transactions',
  props<{ seasonId: string }>()
);

export const loadTransactionsSuccess = createAction(
  '[Transactions] Load Transactions Success',
  props<{ transactions: Transaction[] }>()
);

export const loadTransactionsFailure = createAction(
  '[Transactions] Load Transactions Failure',
  props<{ error: string }>()
);

export const createTransaction = createAction(
  '[Transactions] Create Transaction',
  props<{ transaction: Omit<Transaction, 'id'> }>()
);

export const createTransactionSuccess = createAction(
  '[Transactions] Create Transaction Success',
  props<{ transaction: Transaction }>()
);

export const createTransactionFailure = createAction(
  '[Transactions] Create Transaction Failure',
  props<{ error: string }>()
); 