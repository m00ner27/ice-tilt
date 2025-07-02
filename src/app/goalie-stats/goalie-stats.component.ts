import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchService, Match } from '../store/services/match.service';
import { RouterModule } from '@angular/router';
import { ApiService } from '../store/services/api.service';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms'; // Import FormsModule

interface Season {
  _id: string;
  name: string;
  endDate: string;
  startDate: string; // Added startDate for Season
}

interface Division {
  _id: string;
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
  division?: string;
}

interface GroupedGoalieStats {
  division: string;
  stats: GoalieStats[];
}

@Component({
  selector: 'app-goalie-stats',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // Add FormsModule
  templateUrl: './goalie-stats.component.html',
  styleUrl: './goalie-stats.component.css'
})
export class GoalieStatsComponent implements OnInit {
  allMatches: Match[] = [];
  allClubs: Club[] = [];
  groupedStats: GroupedGoalieStats[] = [];
  seasons: Season[] = [];
  divisions: Division[] = [];
  selectedSeasonId: string | null = null;
  
  isLoading: boolean = true;
  sortColumn: string = 'savePercentage'; // Default sort by save percentage
  sortDirection: 'asc' | 'desc' = 'desc'; // Default sort direction
  
  constructor(
    private matchService: MatchService,
    private apiService: ApiService
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
          this.loadStatsForSeason();
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
    
    const filteredMatches = this.allMatches.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate >= seasonStart && matchDate <= seasonEnd;
    });
    
    const teamDivisionMap = new Map<string, string>();
    const divisionIdToNameMap = new Map<string, string>();
    this.divisions.forEach(d => divisionIdToNameMap.set(d._id, d.name));

    this.allClubs.forEach(club => {
      const seasonInfo = club.seasons?.find((s: ClubSeasonInfo) => s.seasonId === this.selectedSeasonId);
      if (seasonInfo && seasonInfo.divisionIds?.length > 0) {
        const divisionId = seasonInfo.divisionIds[0];
        const divisionName = divisionIdToNameMap.get(divisionId);
        if (divisionName) {
          teamDivisionMap.set(club.name, divisionName);
        }
      }
    });
    
    this.aggregateGoalieStats(filteredMatches, teamDivisionMap);
  }
  
  aggregateGoalieStats(matches: Match[], teamDivisionMap: Map<string, string>): void {
    const statsMap = new Map<number, GoalieStats>();
    const teamLogoMap = new Map<string, string | undefined>();

    // Create a map of team names to their logos from all matches
    matches.forEach(match => {
      if (match.homeTeam) teamLogoMap.set(match.homeTeam, match.homeClub?.logoUrl);
      if (match.awayTeam) teamLogoMap.set(match.awayTeam, match.awayClub?.logoUrl);
    });
    
    matches.forEach(match => {
      match.playerStats.forEach(playerStat => {
        if (!this.isGoalie(playerStat.position)) {
          return; // Skip non-goalies
        }

        let existingStats = statsMap.get(playerStat.playerId);

        if (!existingStats) {
          existingStats = {
            playerId: playerStat.playerId,
            name: playerStat.name,
            team: playerStat.team,
            teamLogo: teamLogoMap.get(playerStat.team) || 'assets/images/1ithlwords.png',
            number: playerStat.number,
            division: teamDivisionMap.get(playerStat.team) || 'Unknown',
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

        existingStats.gamesPlayed++;
        existingStats.saves += playerStat.saves || 0;
        existingStats.shotsAgainst += playerStat.shotsAgainst || 0;
        existingStats.goalsAgainst += playerStat.goalsAgainst || 0;
        existingStats.shutouts += playerStat.shutout || 0;
        existingStats.team = playerStat.team;
        existingStats.teamLogo = teamLogoMap.get(playerStat.team) || 'assets/images/1ithlwords.png';
        existingStats.division = teamDivisionMap.get(playerStat.team) || existingStats.division;
      });
    });
    
    // Calculate derived stats for each goalie
    statsMap.forEach(goalie => {
      goalie.savePercentage = goalie.shotsAgainst > 0 ? 
        goalie.saves / goalie.shotsAgainst : 0;
      
      goalie.goalsAgainstAverage = goalie.gamesPlayed > 0 ? 
        goalie.goalsAgainst / goalie.gamesPlayed : 0;
    });
    
    const allGoalieStats = Array.from(statsMap.values());

    const divisionStatsMap = new Map<string, GoalieStats[]>();
    allGoalieStats.forEach(stat => {
      const divisionName = stat.division || 'Unassigned';
      if (!divisionStatsMap.has(divisionName)) {
        divisionStatsMap.set(divisionName, []);
      }
      divisionStatsMap.get(divisionName)!.push(stat);
    });

    this.groupedStats = Array.from(divisionStatsMap.entries()).map(([division, stats]) => {
      this.sortGoalieStats(stats, this.sortColumn, this.sortDirection);
      return { division, stats };
    });
  }
  
  sortGoalieStats(stats: GoalieStats[], column: string, direction: 'asc' | 'desc'): void {
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
    
    this.groupedStats.forEach(group => {
      this.sortGoalieStats(group.stats, column, direction);
    });
  }
  
  getColumnSortClass(column: string): string {
    if (this.sortColumn !== column) {
      return 'sortable';
    }
    
    return this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
  }

  private isGoalie(position: string): boolean {
    const lowerPos = position.toLowerCase().replace(/\s/g, '');
    return lowerPos === 'g' || lowerPos === 'goalie' || lowerPos === 'goaltender';
  }
}
