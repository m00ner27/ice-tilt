import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatchService, Match, PlayerMatchStats } from '../store/services/match.service';
import { forkJoin } from 'rxjs';
import { MatchHistoryComponent } from './match-history/match-history.component';
import { Club, ClubStats } from '../store/models/models/club.interface';
import { Player } from '../store/models/models/player.interface';
import { PlayerStats } from '../store/models/models/player-stats.interface';

// Keep only the ClubData interface for API response
interface ClubData {
  clubs: Club[];
}

// Keep these stats interfaces as they're specific to this component
interface SkaterStats {
  playerId: number;
  name: string;
  number: number;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
}

interface GoalieStats {
  playerId: number;
  name: string;
  number: number;
  gamesPlayed: number;
  savePercentage: number;
  goalsAgainstAverage: number;
  shutouts: number;
}

// Update the stats interface to include more detailed statistics
interface CalculatedClubStats {
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  winPercentage: number;
  goalDifferential: number;
  streakCount: number;
  streakType: 'W' | 'L' | 'OTL' | '-';
  lastTen: Array<'W' | 'L' | 'OTL'>;
}

// Example mock player data structure
interface PlayerProfile {
    id: string;
    name: string;
    position: 'Forward' | 'Defense' | 'Goalie';
    number: string;
    psnId?: string;
    xboxGamertag?: string;
    country: string;
    handedness: 'Left' | 'Right';
    currentClubId?: string;
    currentClubName?: string;
    status: 'Signed' | 'Free Agent' | 'Pending';
    stats: PlayerStats;
    requestHistory: SigningRequest[];
}

interface SigningRequest {
    id: string;
    fromClubId: string;
    fromClubName: string;
    toPlayerId: string;
    status: 'Pending' | 'Accepted' | 'Rejected';
    timestamp: Date;
    message?: string;
}

// Example mock notification structure
interface Notification {
    id: string;
    type: 'SigningRequest' | 'RequestAccepted' | 'RequestRejected';
    fromId: string;
    toId: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

@Component({
  selector: 'app-club-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatchHistoryComponent],
  templateUrl: './club-detail.component.html',
  styleUrls: ['./club-detail.component.css']
})
export class ClubDetailComponent implements OnInit {
  club: Club | undefined;
  matches: Match[] = [];
  skaterStats: SkaterStats[] = [];
  goalieStats: GoalieStats[] = [];
  
  // Add default stats
  private defaultStats: CalculatedClubStats = {
    wins: 0,
    losses: 0,
    otLosses: 0,
    points: 0,
    gamesPlayed: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    winPercentage: 0,
    goalDifferential: 0,
    streakCount: 0,
    streakType: '-',
    lastTen: []
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private matchService: MatchService
  ) {}

  ngOnInit() {
    // Get the club name from the URL
    this.route.params.subscribe(params => {
      const clubName = params['id'];
      this.loadClubData(clubName);
    });
  }

  private calculateTeamStats(teamName: string, matches: Match[]): CalculatedClubStats {
    const stats: CalculatedClubStats = {
      wins: 0,
      losses: 0,
      otLosses: 0,
      points: 0,
      gamesPlayed: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      winPercentage: 0,
      goalDifferential: 0,
      streakCount: 0,
      streakType: '-',
      lastTen: []
    };

    // Sort matches by date to calculate streaks and last 10 games
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = '';

    sortedMatches.forEach(match => {
      stats.gamesPlayed++;
      let gameResult: 'W' | 'L' | 'OTL';
      
      if (match.homeTeam === teamName) {
        // Team was home
        stats.goalsFor += match.homeScore;
        stats.goalsAgainst += match.awayScore;

        if (match.homeScore > match.awayScore) {
          // Win
          stats.wins++;
          gameResult = 'W';
        } else {
          // Check if it was an OT/SO loss
          if (match.isOvertime || match.isShootout) {
            stats.otLosses++;
            gameResult = 'OTL';
          } else {
            stats.losses++;
            gameResult = 'L';
          }
        }
      } else {
        // Team was away
        stats.goalsFor += match.awayScore;
        stats.goalsAgainst += match.homeScore;

        if (match.awayScore > match.homeScore) {
          // Win
          stats.wins++;
          gameResult = 'W';
        } else {
          // Check if it was an OT/SO loss
          if (match.isOvertime || match.isShootout) {
            stats.otLosses++;
            gameResult = 'OTL';
          } else {
            stats.losses++;
            gameResult = 'L';
          }
        }
      }

      // Calculate streak
      if (stats.gamesPlayed === 1) {
        stats.streakType = gameResult;
        stats.streakCount = 1;
      } else if (gameResult === stats.streakType) {
        stats.streakCount++;
      } else if (stats.gamesPlayed === 1) {
        stats.streakType = gameResult;
        stats.streakCount = 1;
      }

      // Track last 10 games
      if (stats.lastTen.length < 10) {
        stats.lastTen.push(gameResult);
      }
    });

    // Calculate points (2 for wins, 1 for OT losses)
    stats.points = (stats.wins * 2) + stats.otLosses;

    // Calculate win percentage (points earned out of total possible points)
    const possiblePoints = stats.gamesPlayed * 2;
    stats.winPercentage = possiblePoints > 0 ? (stats.points / possiblePoints) * 100 : 0;

    // Calculate goal differential
    stats.goalDifferential = stats.goalsFor - stats.goalsAgainst;

    return stats;
  }

