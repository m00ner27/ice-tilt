import { createAction, props } from '@ngrx/store';
import { Message } from './messages.model';

export const loadMessages = createAction('[Messages] Load Messages');
export const loadMessagesSuccess = createAction(
  '[Messages] Load Messages Success',
  props<{ messages: Message[] }>()
);
export const loadMessagesFailure = createAction(
  '[Messages] Load Messages Failure',
  props<{ error: string }>()
);

export const markMessageAsRead = createAction(
  '[Messages] Mark As Read',
  props<{ messageId: string }>()
);
export const markMessageAsReadSuccess = createAction(
  '[Messages] Mark As Read Success',
  props<{ messageId: string }>()
);
export const markMessageAsReadFailure = createAction(
  '[Messages] Mark As Read Failure',
  props<{ error: string }>()
); 