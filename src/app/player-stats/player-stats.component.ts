import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchService, Match } from '../store/services/match.service';
import { RouterModule } from '@angular/router';
import { ApiService } from '../store/services/api.service'; // Import ApiService
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms'; // Import FormsModule

// Define interfaces for Season and Division
interface Season {
  _id: string;
  name: string;
  endDate: string; // Added endDate for Season
  startDate: string; // Added startDate for Season
}

interface Division {
  _id:string;
  name: string;
  seasonId: string;
}

interface ClubSeasonInfo {
  seasonId: string;
  divisionIds: string[];
}

interface Club {
  name: string;
  seasons?: ClubSeasonInfo[];
}

interface PlayerStats {
  playerId: number;
  name: string;
  team: string;
  teamLogo?: string;
  number: number;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  division?: string; // Add division
}

// Grouped stats structure
interface GroupedPlayerStats {
  division: string;
  stats: PlayerStats[];
}

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // Add FormsModule
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.css'
})
export class PlayerStatsComponent implements OnInit {
  allMatches: Match[] = [];
  allClubs: Club[] = []; // Store clubs with type
  groupedStats: GroupedPlayerStats[] = [];
  seasons: Season[] = [];
  divisions: Division[] = [];
  selectedSeasonId: string | null = null;
  
  isLoading: boolean = true;
  sortColumn: string = 'points'; // Default sort by points
  sortDirection: 'asc' | 'desc' = 'desc'; // Default sort direction
  
  constructor(
    private matchService: MatchService,
    private apiService: ApiService // Inject ApiService
  ) { }
  
  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    forkJoin({
      matches: this.matchService.getMatches(),
      seasons: this.apiService.getSeasons(),
      clubs: this.apiService.getClubs()
    }).subscribe({
      next: ({ matches, seasons, clubs }) => {
        this.allMatches = matches;
        this.allClubs = clubs;
        this.seasons = seasons.sort((a, b) => {
          const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
          const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
          return dateB - dateA;
        });
        
        if (this.seasons.length > 0) {
          this.selectedSeasonId = this.seasons[0]._id;
          this.loadStatsForSeason(); // Initial stat load
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Failed to load initial data', err);
        this.isLoading = false;
      }
    });
  }
  
  onSeasonChange(): void {
    this.loadStatsForSeason();
  }

  loadStatsForSeason(): void {
    if (!this.selectedSeasonId) {
      this.groupedStats = [];
      return;
    }
    
    this.isLoading = true;
    this.apiService.getDivisionsBySeason(this.selectedSeasonId).subscribe({
      next: (divisions) => {
        this.divisions = divisions;
        this.filterAndAggregateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(`Failed to load divisions for season ${this.selectedSeasonId}`, err);
        this.isLoading = false;
      }
    });
  }

  filterAndAggregateStats(): void {
    const season = this.seasons.find(s => s._id === this.selectedSeasonId);
    if (!season) {
      this.groupedStats = [];
      return;
    }

    const seasonStart = new Date(season.startDate);
    const seasonEnd = new Date(season.endDate);

    // Filter matches by the selected season's date range
    const filteredMatches = this.allMatches.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate >= seasonStart && matchDate <= seasonEnd;
    });
    
    // Create a map of team name to division name
    const teamDivisionMap = new Map<string, string>();
    const divisionIdToNameMap = new Map<string, string>();
    this.divisions.forEach(d => divisionIdToNameMap.set(d._id, d.name));

    this.allClubs.forEach(club => {
      const seasonInfo = club.seasons?.find((s: ClubSeasonInfo) => s.seasonId === this.selectedSeasonId);
      if (seasonInfo && seasonInfo.divisionIds?.length > 0) {
        // Assuming one division per season for now
        const divisionId = seasonInfo.divisionIds[0];
        const divisionName = divisionIdToNameMap.get(divisionId);
        if (divisionName) {
          teamDivisionMap.set(club.name, divisionName);
        }
      }
    });
    
    this.aggregatePlayerStats(filteredMatches, teamDivisionMap);
  }
  
  aggregatePlayerStats(matches: Match[], teamDivisionMap: Map<string, string>): void {
    const statsMap = new Map<number, PlayerStats>();
    const teamLogoMap = new Map<string, string | undefined>();

    // Create a map of team names to their logos from all matches
    matches.forEach(match => {
      if (match.homeTeam) teamLogoMap.set(match.homeTeam, match.homeClub?.logoUrl);
      if (match.awayTeam) teamLogoMap.set(match.awayTeam, match.awayClub?.logoUrl);
    });
    
    matches.forEach(match => {
      match.playerStats.forEach(playerStat => {
        if (this.isGoalie(playerStat.position)) {
          return; // Skip goalies
        }

        let existingStats = statsMap.get(playerStat.playerId);

        if (!existingStats) {
          existingStats = {
            playerId: playerStat.playerId,
            name: playerStat.name,
            team: playerStat.team,
            teamLogo: teamLogoMap.get(playerStat.team) || 'assets/images/1ithlwords.png',
            number: playerStat.number,
            position: this.formatPosition(playerStat.position),
            division: teamDivisionMap.get(playerStat.team) || 'Unknown',
            gamesPlayed: 0,
            goals: 0,
            assists: 0,
            points: 0,
            plusMinus: 0
          };
          statsMap.set(playerStat.playerId, existingStats);
        }

        existingStats.gamesPlayed++;
        existingStats.goals += playerStat.goals || 0;
        existingStats.assists += playerStat.assists || 0;
        existingStats.points = existingStats.goals + existingStats.assists;
        existingStats.plusMinus += playerStat.plusMinus || 0;
        existingStats.team = playerStat.team;
        existingStats.teamLogo = teamLogoMap.get(playerStat.team) || 'assets/images/1ithlwords.png';
        existingStats.division = teamDivisionMap.get(playerStat.team) || existingStats.division;
      });
    });
    
    const allPlayerStats = Array.from(statsMap.values());
    
    // Group stats by division
    const divisionStatsMap = new Map<string, PlayerStats[]>();
    allPlayerStats.forEach(stat => {
      const divisionName = stat.division || 'Unassigned';
      if (!divisionStatsMap.has(divisionName)) {
        divisionStatsMap.set(divisionName, []);
      }
      divisionStatsMap.get(divisionName)!.push(stat);
    });
    
    this.groupedStats = Array.from(divisionStatsMap.entries()).map(([division, stats]) => {
      // Sort stats within each division group
      this.sortPlayerStats(stats, this.sortColumn, this.sortDirection);
      return { division, stats };
    });
  }
  
  sortPlayerStats(stats: PlayerStats[], column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn = column;
    this.sortDirection = direction;
    
    stats.sort((a, b) => {
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
    
    // Sort the stats within each division group
    this.groupedStats.forEach(group => {
      this.sortPlayerStats(group.stats, column, direction);
    });
  }
  
  getColumnSortClass(column: string): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'desc' ? 'sort-desc' : 'sort-asc';
  }

  private isGoalie(position: string): boolean {
    const lowerPos = position.toLowerCase().replace(/\s/g, '');
    return lowerPos === 'g' || lowerPos === 'goalie' || lowerPos === 'goaltender';
  }

  formatPosition(position: string): string {
    const positionMap: { [key: string]: string } = {
      'center': 'C',
      'leftwing': 'LW',
      'rightwing': 'RW',
      'defenseman': 'D',
      'defensemen': 'D',
      'goaltender': 'G',
      'goalie': 'G'
    };
    const key = position.toLowerCase().replace(/\s/g, '');
    return positionMap[key] || position;
  }
}
