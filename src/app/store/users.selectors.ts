import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UsersState } from './users.reducer';

// Feature selector
export const selectUsersState = createFeatureSelector<UsersState>('users');

// Basic selectors
export const selectAllUsers = createSelector(
  selectUsersState,
  (state: UsersState) => state?.users || []
);

export const selectSelectedUser = createSelector(
  selectUsersState,
  (state: UsersState) => state?.selectedUser || null
);

export const selectCurrentUser = createSelector(
  selectUsersState,
  (state: UsersState) => state?.currentUser || null
);

export const selectFreeAgents = createSelector(
  selectUsersState,
  (state: UsersState) => state?.freeAgents || []
);

export const selectInboxOffers = createSelector(
  selectUsersState,
  (state: UsersState) => state?.inboxOffers || []
);

export const selectUsersLoading = createSelector(
  selectUsersState,
  (state: UsersState) => state?.loading || false
);

export const selectUsersError = createSelector(
  selectUsersState,
  (state: UsersState) => state?.error || null
);

export const selectOffersLoading = createSelector(
  selectUsersState,
  (state: UsersState) => state?.offersLoading || false
);

export const selectOffersError = createSelector(
  selectUsersState,
  (state: UsersState) => state?.offersError || null
);

// Computed selectors
export const selectUserById = (userId: string) => createSelector(
  selectAllUsers,
  (users) => users.find(user => user._id === userId)
);

export const selectSignedUsers = createSelector(
  selectAllUsers,
  (users) => users.filter(user => user.status === 'Signed')
);

export const selectFreeAgentUsers = createSelector(
  selectAllUsers,
  (users) => users.filter(user => user.status === 'Free Agent')
);

export const selectUsersByClub = (clubId: string) => createSelector(
  selectAllUsers,
  (users) => users.filter(user => user.currentClubId === clubId)
);

export const selectUsersByStatus = (status: 'Signed' | 'Free Agent') => createSelector(
  selectAllUsers,
  (users) => users.filter(user => user.status === status)
);

export const selectPendingOffers = createSelector(
  selectInboxOffers,
  (offers) => offers.filter(offer => offer.status === 'pending')
);

export const selectAcceptedOffers = createSelector(
  selectInboxOffers,
  (offers) => offers.filter(offer => offer.status === 'accepted')
);

export const selectRejectedOffers = createSelector(
  selectInboxOffers,
  (offers) => offers.filter(offer => offer.status === 'rejected')
);

export const selectOffersByClub = (clubId: string) => createSelector(
  selectInboxOffers,
  (offers) => offers.filter(offer => offer.clubId === clubId)
);

export const selectOffersByUser = (userId: string) => createSelector(
  selectInboxOffers,
  (offers) => offers.filter(offer => offer.userId === userId)
);

// Loading states
export const selectUsersLoadingState = createSelector(
  selectUsersLoading,
  selectUsersError,
  (loading, error) => ({ loading, error })
);

export const selectOffersLoadingState = createSelector(
  selectOffersLoading,
  selectOffersError,
  (loading, error) => ({ loading, error })
);
