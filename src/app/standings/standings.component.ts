import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchService, Match } from '../store/services/match.service';

interface TeamStanding {
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;
  winPercentage: number;
  logo?: string; // Add logo property
}

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './standings.component.html',
  styleUrls: ['./standings.component.css']
})
export class StandingsComponent implements OnInit {
  standings: TeamStanding[] = [];
  isLoading: boolean = true;
  sortColumn: string = 'points'; // Default sort by points
  sortDirection: 'asc' | 'desc' = 'desc'; // Default sort direction
  
  constructor(private matchService: MatchService) { }
  
  ngOnInit(): void {
    this.loadStandings();
  }
  
  loadStandings(): void {
    this.isLoading = true;
    this.matchService.getMatches().subscribe({
      next: (matches) => {
        this.calculateStandings(matches);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.isLoading = false;
      }
    });
  }
  
  calculateStandings(matches: Match[]): void {
    // Get unique team names
    const teamNames = new Set<string>();
    matches.forEach(match => {
      teamNames.add(match.homeTeam);
      teamNames.add(match.awayTeam);
    });
    
    // Initialize standings for each team
    const standingsMap = new Map<string, TeamStanding>();
    teamNames.forEach(teamName => {
      standingsMap.set(teamName, {
        teamName,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifferential: 0,
        winPercentage: 0,
        logo: this.getTeamLogo(teamName) // Add logo
      });
    });
    
    // Calculate stats based on matches
    matches.forEach(match => {
      // Home team stats
      const homeTeam = standingsMap.get(match.homeTeam)!;
      homeTeam.gamesPlayed++;
      homeTeam.goalsFor += match.homeScore;
      homeTeam.goalsAgainst += match.awayScore;
      
      // Away team stats
      const awayTeam = standingsMap.get(match.awayTeam)!;
      awayTeam.gamesPlayed++;
      awayTeam.goalsFor += match.awayScore;
      awayTeam.goalsAgainst += match.homeScore;
      
      // Win/loss stats
      if (match.homeScore > match.awayScore) {
        // Home team wins
        homeTeam.wins++;
        homeTeam.points += 2; // 2 points for a win
        awayTeam.losses++;
      } else {
        // Away team wins
        awayTeam.wins++;
        awayTeam.points += 2; // 2 points for a win
        homeTeam.losses++;
      }
    });
    
    // Calculate derived stats for each team
    standingsMap.forEach(team => {
      team.goalDifferential = team.goalsFor - team.goalsAgainst;
      team.winPercentage = team.gamesPlayed > 0 ? 
        team.wins / team.gamesPlayed : 0;
    });
    
    // Convert map to array and sort by points
    this.standings = Array.from(standingsMap.values());
    this.sortStandings(this.sortColumn, this.sortDirection);
  }
  
  sortStandings(column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn = column;
    this.sortDirection = direction;
    
    this.standings.sort((a, b) => {
      let comparison = 0;
      
      switch (column) {
        case 'teamName':
          comparison = a.teamName.localeCompare(b.teamName);
          break;
        case 'gamesPlayed':
          comparison = a.gamesPlayed - b.gamesPlayed;
          break;
        case 'wins':
          comparison = a.wins - b.wins;
          break;
        case 'losses':
          comparison = a.losses - b.losses;
          break;
        case 'points':
          comparison = a.points - b.points;
          break;
        case 'goalsFor':
          comparison = a.goalsFor - b.goalsFor;
          break;
        case 'goalsAgainst':
          comparison = a.goalsAgainst - b.goalsAgainst;
          break;
        case 'goalDifferential':
          comparison = a.goalDifferential - b.goalDifferential;
          break;
        case 'winPercentage':
          comparison = a.winPercentage - b.winPercentage;
          break;
        default:
          comparison = a.points - b.points;
      }
      
      // Apply sorting direction
      return direction === 'asc' ? comparison : -comparison;
    });
  }
  
  // Handle column header click for sorting
  onSortColumn(column: string): void {
    // If clicking the same column, toggle direction
    const direction = this.sortColumn === column && this.sortDirection === 'desc' ? 'asc' : 'desc';
    this.sortStandings(column, direction);
  }
  
  getColumnSortClass(column: string): string {
    if (this.sortColumn !== column) {
      return 'sortable';
    }
    
    return this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
  }
  
  // Helper method to get team logo path
  getTeamLogo(teamName: string): string {
    // Based on actual team names from the mock data:
    // - "Boats"
    // - "Ragin Cajuns"
    // - "Mutts"
    // - "Roosters" (should be Iserlohn Roosters)
    // - "Lights Out"
    
    // Map actual team names to logo files
    const teamLogoMap: { [key: string]: string } = {
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
    
    // Try exact match first (case sensitive)
    if (teamLogoMap[teamName]) {
      return `assets/images/${teamLogoMap[teamName]}`;
    }
    
    // Try case-insensitive match
    const lowerCaseTeamName = teamName.toLowerCase();
    for (const [key, value] of Object.entries(teamLogoMap)) {
      if (key.toLowerCase() === lowerCaseTeamName) {
        return `assets/images/${value}`;
      }
    }
    
    // Try partial match (for teams that might have shortened names in the data)
    for (const [key, value] of Object.entries(teamLogoMap)) {
      if (lowerCaseTeamName.includes(key.toLowerCase()) || 
          key.toLowerCase().includes(lowerCaseTeamName)) {
        return `assets/images/${value}`;
      }
    }
    
    // Log team name that couldn't be matched for debugging
    console.log(`No logo match found for team: ${teamName}`);
    
    // Return default image as fallback
    return 'assets/images/1ithlwords.png';
  }
} 