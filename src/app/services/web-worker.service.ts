import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebWorkerService {
  private worker: Worker | null = null;
  private messageSubject = new Subject<any>();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('../workers/data-processing.worker.ts', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        this.messageSubject.next(data);
      };
      this.worker.onerror = (error) => {
        
        this.messageSubject.next({ type: 'ERROR', payload: error });
      };
    }
  }

  // Process club matches in Web Worker
  processClubMatches(matches: any[], clubName: string): Observable<any> {
    if (!this.worker) {
      // Fallback to main thread if Web Workers not supported
      return new Observable(observer => {
        const result = this.processClubMatchesSync(matches, clubName);
        observer.next({ type: 'CLUB_MATCHES_PROCESSED', payload: result });
        observer.complete();
      });
    }

    this.worker.postMessage({
      type: 'PROCESS_CLUB_MATCHES',
      payload: { matches, clubName }
    });

    return new Observable(observer => {
      const subscription = this.messageSubject.subscribe(data => {
        if (data.type === 'CLUB_MATCHES_PROCESSED') {
          observer.next(data);
          observer.complete();
          subscription.unsubscribe();
        }
      });
    });
  }

  // Process player stats in Web Worker
  processPlayerStats(players: any[], matches: any[]): Observable<any> {
    if (!this.worker) {
      // Fallback to main thread if Web Workers not supported
      return new Observable(observer => {
        const result = this.processPlayerStatsSync(players, matches);
        observer.next({ type: 'PLAYER_STATS_PROCESSED', payload: result });
        observer.complete();
      });
    }

    this.worker.postMessage({
      type: 'PROCESS_PLAYER_STATS',
      payload: { players, matches }
    });

    return new Observable(observer => {
      const subscription = this.messageSubject.subscribe(data => {
        if (data.type === 'PLAYER_STATS_PROCESSED') {
          observer.next(data);
          observer.complete();
          subscription.unsubscribe();
        }
      });
    });
  }

  // Synchronous fallback methods
  private processClubMatchesSync(matches: any[], clubName: string) {
    const clubMatches = matches.filter((match: any) => {
      const homeMatch = match.homeClub?.name === clubName;
      const awayMatch = match.awayClub?.name === clubName;
      const homeTeamMatch = match.homeTeam === clubName;
      const awayTeamMatch = match.awayTeam === clubName;
      const homeClubIdMatch = match.homeClub?._id === clubName;
      const awayClubIdMatch = match.awayClub?._id === clubName;
      
      return homeMatch || awayMatch || homeTeamMatch || awayTeamMatch || homeClubIdMatch || awayClubIdMatch;
    });
    
    return {
      clubMatches,
      totalMatches: clubMatches.length
    };
  }

  private processPlayerStatsSync(players: any[], matches: any[]) {
    const playerStats = players.map((player: any) => {
      const playerMatches = matches.filter((match: any) => {
        return match.players && match.players.some((p: any) => p.id === player.id);
      });
      
      return {
        ...player,
        gamesPlayed: playerMatches.length,
      };
    });
    
    return {
      playerStats,
      totalPlayers: playerStats.length
    };
  }

  ngOnDestroy() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
