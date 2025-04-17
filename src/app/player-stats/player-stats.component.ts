import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchService, Match, PlayerMatchStats } from '../services/match.service';

interface PlayerStats {
  playerId: number;
  name: string;
  team: string;
  number: number;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
}

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.css'
})
export class PlayerStatsComponent implements OnInit {
  playerStats: PlayerStats[] = [];
  isLoading: boolean = true;
  sortColumn: string = 'points'; // Default sort by points
  sortDirection: 'asc' | 'desc' = 'desc'; // Default sort direction
  
  constructor(private matchService: MatchService) { }
  
  ngOnInit(): void {
    this.loadPlayerStats();
  }
  
  loadPlayerStats(): void {
    this.isLoading = true;
    this.matchService.getMatches().subscribe({
      next: (matches) => {
        this.aggregatePlayerStats(matches);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.isLoading = false;
      }
    });
  }
  
  aggregatePlayerStats(matches: Match[]): void {
    // Map to store aggregated player stats by player ID
    const statsMap = new Map<number, PlayerStats>();
    
    // Process each match
    matches.forEach(match => {
      // Process player stats from the match
      match.playerStats.forEach(playerStat => {
        // Skip goalies (they will be handled in GoalieStatsComponent)
        if (playerStat.position === 'G') {
          return;
        }
        
        // Get existing player stats or create new entry
        let existingStats = statsMap.get(playerStat.playerId);
        
        if (!existingStats) {
          // Initialize new player stats
          existingStats = {
            playerId: playerStat.playerId,
            name: playerStat.name,
            team: playerStat.team,
            number: playerStat.number,
            position: playerStat.position,
            gamesPlayed: 0,
            goals: 0,
            assists: 0,
            points: 0,
            plusMinus: 0
          };
          
          statsMap.set(playerStat.playerId, existingStats);
        }
        
        // Update stats
        existingStats.gamesPlayed++;
        
        if (playerStat.goals) {
          existingStats.goals += playerStat.goals;
          existingStats.points += playerStat.goals;
        }
        
        if (playerStat.assists) {
          existingStats.assists += playerStat.assists;
          existingStats.points += playerStat.assists;
        }
        
        if (playerStat.plusMinus) {
          existingStats.plusMinus += playerStat.plusMinus;
        }
      });
    });
    
    // Convert map to array and sort
    this.playerStats = Array.from(statsMap.values());
    this.sortPlayerStats(this.sortColumn, this.sortDirection);
  }
  
  sortPlayerStats(column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn = column;
    this.sortDirection = direction;
    
    this.playerStats.sort((a, b) => {
      let comparison = 0;
      
      switch (column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'team':
          comparison = a.team.localeCompare(b.team);
          break;
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
        case 'gamesPlayed':
          comparison = a.gamesPlayed - b.gamesPlayed;
          break;
        case 'goals':
          comparison = a.goals - b.goals;
          break;
        case 'assists':
          comparison = a.assists - b.assists;
          break;
        case 'points':
          comparison = a.points - b.points;
          break;
        case 'plusMinus':
          comparison = a.plusMinus - b.plusMinus;
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
    this.sortPlayerStats(column, direction);
  }
  
  getColumnSortClass(column: string): string {
    if (this.sortColumn !== column) {
      return 'sortable';
    }
    
    return this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
  }
}
