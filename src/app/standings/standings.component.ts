import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../store/services/api.service';

interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Division {
  _id: string;
  name: string;
  seasonId: string;
}

interface Game {
  _id: string;
  seasonId: string;
  divisionId: string;
  homeClubId: string;
  awayClubId: string;
  date: string;
  isOvertime?: boolean;
  eashlMatchId?: string;
  score?: {
    home: number;
    away: number;
  };
  eashlData?: {
    homeScore: number;
    awayScore: number;
  };
  homeClub?: Club;
  awayClub?: Club;
}

interface Club {
  _id: string;
  name: string;
  logoUrl?: string;
  manager: string;
  seasons: {
    seasonId: string;
    divisionIds: string[];
  }[];
}

interface TeamStanding {
  teamId: string;
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;
  winPercentage: number;
  logo?: string;
}

interface DivisionStandings {
  division: Division;
  standings: TeamStanding[];
}

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './standings.component.html',
  styleUrls: ['./standings.component.css']
})
export class StandingsComponent implements OnInit {
  seasons: Season[] = [];
  selectedSeasonId: string = '';
  divisions: Division[] = [];
  clubs: Club[] = [];
  games: Game[] = [];
  divisionStandings: DivisionStandings[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  sortColumn: string = 'points';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSeasons();
  }

  loadSeasons(): void {
    this.isLoading = true;
    this.apiService.getSeasons().subscribe({
      next: (seasons) => {
        this.seasons = seasons;
        if (seasons.length > 0) {
          this.selectedSeasonId = seasons[0]._id;
          this.loadSeasonData();
        } else {
          this.isLoading = false;
          this.error = 'No seasons found';
        }
      },
      error: (error) => {
        console.error('Error loading seasons:', error);
        this.isLoading = false;
        this.error = 'Error loading seasons';
      }
    });
  }

  onSeasonChange(): void {
    this.loadSeasonData();
  }

  loadSeasonData(): void {
    this.isLoading = true;
    this.error = null;

    // Load divisions, clubs, and games for the selected season
    Promise.all([
      this.apiService.getDivisionsBySeason(this.selectedSeasonId).toPromise(),
      this.apiService.getClubsBySeason(this.selectedSeasonId).toPromise(),
      this.apiService.getGamesBySeason(this.selectedSeasonId).toPromise()
    ]).then(([divisions, clubs, games]) => {
      this.divisions = divisions || [];
      this.clubs = clubs || [];
      this.games = games || [];
      

      
      this.calculateStandings();
      this.isLoading = false;
    }).catch((error) => {
      console.error('Error loading season data:', error);
      this.isLoading = false;
      this.error = 'Error loading season data';
    });
  }

  calculateStandings(): void {
    this.divisionStandings = [];

    // Group games by division
    const gamesByDivision = new Map<string, Game[]>();
    this.games.forEach(game => {
      if (!gamesByDivision.has(game.divisionId)) {
        gamesByDivision.set(game.divisionId, []);
      }
      gamesByDivision.get(game.divisionId)!.push(game);
    });

    // Calculate standings for each division
    this.divisions.forEach(division => {
      const divisionGames = gamesByDivision.get(division._id) || [];
      const standings = this.calculateDivisionStandings(divisionGames, division);
      
      if (standings.length > 0) {
        this.divisionStandings.push({
          division,
          standings
        });
      }
    });
  }

  calculateDivisionStandings(games: Game[], division: Division): TeamStanding[] {
    const standingsMap = new Map<string, TeamStanding>();

    // Filter clubs that belong to the current division for the selected season
    const clubsInDivision = this.clubs.filter(club =>
      club.seasons.some(s =>
        s.seasonId === this.selectedSeasonId && s.divisionIds.includes(division._id)
      )
    );

    // Initialize standings for the clubs in this division
    clubsInDivision.forEach(club => {
      standingsMap.set(club._id, {
        teamId: club._id,
        teamName: club.name,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        otLosses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifferential: 0,
        winPercentage: 0,
        logo: club.logoUrl
      });
    });

    // If no clubs are in the division, no need to process games
    if (clubsInDivision.length === 0) {
      return [];
    }

    // Calculate stats from games
    games.forEach(game => {

      
      // Use game.score if available, as it's now the single source of truth for scores,
      // populated by both manual entry and the EASHL data linking.
      if (!game.score || typeof game.score.home === 'undefined' || typeof game.score.away === 'undefined') {
        // Skip games without valid scores
        return;
      }

      const homeScore = game.score.home;
      const awayScore = game.score.away;

      const homeTeam = standingsMap.get(game.homeClubId);
      const awayTeam = standingsMap.get(game.awayClubId);

      if (homeTeam && awayTeam) {
        // Update games played
        homeTeam.gamesPlayed++;
        awayTeam.gamesPlayed++;

        // Update goals
        homeTeam.goalsFor += homeScore;
        homeTeam.goalsAgainst += awayScore;
        awayTeam.goalsFor += awayScore;
        awayTeam.goalsAgainst += homeScore;

        // Update wins/losses and points, considering overtime
        if (homeScore > awayScore) {
          homeTeam.wins++;
          homeTeam.points += 2;
          
          // Check if losing team gets OTL point
          if (game.isOvertime) {
            awayTeam.otLosses++;
            awayTeam.points += 1; // 1 point for OTL
          } else {
            awayTeam.losses++;
          }
        } else if (awayScore > homeScore) {
          awayTeam.wins++;
          awayTeam.points += 2;
          
          // Check if losing team gets OTL point
          if (game.isOvertime) {
            homeTeam.otLosses++;
            homeTeam.points += 1; // 1 point for OTL
          } else {
            homeTeam.losses++;
          }
        } else {
          // Tie game - both teams get 1 point (shouldn't happen in hockey but just in case)
          homeTeam.points += 1;
          awayTeam.points += 1;
        }
        

      }
    });

    // Calculate derived stats
    standingsMap.forEach(team => {
      team.goalDifferential = team.goalsFor - team.goalsAgainst;
      team.winPercentage = team.gamesPlayed > 0 ? team.wins / team.gamesPlayed : 0;
    });

    // Convert to array and sort
    const standings = Array.from(standingsMap.values());
    this.sortStandings(standings, this.sortColumn, this.sortDirection);

    return standings;
  }

  sortStandings(standings: TeamStanding[], column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn = column;
    this.sortDirection = direction;

    standings.sort((a, b) => {
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
        case 'otLosses':
          comparison = a.otLosses - b.otLosses;
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

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  onSortColumn(column: string): void {
    const direction = this.sortColumn === column && this.sortDirection === 'desc' ? 'asc' : 'desc';
    
    // Apply sorting to all divisions
    this.divisionStandings.forEach(divisionStanding => {
      this.sortStandings(divisionStanding.standings, column, direction);
    });
  }

  getColumnSortClass(column: string): string {
    if (this.sortColumn !== column) {
      return 'sortable';
    }
    return this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
  }

  getSelectedSeasonName(): string {
    const season = this.seasons.find(s => s._id === this.selectedSeasonId);
    return season ? season.name : '';
  }
} 