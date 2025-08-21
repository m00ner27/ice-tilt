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
  seasonId: string | { _id: string; name: string };
  divisionIds?: string[];
  roster?: string[];
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
        
        console.log('Loaded seasons:', this.seasons.map(s => ({ id: s._id, name: s.name, start: s.startDate, end: s.endDate })));
        console.log('Loaded matches:', this.allMatches.length);
        console.log('Sample match dates:', this.allMatches.slice(0, 5).map(m => ({ id: m.id, date: m.date, home: m.homeTeam, away: m.awayTeam })));
        
        if (this.seasons.length > 0) {
          this.selectedSeasonId = 'all-seasons'; // Default to "All Seasons"
          console.log('Auto-selected season: All Seasons');
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
    
    // If "All Seasons" is selected, load all divisions and process all matches
    if (this.selectedSeasonId === 'all-seasons') {
      this.apiService.getDivisions().subscribe({
        next: (divisions) => {
          this.divisions = divisions;
          this.filterAndAggregateStats();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load all divisions', err);
          this.isLoading = false;
        }
      });
    } else {
      // Load divisions for specific season
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
  }

  filterAndAggregateStats(): void {
    if (this.selectedSeasonId === 'all-seasons') {
      console.log('Filtering stats for ALL SEASONS');
      console.log('Total matches available:', this.allMatches.length);
      
      // For "All Seasons", include all teams and all matches
      const allTeams = new Set<string>();
      this.allClubs.forEach(club => {
        allTeams.add(club.name);
      });
      
      console.log('All teams:', Array.from(allTeams));
      
      // Use all matches for "All Seasons"
      const filteredMatches = this.allMatches;
      console.log('Using all matches for All Seasons:', filteredMatches.length);
      
      // Create team division map for all seasons
      const teamDivisionMap = new Map<string, string>();
      const divisionIdToNameMap = new Map<string, string>();
      this.divisions.forEach(d => divisionIdToNameMap.set(d._id, d.name));

      this.allClubs.forEach(club => {
        // For "All Seasons", use the first division found for each club
        if (club.seasons && club.seasons.length > 0) {
          const firstSeason = club.seasons[0];
          if (firstSeason.divisionIds && firstSeason.divisionIds.length > 0) {
            const divisionId = firstSeason.divisionIds[0];
            const divisionName = divisionIdToNameMap.get(divisionId);
            if (divisionName) {
              teamDivisionMap.set(club.name, divisionName);
            }
          }
        }
      });
      
      console.log('Team division map for All Seasons:', teamDivisionMap);
      
      // Process stats for all matches
      this.aggregatePlayerStats(filteredMatches, teamDivisionMap);
      return;
    }

    const season = this.seasons.find(s => s._id === this.selectedSeasonId);
    if (!season) {
      this.groupedStats = [];
      return;
    }

    console.log('Filtering stats for season:', season.name, 'ID:', season._id);
    console.log('Total matches available:', this.allMatches.length);

    // Instead of filtering by date, filter by season association
    // Only include matches where teams are officially in the selected season
    const seasonTeams = new Set<string>();
    this.allClubs.forEach(club => {
      const seasonInfo = club.seasons?.find((s: ClubSeasonInfo) => {
        if (typeof s.seasonId === 'object' && s.seasonId._id) {
          return s.seasonId._id === this.selectedSeasonId;
        } else if (typeof s.seasonId === 'string') {
          return s.seasonId === this.selectedSeasonId;
        }
        return false;
      });
      if (seasonInfo) {
        seasonTeams.add(club.name);
      }
    });
    
    console.log('Teams in season:', Array.from(seasonTeams));
    
    // Filter matches to only include those from the specific season
    const filteredMatches = this.allMatches.filter(match => {
      // Check if the match belongs to the selected season
      if (match.seasonId && match.seasonId === this.selectedSeasonId) {
        // Also ensure at least one team is officially in this season
        const homeTeamInSeason = match.homeClub?.name && seasonTeams.has(match.homeClub.name);
        const awayTeamInSeason = match.awayClub?.name && seasonTeams.has(match.awayClub.name);
        return homeTeamInSeason || awayTeamInSeason;
      }
      return false;
    });
    
    console.log('Matches from specific season:', filteredMatches.length);
    
    // Create team division map for the selected season
    const teamDivisionMap = new Map<string, string>();
    const divisionIdToNameMap = new Map<string, string>();
    this.divisions.forEach(d => divisionIdToNameMap.set(d._id, d.name));

    this.allClubs.forEach(club => {
      // Only process clubs that are in the selected season
      if (!seasonTeams.has(club.name)) {
        return;
      }

      const seasonInfo = club.seasons?.find((s: ClubSeasonInfo) => {
        if (typeof s.seasonId === 'object' && s.seasonId._id) {
          return s.seasonId._id === this.selectedSeasonId;
        } else if (typeof s.seasonId === 'string') {
          return s.seasonId === this.selectedSeasonId;
        }
        return false;
      });
      if (seasonInfo && seasonInfo.divisionIds && seasonInfo.divisionIds.length > 0) {
        const divisionId = seasonInfo.divisionIds[0];
        const divisionName = divisionIdToNameMap.get(divisionId);
        if (divisionName) {
          teamDivisionMap.set(club.name, divisionName);
        }
      }
    });
    
    console.log('Team division map:', teamDivisionMap);
    
    // Process stats for the filtered matches
    this.aggregatePlayerStats(filteredMatches, teamDivisionMap);
  }
  
  aggregatePlayerStats(matches: Match[], teamDivisionMap: Map<string, string>): void {
    const statsMap = new Map<number, PlayerStats>();
    const teamLogoMap = new Map<string, string | undefined>();

    console.log('Processing matches for player stats:', matches.length);
    
    // For "All Seasons", include all teams
    if (this.selectedSeasonId === 'all-seasons') {
      const allTeams = new Set<string>();
      this.allClubs.forEach(club => {
        allTeams.add(club.name);
      });
      console.log('All teams for All Seasons:', Array.from(allTeams));
      
      // Create a map of team names to their logos from all matches
      matches.forEach(match => {
        if (match.homeTeam) teamLogoMap.set(match.homeTeam, match.homeClub?.logoUrl);
        if (match.awayTeam) teamLogoMap.set(match.awayTeam, match.awayClub?.logoUrl);
      });
      
      matches.forEach(match => {
        console.log('Processing match for All Seasons:', match.id, 'Home:', match.homeTeam, 'Away:', match.awayTeam);
        console.log('Match eashlData:', match.eashlData);
        
        // Use eashlData.players instead of playerStats
        if (match.eashlData?.players) {
          console.log('Found eashlData.players:', Object.keys(match.eashlData.players));
          
          Object.entries(match.eashlData.players).forEach(([clubId, clubPlayers]: [string, any]) => {
            console.log('Processing club ID:', clubId, 'Players:', clubPlayers);
            
            // Map club ID to team name
            let teamName = 'Unknown';
            if (match.homeClub?.eashlClubId === clubId) {
              teamName = match.homeClub.name;
            } else if (match.awayClub?.eashlClubId === clubId) {
              teamName = match.awayClub.name;
            }
            
            console.log('Mapped club ID', clubId, 'to team name:', teamName);
            
            // For "All Seasons", include all teams
            if (typeof clubPlayers === 'object' && clubPlayers !== null) {
              Object.entries(clubPlayers).forEach(([playerId, playerData]: [string, any]) => {
                if (this.isGoalie(playerData.position)) {
                  return; // Skip goalies
                }

                const playerIdNum = parseInt(playerId);
                let existingStats = statsMap.get(playerIdNum);

                if (!existingStats) {
                  existingStats = {
                    playerId: playerIdNum,
                    name: playerData.playername || 'Unknown',
                    team: teamName,
                    teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
                    number: parseInt(playerData.jerseynum) || 0,
                    position: this.formatPosition(playerData.position),
                    division: teamDivisionMap.get(teamName) || 'Unknown',
                    gamesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    points: 0,
                    plusMinus: 0
                  };
                  statsMap.set(playerIdNum, existingStats);
                }

                existingStats.gamesPlayed++;
                existingStats.goals += parseInt(playerData.skgoals) || 0;
                existingStats.assists += parseInt(playerData.skassists) || 0;
                existingStats.points += (parseInt(playerData.skgoals) || 0) + (parseInt(playerData.skassists) || 0);
                existingStats.plusMinus += parseInt(playerData.skplusmin) || 0;
              });
            }
          });
        }
      });
      
      // Ensure points are calculated correctly for all players
      statsMap.forEach(player => {
        player.points = player.goals + player.assists;
      });
      
      // Convert stats map to grouped stats
      const allPlayerStats = Array.from(statsMap.values());
      
      // For "All Seasons", show as one combined table
      this.groupedStats = [{
        division: 'All Seasons',
        stats: allPlayerStats.sort((a, b) => b.points - a.points || b.goals - a.goals)
      }];
      console.log('All Seasons combined stats:', this.groupedStats[0].stats.length, 'players');
      return;
    }
    
    // For specific season, we need to be strict about which teams are included
    const selectedSeason = this.seasons.find(s => s._id === this.selectedSeasonId);
    
    // Create a set of teams that are officially in the selected season
    const seasonTeams = new Set<string>();
    this.allClubs.forEach(club => {
      const seasonInfo = club.seasons?.find((s: ClubSeasonInfo) => {
        if (typeof s.seasonId === 'object' && s.seasonId._id) {
          return s.seasonId._id === this.selectedSeasonId;
        } else if (typeof s.seasonId === 'string') {
          return s.seasonId === this.selectedSeasonId;
        }
        return false;
      });
      if (seasonInfo) {
        seasonTeams.add(club.name);
      }
    });
    console.log('Official teams in season:', Array.from(seasonTeams));
    
    // Create a map of team names to their logos from all matches
    matches.forEach(match => {
      if (match.homeTeam) teamLogoMap.set(match.homeTeam, match.homeClub?.logoUrl);
      if (match.awayTeam) teamLogoMap.set(match.awayTeam, match.awayClub?.logoUrl);
    });
    
    matches.forEach(match => {
      console.log('Processing match:', match.id, 'Home:', match.homeTeam, 'Away:', match.awayTeam);
      console.log('Match eashlData:', match.eashlData);
      
      // Use eashlData.players instead of playerStats
      if (match.eashlData?.players) {
        console.log('Found eashlData.players:', Object.keys(match.eashlData.players));
        
        Object.entries(match.eashlData.players).forEach(([clubId, clubPlayers]: [string, any]) => {
          console.log('Processing club ID:', clubId, 'Players:', clubPlayers);
          
          // Map club ID to team name
          let teamName = 'Unknown';
          if (match.homeClub?.eashlClubId === clubId) {
            teamName = match.homeClub.name;
          } else if (match.awayClub?.eashlClubId === clubId) {
            teamName = match.awayClub.name;
          }
          
          console.log('Mapped club ID', clubId, 'to team name:', teamName);
          
          // Only include players from teams officially in the selected season
          if (!seasonTeams.has(teamName)) {
            console.log('Skipping team', teamName, '- not in selected season');
            return;
          }
          
          if (typeof clubPlayers === 'object' && clubPlayers !== null) {
            Object.entries(clubPlayers).forEach(([playerId, playerData]: [string, any]) => {
              if (this.isGoalie(playerData.position)) {
                return; // Skip goalies
              }

              const playerIdNum = parseInt(playerId);
              let existingStats = statsMap.get(playerIdNum);

              if (!existingStats) {
                existingStats = {
                  playerId: playerIdNum,
                  name: playerData.playername || 'Unknown',
                  team: teamName,
                  teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
                  number: parseInt(playerData.jerseynum) || 0,
                  position: this.formatPosition(playerData.position),
                  division: teamDivisionMap.get(teamName) || 'Unknown',
                  gamesPlayed: 0,
                  goals: 0,
                  assists: 0,
                  points: 0,
                  plusMinus: 0
                };
                statsMap.set(playerIdNum, existingStats);
              }

              existingStats.gamesPlayed++;
              existingStats.goals += parseInt(playerData.skgoals) || 0;
              existingStats.assists += parseInt(playerData.skassists) || 0;
              existingStats.points = existingStats.goals + existingStats.assists;
              existingStats.plusMinus += parseInt(playerData.skplusmin) || 0;
              existingStats.team = teamName;
              existingStats.teamLogo = teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png';
              existingStats.division = teamDivisionMap.get(teamName) || existingStats.division;
            });
          }
        });
      } else {
        console.log('No eashlData.players found in match');
      }
    });
    
    console.log('Final stats map:', statsMap.size, 'players');
    
    const allPlayerStats = Array.from(statsMap.values());
    
    // Group stats by division for all seasons (including Summer Tourney)
    const divisionStatsMap = new Map<string, PlayerStats[]>();
    allPlayerStats.forEach(stat => {
      const divisionName = stat.division || 'Unassigned';
      if (!divisionStatsMap.has(divisionName)) {
        divisionStatsMap.set(divisionName, []);
      }
      divisionStatsMap.get(divisionName)!.push(stat);
    });
    
    this.groupedStats = Array.from(divisionStatsMap.entries()).map(([division, stats]) => {
      return { division, stats: stats.sort((a, b) => b.points - a.points || b.goals - a.goals) };
    });
    console.log('Grouped by division:', this.groupedStats.length, 'groups');
    console.log('Division breakdown:', this.groupedStats.map(g => ({ division: g.division, players: g.stats.length })));
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
