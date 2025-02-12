import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as MessagesActions from './messages.actions';
import { MessagesService } from './messages.service';
import { BaseEffects } from '../base.effects';

@Injectable()
export class MessagesEffects extends BaseEffects {
  loadMessages$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MessagesActions.loadMessages),
      switchMap(() =>
        this.messagesService.getMessages().pipe(
          map(messages => MessagesActions.loadMessagesSuccess({ messages })),
          catchError(error => of(MessagesActions.loadMessagesFailure({ error: error.message })))
        )
      )
    )
  );

  markAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MessagesActions.markMessageAsRead),
      switchMap((action: { messageId: string }) =>
        this.messagesService.markAsRead(action.messageId).pipe(
          map(() => MessagesActions.markMessageAsReadSuccess({ messageId: action.messageId })),
          catchError(error => of(MessagesActions.markMessageAsReadFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    actions$: Actions,
    private messagesService: MessagesService
  ) {
    super(actions$);
  }
} 