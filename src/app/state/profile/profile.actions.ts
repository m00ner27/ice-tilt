import { createAction, props } from '@ngrx/store';
import { UserProfile } from './profile.model';

export const loadProfile = createAction(
  '[Profile] Load Profile',
  props<{ userId: string }>()
);
export const loadProfileSuccess = createAction(
  '[Profile] Load Profile Success',
  props<{ profile: UserProfile }>()
);
export const loadProfileFailure = createAction(
  '[Profile] Load Profile Failure',
  props<{ error: string }>()
);

export const updateProfile = createAction(
  '[Profile] Update Profile',
  props<{ updates: Partial<UserProfile> }>()
);
export const updateProfileSuccess = createAction(
  '[Profile] Update Profile Success',
  props<{ profile: UserProfile }>()
);
export const updateProfileFailure = createAction(
  '[Profile] Update Profile Failure',
  props<{ error: string }>()
); 