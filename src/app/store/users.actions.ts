import { createAction, props } from '@ngrx/store';

export interface User {
  _id: string;
  name: string;
  email: string;
  discordId?: string;
  currentClubId?: string;
  status: 'Signed' | 'Free Agent';
  profile?: any;
}

// Load Users Actions
export const loadUsers = createAction('[Users] Load Users');
export const loadUsersSuccess = createAction('[Users] Load Users Success', props<{ users: User[] }>());
export const loadUsersFailure = createAction('[Users] Load Users Failure', props<{ error: any }>());

// Load Single User Actions
export const loadUser = createAction('[Users] Load User', props<{ userId: string }>());
export const loadUserSuccess = createAction('[Users] Load User Success', props<{ user: User }>());
export const loadUserFailure = createAction('[Users] Load User Failure', props<{ error: any }>());

// Auth0 Sync Actions
export const auth0Sync = createAction('[Users] Auth0 Sync');
export const auth0SyncSuccess = createAction('[Users] Auth0 Sync Success', props<{ user: User }>());
export const auth0SyncFailure = createAction('[Users] Auth0 Sync Failure', props<{ error: any }>());

// Load Current User Actions
export const loadCurrentUser = createAction('[Users] Load Current User');
export const loadCurrentUserSuccess = createAction('[Users] Load Current User Success', props<{ user: User }>());
export const loadCurrentUserFailure = createAction('[Users] Load Current User Failure', props<{ error: any }>());

// Load Free Agents Actions
export const loadFreeAgents = createAction('[Users] Load Free Agents');
export const loadFreeAgentsSuccess = createAction('[Users] Load Free Agents Success', props<{ freeAgents: User[] }>());
export const loadFreeAgentsFailure = createAction('[Users] Load Free Agents Failure', props<{ error: any }>());

// Load Free Agents by Season Actions
export const loadFreeAgentsBySeason = createAction('[Users] Load Free Agents By Season', props<{ seasonId: string }>());
export const loadFreeAgentsBySeasonSuccess = createAction('[Users] Load Free Agents By Season Success', props<{ freeAgents: User[] }>());
export const loadFreeAgentsBySeasonFailure = createAction('[Users] Load Free Agents By Season Failure', props<{ error: any }>());

// Create User Actions
export const createUser = createAction('[Users] Create User', props<{ userData: Partial<User> }>());
export const createUserSuccess = createAction('[Users] Create User Success', props<{ user: User }>());
export const createUserFailure = createAction('[Users] Create User Failure', props<{ error: any }>());

// Update User Actions
export const updateUser = createAction('[Users] Update User', props<{ user: User }>());
export const updateUserSuccess = createAction('[Users] Update User Success', props<{ user: User }>());
export const updateUserFailure = createAction('[Users] Update User Failure', props<{ error: any }>());

// Update Current User Actions
export const updateCurrentUser = createAction('[Users] Update Current User', props<{ userData: any }>());
export const updateCurrentUserSuccess = createAction('[Users] Update Current User Success', props<{ user: User }>());
export const updateCurrentUserFailure = createAction('[Users] Update Current User Failure', props<{ error: any }>());

// Delete User Actions
export const deleteUser = createAction('[Users] Delete User', props<{ userId: string }>());
export const deleteUserSuccess = createAction('[Users] Delete User Success', props<{ userId: string }>());
export const deleteUserFailure = createAction('[Users] Delete User Failure', props<{ error: any }>());

// Contract Offer Actions
export const sendContractOffer = createAction('[Users] Send Contract Offer', props<{ 
  clubId: string; 
  clubName: string;
  clubLogoUrl?: string;
  userId: string; 
  playerName: string;
  seasonId?: string;
  seasonName?: string;
  sentBy: string; 
}>());
export const sendContractOfferSuccess = createAction('[Users] Send Contract Offer Success', props<{ offer: any }>());
export const sendContractOfferFailure = createAction('[Users] Send Contract Offer Failure', props<{ error: any }>());

// Inbox Actions
export const loadInboxOffers = createAction('[Users] Load Inbox Offers', props<{ userId: string }>());
export const loadInboxOffersSuccess = createAction('[Users] Load Inbox Offers Success', props<{ offers: any[] }>());
export const loadInboxOffersFailure = createAction('[Users] Load Inbox Offers Failure', props<{ error: any }>());

export const respondToOffer = createAction('[Users] Respond To Offer', props<{ offerId: string; status: 'accepted' | 'rejected' }>());
export const respondToOfferSuccess = createAction('[Users] Respond To Offer Success', props<{ offerId: string; status: string }>());
export const respondToOfferFailure = createAction('[Users] Respond To Offer Failure', props<{ error: any }>());

// Clear Actions
export const clearUsers = createAction('[Users] Clear Users');
export const clearSelectedUser = createAction('[Users] Clear Selected User');
export const clearFreeAgents = createAction('[Users] Clear Free Agents');
