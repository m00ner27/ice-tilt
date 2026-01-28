import { createAction, props } from '@ngrx/store';
import { Club } from './models/models/club.interface';

// Load Clubs Actions
export const loadClubs = createAction('[Clubs] Load Clubs');
export const loadClubsSuccess = createAction('[Clubs] Load Clubs Success', props<{ clubs: Club[] }>());
export const loadClubsFailure = createAction('[Clubs] Load Clubs Failure', props<{ error: any }>());

// Load Single Club Actions
export const loadClub = createAction('[Clubs] Load Club', props<{ clubId: string }>());
export const loadClubSuccess = createAction('[Clubs] Load Club Success', props<{ club: Club }>());
export const loadClubFailure = createAction('[Clubs] Load Club Failure', props<{ error: any }>());

// Load Clubs by Season Actions
export const loadClubsBySeason = createAction('[Clubs] Load Clubs By Season', props<{ seasonId: string }>());
export const loadClubsBySeasonSuccess = createAction('[Clubs] Load Clubs By Season Success', props<{ clubs: Club[] }>());
export const loadClubsBySeasonFailure = createAction('[Clubs] Load Clubs By Season Failure', props<{ error: any }>());

// Create Club Actions
export const createClub = createAction('[Clubs] Create Club', props<{ clubData: Partial<Club> }>());
export const createClubSuccess = createAction('[Clubs] Create Club Success', props<{ club: Club }>());
export const createClubFailure = createAction('[Clubs] Create Club Failure', props<{ error: any }>());

// Update Club Actions
export const updateClub = createAction('[Clubs] Update Club', props<{ club: Club }>());
export const updateClubSuccess = createAction('[Clubs] Update Club Success', props<{ club: Club }>());
export const updateClubFailure = createAction('[Clubs] Update Club Failure', props<{ error: any }>());

// Delete Club Actions
export const deleteClub = createAction('[Clubs] Delete Club', props<{ clubId: string }>());
export const deleteClubSuccess = createAction('[Clubs] Delete Club Success', props<{ clubId: string }>());
export const deleteClubFailure = createAction('[Clubs] Delete Club Failure', props<{ error: any }>());

// Club Roster Actions
export const loadClubRoster = createAction('[Clubs] Load Club Roster', props<{ clubId: string; seasonId: string }>());
export const loadClubRosterSuccess = createAction('[Clubs] Load Club Roster Success', props<{ clubId: string; seasonId: string; roster: any[] }>());
export const loadClubRosterFailure = createAction('[Clubs] Load Club Roster Failure', props<{ error: any }>());

export const loadClubGlobalRoster = createAction('[Clubs] Load Club Global Roster', props<{ clubId: string }>());
export const loadClubGlobalRosterSuccess = createAction('[Clubs] Load Club Global Roster Success', props<{ clubId: string; roster: any[] }>());
export const loadClubGlobalRosterFailure = createAction('[Clubs] Load Club Global Roster Failure', props<{ error: any }>());

export const addPlayerToClub = createAction('[Clubs] Add Player To Club', props<{ clubId: string; userId: string; seasonId: string }>());
export const addPlayerToClubSuccess = createAction('[Clubs] Add Player To Club Success', props<{ clubId: string; userId: string; seasonId: string }>());
export const addPlayerToClubFailure = createAction('[Clubs] Add Player To Club Failure', props<{ error: any }>());

export const removePlayerFromClub = createAction('[Clubs] Remove Player From Club', props<{ clubId: string; userId: string; seasonId: string }>());
export const removePlayerFromClubSuccess = createAction('[Clubs] Remove Player From Club Success', props<{ clubId: string; userId: string; seasonId: string }>());
export const removePlayerFromClubFailure = createAction('[Clubs] Remove Player From Club Failure', props<{ error: any }>());

// File Upload Actions
export const uploadClubLogo = createAction('[Clubs] Upload Club Logo', props<{ file: File }>());
export const uploadClubLogoSuccess = createAction('[Clubs] Upload Club Logo Success', props<{ logoUrl: string }>());
export const uploadClubLogoFailure = createAction('[Clubs] Upload Club Logo Failure', props<{ error: any }>());

// Clear Actions
export const clearClubs = createAction('[Clubs] Clear Clubs');
export const clearSelectedClub = createAction('[Clubs] Clear Selected Club');
export const clearClubRoster = createAction('[Clubs] Clear Club Roster', props<{ clubId: string }>());
export const clearAllRosters = createAction('[Clubs] Clear All Rosters');
