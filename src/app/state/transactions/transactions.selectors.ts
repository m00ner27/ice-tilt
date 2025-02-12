import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TransactionsState } from './transactions.reducer';

export const selectTransactionsState = createFeatureSelector<TransactionsState>('transactions');

export const selectAllTransactions = createSelector(
  selectTransactionsState,
  (state) => state.transactions
);

export const selectTransactionsLoading = createSelector(
  selectTransactionsState,
  (state) => state.loading
);

export const selectTransactionsError = createSelector(
  selectTransactionsState,
  (state) => state.error
);

export const selectPendingTransactions = createSelector(
  selectAllTransactions,
  (transactions) => transactions.filter(t => t.status === 'PENDING')
);

export const selectTransactionsByClub = (clubId: string) => createSelector(
  selectAllTransactions,
  (transactions) => transactions.filter(t => 
    t.fromClubId === clubId || t.toClubId === clubId
  )
);

export const selectTransactionsByPlayer = (playerId: string) => createSelector(
  selectAllTransactions,
  (transactions) => transactions.filter(t => t.playerId === playerId)
);

export const selectRecentTransactions = createSelector(
  selectAllTransactions,
  (transactions) => [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
); 