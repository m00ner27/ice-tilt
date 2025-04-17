import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchService, Match, PlayerMatchStats } from '../services/match.service';

interface GoalieStats {
  playerId: number;
  name: string;
  team: string;
  teamLogo?: string;
  number: number;
  gamesPlayed: number;
  saves: number;
  shotsAgainst: number;
  goalsAgainst: number;
  shutouts: number;
  savePercentage: number;
  goalsAgainstAverage: number;
}

@Component({
  selector: 'app-goalie-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './goalie-stats.component.html',
  styleUrl: './goalie-stats.component.css'
})
export class GoalieStatsComponent implements OnInit {
  goalieStats: GoalieStats[] = [];
  isLoading: boolean = true;
  sortColumn: string = 'savePercentage'; // Default sort by save percentage
  sortDirection: 'asc' | 'desc' = 'desc'; // Default sort direction
  
  constructor(private matchService: MatchService) { }
  
  ngOnInit(): void {
    this.loadGoalieStats();
  }
  
  loadGoalieStats(): void {
    this.isLoading = true;
    this.matchService.getMatches().subscribe({
      next: (matches) => {
        this.aggregateGoalieStats(matches);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.isLoading = false;
      }
    });
  }
  
  aggregateGoalieStats(matches: Match[]): void {
    // Map to store aggregated goalie stats by player ID
    const statsMap = new Map<number, GoalieStats>();
    
    // Process each match
    matches.forEach(match => {
      // Process player stats from the match
      match.playerStats.forEach(playerStat => {
        // Only include goalies
        if (playerStat.position !== 'G') {
          return;
        }
        
        // Get existing goalie stats or create new entry
        let existingStats = statsMap.get(playerStat.playerId);
        
        if (!existingStats) {
          // Initialize new goalie stats
          existingStats = {
            playerId: playerStat.playerId,
            name: playerStat.name,
            team: playerStat.team,
            teamLogo: this.getTeamLogo(playerStat.team),
            number: playerStat.number,
            gamesPlayed: 0,
            saves: 0,
            shotsAgainst: 0,
            goalsAgainst: 0,
            shutouts: 0,
            savePercentage: 0,
            goalsAgainstAverage: 0
          };
          
          statsMap.set(playerStat.playerId, existingStats);
        }
        
        // Update stats
        existingStats.gamesPlayed++;
        
        if (playerStat.saves !== undefined) {
          existingStats.saves += playerStat.saves;
        }
        
        if (playerStat.shotsAgainst !== undefined) {
          existingStats.shotsAgainst += playerStat.shotsAgainst;
        }
        
        if (playerStat.goalsAgainst !== undefined) {
          existingStats.goalsAgainst += playerStat.goalsAgainst;
        }
        
        if (playerStat.shutout !== undefined && playerStat.shutout > 0) {
          existingStats.shutouts += 1;
        }
      });
    });
    
    // Calculate derived stats for each goalie
    statsMap.forEach(goalie => {
      // Calculate save percentage: (saves / shots against) * 100
      goalie.savePercentage = goalie.shotsAgainst > 0 ? 
        goalie.saves / goalie.shotsAgainst : 0;
      
      // Calculate goals against average: (goals against / games played)
      goalie.goalsAgainstAverage = goalie.gamesPlayed > 0 ? 
        goalie.goalsAgainst / goalie.gamesPlayed : 0;
    });
    
    // Convert map to array and sort
    this.goalieStats = Array.from(statsMap.values());
    this.sortGoalieStats(this.sortColumn, this.sortDirection);
  }
  
  sortGoalieStats(column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn = column;
    this.sortDirection = direction;
    
    this.goalieStats.sort((a, b) => {
      let comparison = 0;
      
      switch (column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'team':
          comparison = a.team.localeCompare(b.team);
          break;
        case 'gamesPlayed':
          comparison = a.gamesPlayed - b.gamesPlayed;
          break;
        case 'saves':
          comparison = a.saves - b.saves;
          break;
        case 'shotsAgainst':
          comparison = a.shotsAgainst - b.shotsAgainst;
          break;
        case 'goalsAgainst':
          comparison = a.goalsAgainst - b.goalsAgainst;
          break;
        case 'shutouts':
          comparison = a.shutouts - b.shutouts;
          break;
        case 'savePercentage':
          comparison = a.savePercentage - b.savePercentage;
          break;
        case 'goalsAgainstAverage':
          // For GAA, lower is better, so invert the comparison
          comparison = b.goalsAgainstAverage - a.goalsAgainstAverage;
          break;
        default:
          comparison = a.savePercentage - b.savePercentage;
      }
      
      // Apply sorting direction
      return direction === 'asc' ? comparison : -comparison;
    });
  }
  
  // Handle column header click for sorting
  onSortColumn(column: string): void {
    // If clicking the same column, toggle direction
    const direction = this.sortColumn === column && this.sortDirection === 'desc' ? 'asc' : 'desc';
    this.sortGoalieStats(column, direction);
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
