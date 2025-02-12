import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from './messages.model';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private apiUrl = '/api/messages';

  constructor(private http: HttpClient) {}

  getMessages(): Observable<Message[]> {
    return this.http.get<Message[]>(this.apiUrl);
  }

  markAsRead(messageId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${messageId}/read`, {});
  }
} 