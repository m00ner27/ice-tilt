import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

// Define the Match interfaces matching the JSON structure
export interface PlayerStat {
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
  playerStats: PlayerStat[];
}

export interface TeamInfo {
  name: string;
  logo: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  private teamsCache: Map<string, TeamInfo> = new Map();
  
  constructor(private http: HttpClient) { }

  // Fetch all matches from the mock data
  getMatches(): Observable<Match[]> {
    return this.http.get<Match[]>('assets/data/mock_matches.json')
      .pipe(
        catchError(error => {
          console.error('Error fetching matches:', error);
          return of([]);
        })
      );
  }

  // Get team logo by team name
  getTeamLogo(teamName: string): string {
    // Map team names to logo images
    const logoMap: { [key: string]: string } = {
      'Roosters': 'square-iserlohnroosters.png',
      'Iserlohn Roosters': 'square-iserlohnroosters.png',
      'Boats': 'square-boats.png',
      'Blueline': 'square-blueline.png',
      'Glorified Crew': 'square-glorifiedcrew.png',
      'Lights Out': 'square-lightsout.png',
      'Mutts': 'square-mutts.png',
      'Ragin Cajuns': 'square-ragincajuns.png',
      'York City Kings': 'square-yorkcitykings.png'
    };
    
    if (logoMap[teamName]) {
      return `assets/images/${logoMap[teamName]}`;
    }
    
    // Return default logo if no match
    return 'assets/images/1ithlwords.png';
  }

  // Fetch a single match by ID
  getMatchById(id: number): Observable<Match | undefined> {
    return this.getMatches().pipe(
      map(matches => matches.find(match => match.id === id))
    );
  }

  // Get matches for a specific team
  getTeamMatches(teamName: string): Observable<Match[]> {
    return this.getMatches().pipe(
      map(matches => matches.filter(match => 
        match.homeTeam === teamName || match.awayTeam === teamName
      ))
    );
  }

  // Format date for display (e.g., "Oct 12, 2023")
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  // Helper method to determine if a match is completed
  isMatchCompleted(match: Match): boolean {
    // In this mockup, all matches are considered completed
    // In a real app, you'd compare the date with current date
    // or have a specific status field
    return true;
  }
}
