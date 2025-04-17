import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlayerMatchStats {
  playerId: number;
  name: string;
  team: string;
  number: number;
  position: string;
  goals?: number;
  assists?: number;
  plusMinus?: number;
  saves?: number;
  shotsAgainst?: number;
  goalsAgainst?: number;
  shutout?: number;
}

export interface Match {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  playerStats: PlayerMatchStats[];
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  
  constructor(private http: HttpClient) { }
  
  getMatches(): Observable<Match[]> {
    return this.http.get<Match[]>('assets/data/mock_matches.json');
  }
  
  getMatchesByTeam(teamName: string): Observable<Match[]> {
    return new Observable(observer => {
      this.getMatches().subscribe(
        matches => {
          const teamMatches = matches.filter(match => 
            match.homeTeam === teamName || match.awayTeam === teamName
          );
          observer.next(teamMatches);
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }
} 