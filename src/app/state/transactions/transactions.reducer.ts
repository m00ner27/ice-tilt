import { createReducer, on } from '@ngrx/store';
import { Transaction } from './transactions.model';
import * as TransactionsActions from './transactions.actions';

export interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export const initialState: TransactionsState = {
  transactions: [],
  loading: false,
  error: null
};

export const transactionsReducer = createReducer(
  initialState,
  
  on(TransactionsActions.loadTransactions, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(TransactionsActions.loadTransactionsSuccess, (state, { transactions }) => ({
    ...state,
    transactions,
    loading: false
  })),
  
  on(TransactionsActions.loadTransactionsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  on(TransactionsActions.createTransaction, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(TransactionsActions.createTransactionSuccess, (state, { transaction }) => ({
    ...state,
    transactions: [transaction, ...state.transactions],
    loading: false
  })),
  
  on(TransactionsActions.createTransactionFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  }))
); 