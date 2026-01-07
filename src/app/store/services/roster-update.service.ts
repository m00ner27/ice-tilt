import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface RosterUpdateEvent {
  clubId: string;
  seasonId?: string;
  action: 'add' | 'remove' | 'sign' | 'release';
  playerId: string;
}

@Injectable({
  providedIn: 'root'
})
export class RosterUpdateService {
  private rosterUpdateSubject = new Subject<RosterUpdateEvent>();
  
  // Observable that components can subscribe to
  rosterUpdates$ = this.rosterUpdateSubject.asObservable();
  
  // Method to notify about roster changes
  notifyRosterUpdate(event: RosterUpdateEvent): void {
    console.log('Roster update notification:', event);
    this.rosterUpdateSubject.next(event);
  }
  
  // Convenience methods for common actions
  notifyPlayerSigned(clubId: string, seasonId: string, playerId: string): void {
    this.notifyRosterUpdate({
      clubId,
      seasonId,
      action: 'sign',
      playerId
    });
  }
  
  notifyPlayerReleased(clubId: string, seasonId: string, playerId: string): void {
    this.notifyRosterUpdate({
      clubId,
      seasonId,
      action: 'release',
      playerId
    });
  }
}