  loadClubData(clubName: string) {
    // First load just the club data
    this.http.get<ClubData>('assets/mock_club_data.json').subscribe({
      next: (data) => {
        this.club = data.clubs.find(club => club.clubName === clubName);
        if (!this.club) {
          console.error('Club not found:', clubName);
          return;
        }
        // Initialize stats with defaults
        this.club.stats = { ...this.defaultStats };
      },
      error: (error) => {
        console.error('Error loading club data:', error);
      }
    });

    // Load match data and calculate stats
    this.matchService.getMatchesByTeam(clubName).subscribe({
      next: (matchData) => {
        this.matches = matchData;
        
        // Calculate actual stats from matches
        if (this.club) {
          const calculatedStats = this.calculateTeamStats(clubName, matchData);
          this.club.stats = calculatedStats;
          
          // Calculate player statistics
          this.calculatePlayerStats(clubName);
        }
      },
      error: (error) => {
        console.error('Error loading match data:', error);
        this.matches = [];
        // Ensure we still have default stats even if match loading fails
        if (this.club) {
          this.club.stats = { ...this.defaultStats };
        }
      }
    });
  }
  
  calculatePlayerStats(teamName: string) {
    // Track unique players
    const skaters = new Map<number, SkaterStats>();
    const goalies = new Map<number, GoalieStats>();
    
    // Process all matches
    this.matches.forEach(match => {
      // Process each player's stats from the match
      match.playerStats.forEach(playerStat => {
        if (playerStat.team === teamName) {
          if (playerStat.position === 'G') {
            // Process goalie stats
            this.processGoalieStats(goalies, playerStat, match);
          } else {
            // Process skater stats
            this.processSkaterStats(skaters, playerStat);
          }
        }
      });
    });
    
    // Convert maps to arrays
    this.skaterStats = Array.from(skaters.values());
    this.goalieStats = Array.from(goalies.values());
    
    // Sort skaters by points (descending)
    this.skaterStats.sort((a, b) => b.points - a.points);
    
    // Sort goalies by save percentage (descending)
    this.goalieStats.sort((a, b) => b.savePercentage - a.savePercentage);
  }
  
  processSkaterStats(skaters: Map<number, SkaterStats>, playerStat: PlayerMatchStats) {
    if (!playerStat.goals && !playerStat.assists && !playerStat.plusMinus) {
      return; // Skip if no stats available
    }
    
    // Check if this is a skater (not a goalie)
    if (playerStat.position === 'G') {
      return; // Skip goalies
    }
    
    // Get or create skater stats
    let skater = skaters.get(playerStat.playerId);
    if (!skater) {
      skater = {
        playerId: playerStat.playerId,
        name: playerStat.name,
        number: playerStat.number,
        position: playerStat.position,
        gamesPlayed: 0,
        goals: 0,
        assists: 0,
        points: 0,
        plusMinus: 0
      };
      skaters.set(playerStat.playerId, skater);
    }
    
    // Update stats
    skater.gamesPlayed++;
    skater.goals += playerStat.goals || 0;
    skater.assists += playerStat.assists || 0;
    skater.points = skater.goals + skater.assists;
    skater.plusMinus += playerStat.plusMinus || 0;
  }
  
  processGoalieStats(goalies: Map<number, GoalieStats>, playerStat: PlayerMatchStats, match: Match) {
    if (!playerStat.saves && !playerStat.shotsAgainst) {
      return; // Skip if no stats available
    }
    
    // Check if this is a goalie
    if (playerStat.position !== 'G') {
      return; // Skip non-goalies
    }
    
    // Get or create goalie stats
    let goalie = goalies.get(playerStat.playerId);
    if (!goalie) {
      goalie = {
        playerId: playerStat.playerId,
        name: playerStat.name,
        number: playerStat.number,
        gamesPlayed: 0,
        savePercentage: 0,
        goalsAgainstAverage: 0,
        shutouts: 0
      };
      goalies.set(playerStat.playerId, goalie);
    }
    
    // Update games played and shutouts
    goalie.gamesPlayed++;
    goalie.shutouts += playerStat.shutout || 0;
    
    // Update saves and goals against for calculating averages
    const saves = playerStat.saves || 0;
    const shotsAgainst = playerStat.shotsAgainst || 0;
    const goalsAgainst = playerStat.goalsAgainst || 0;
    
    // Calculate total saves and shots to get save percentage
    const totalSaves = (goalie.savePercentage * (goalie.gamesPlayed - 1)) + 
                       (saves / (shotsAgainst || 1));
    goalie.savePercentage = totalSaves / goalie.gamesPlayed;
    
    // Calculate goals against average
    const totalGAA = (goalie.goalsAgainstAverage * (goalie.gamesPlayed - 1)) + goalsAgainst;
    goalie.goalsAgainstAverage = totalGAA / goalie.gamesPlayed;
  }
}
