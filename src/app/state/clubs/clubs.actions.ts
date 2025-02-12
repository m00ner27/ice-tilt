import { createAction, props } from '@ngrx/store';
import { Club } from './clubs.model';

export const loadClubs = createAction('[Clubs] Load Clubs');

export const loadClubsSuccess = createAction(
  '[Clubs] Load Clubs Success',
  props<{ clubs: Club[] }>()
);

export const loadClubsFailure = createAction(
  '[Clubs] Load Clubs Failure',
  props<{ error: string }>()
); 