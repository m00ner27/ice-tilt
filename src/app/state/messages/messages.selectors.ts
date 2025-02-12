import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MessagesState } from './messages.reducer';

export const selectMessagesState = createFeatureSelector<MessagesState>('messages');

export const selectAllMessages = createSelector(
  selectMessagesState,
  (state) => state.messages
);

export const selectUnreadCount = createSelector(
  selectMessagesState,
  (state) => state.unreadCount
);

export const selectMessagesLoading = createSelector(
  selectMessagesState,
  (state) => state.loading
);

export const selectMessagesError = createSelector(
  selectMessagesState,
  (state) => state.error
);

export const selectUnreadMessages = createSelector(
  selectAllMessages,
  (messages) => messages.filter(msg => !msg.read)
);

export const selectMessagesByType = (type: string) => createSelector(
  selectAllMessages,
  (messages) => messages.filter(msg => msg.type === type)
);

export const selectActionRequiredMessages = createSelector(
  selectAllMessages,
  (messages) => messages.filter(msg => msg.actionRequired && !msg.read)
); 