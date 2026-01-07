import { createReducer, on } from '@ngrx/store';
import { User } from './users.actions';
import * as UsersActions from './users.actions';

export interface UsersState {
  users: User[];
  selectedUser: User | null;
  currentUser: User | null;
  freeAgents: User[];
  inboxOffers: any[];
  loading: boolean;
  error: any;
  offersLoading: boolean;
  offersError: any;
}

export const initialState: UsersState = {
  users: [],
  selectedUser: null,
  currentUser: null,
  freeAgents: [],
  inboxOffers: [],
  loading: false,
  error: null,
  offersLoading: false,
  offersError: null,
};

export const usersReducer = createReducer(
  initialState,

  // Load Users
  on(UsersActions.loadUsers, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.loadUsersSuccess, (state, { users }) => ({ 
    ...state, 
    users, 
    loading: false, 
    error: null 
  })),
  on(UsersActions.loadUsersFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Single User
  on(UsersActions.loadUser, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.loadUserSuccess, (state, { user }) => ({ 
    ...state, 
    selectedUser: user, 
    loading: false, 
    error: null 
  })),
  on(UsersActions.loadUserFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Auth0 Sync
  on(UsersActions.auth0Sync, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.auth0SyncSuccess, (state, { user }) => ({ 
    ...state, 
    currentUser: user, 
    loading: false, 
    error: null 
  })),
  on(UsersActions.auth0SyncFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Current User
  on(UsersActions.loadCurrentUser, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.loadCurrentUserSuccess, (state, { user }) => ({ 
    ...state, 
    currentUser: user, 
    loading: false, 
    error: null 
  })),
  on(UsersActions.loadCurrentUserFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Free Agents
  on(UsersActions.loadFreeAgents, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.loadFreeAgentsSuccess, (state, { freeAgents }) => ({ 
    ...state, 
    freeAgents, 
    loading: false, 
    error: null 
  })),
  on(UsersActions.loadFreeAgentsFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Free Agents by Season
  on(UsersActions.loadFreeAgentsBySeason, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.loadFreeAgentsBySeasonSuccess, (state, { freeAgents }) => ({ 
    ...state, 
    freeAgents, 
    loading: false, 
    error: null 
  })),
  on(UsersActions.loadFreeAgentsBySeasonFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Create User
  on(UsersActions.createUser, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.createUserSuccess, (state, { user }) => ({ 
    ...state, 
    users: [...state.users, user], 
    loading: false, 
    error: null 
  })),
  on(UsersActions.createUserFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Update User
  on(UsersActions.updateUser, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.updateUserSuccess, (state, { user }) => ({ 
    ...state, 
    users: state.users.map(u => u._id === user._id ? user : u),
    selectedUser: state.selectedUser?._id === user._id ? user : state.selectedUser,
    freeAgents: state.freeAgents.map(u => u._id === user._id ? user : u),
    loading: false, 
    error: null 
  })),
  on(UsersActions.updateUserFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Update Current User
  on(UsersActions.updateCurrentUser, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.updateCurrentUserSuccess, (state, { user }) => ({ 
    ...state, 
    currentUser: user,
    users: state.users.map(u => u._id === user._id ? user : u),
    loading: false, 
    error: null 
  })),
  on(UsersActions.updateCurrentUserFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Delete User
  on(UsersActions.deleteUser, (state) => ({ ...state, loading: true, error: null })),
  on(UsersActions.deleteUserSuccess, (state, { userId }) => ({ 
    ...state, 
    users: state.users.filter(u => u._id !== userId),
    selectedUser: state.selectedUser?._id === userId ? null : state.selectedUser,
    freeAgents: state.freeAgents.filter(u => u._id !== userId),
    loading: false, 
    error: null 
  })),
  on(UsersActions.deleteUserFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Send Contract Offer
  on(UsersActions.sendContractOffer, (state) => ({ ...state, offersLoading: true, offersError: null })),
  on(UsersActions.sendContractOfferSuccess, (state, { offer }) => ({ 
    ...state, 
    offersLoading: false, 
    offersError: null 
  })),
  on(UsersActions.sendContractOfferFailure, (state, { error }) => ({ 
    ...state, 
    offersLoading: false, 
    offersError: error 
  })),

  // Load Inbox Offers
  on(UsersActions.loadInboxOffers, (state) => ({ ...state, offersLoading: true, offersError: null })),
  on(UsersActions.loadInboxOffersSuccess, (state, { offers }) => ({ 
    ...state, 
    inboxOffers: offers,
    offersLoading: false, 
    offersError: null 
  })),
  on(UsersActions.loadInboxOffersFailure, (state, { error }) => ({ 
    ...state, 
    offersLoading: false, 
    offersError: error 
  })),

  // Respond to Offer
  on(UsersActions.respondToOffer, (state) => ({ ...state, offersLoading: true, offersError: null })),
  on(UsersActions.respondToOfferSuccess, (state, { offerId, status }) => ({ 
    ...state, 
    inboxOffers: state.inboxOffers.filter(offer => offer._id !== offerId),
    offersLoading: false, 
    offersError: null 
  })),
  on(UsersActions.respondToOfferFailure, (state, { error }) => ({ 
    ...state, 
    offersLoading: false, 
    offersError: error 
  })),

  // Clear Actions
  on(UsersActions.clearUsers, (state) => ({ ...state, users: [], selectedUser: null })),
  on(UsersActions.clearSelectedUser, (state) => ({ ...state, selectedUser: null })),
  on(UsersActions.clearFreeAgents, (state) => ({ ...state, freeAgents: [] }))
);
