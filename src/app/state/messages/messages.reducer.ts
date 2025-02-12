import { createReducer, on } from '@ngrx/store';
import { Message } from './messages.model';
import * as MessagesActions from './messages.actions';

export interface MessagesState {
  messages: Message[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const initialState: MessagesState = {
  messages: [],
  unreadCount: 0,
  loading: false,
  error: null
};

export const messagesReducer = createReducer(
  initialState,
  
  on(MessagesActions.loadMessages, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(MessagesActions.loadMessagesSuccess, (state, { messages }) => ({
    ...state,
    messages,
    unreadCount: messages.filter(m => !m.read).length,
    loading: false
  })),
  
  on(MessagesActions.loadMessagesFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  on(MessagesActions.markMessageAsReadSuccess, (state, { messageId }) => {
    const updatedMessages = state.messages.map(msg =>
      msg.id === messageId ? { ...msg, read: true } : msg
    );
    return {
      ...state,
      messages: updatedMessages,
      unreadCount: updatedMessages.filter(m => !m.read).length
    };
  })
); 