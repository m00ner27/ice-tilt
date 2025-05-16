import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';

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
  isOvertime?: boolean;
  isShootout?: boolean;
  playerStats: PlayerMatchStats[];
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  
  constructor(private http: HttpClient) { }
  
  getMatches(): Observable<Match[]> {
    return this.http.get<Match[]>('assets/data/mock_matches.json').pipe(
      catchError(error => {
        console.error('Error loading matches:', error);
        return [];
      })
    );
  }
  
  getMatchesByTeam(teamName: string): Observable<Match[]> {
    return this.getMatches().pipe(
      map(matches => matches.filter(match => 
        match.homeTeam === teamName || match.awayTeam === teamName
      ))
    );
  }
} 