import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatchService, Match, PlayerMatchStats } from '../services/match.service';
import { forkJoin } from 'rxjs';
import { MatchHistoryComponent } from './match-history/match-history.component';

// Interface for player data
interface Player {
  name: string;
  number: string;
  position: string;
}

// Updated club interface to include roster
interface Club {
  clubName: string;
  image: string;
  manager: string;
  colour: string;
  roster: Player[];
}

interface ClubData {
  clubs: Club[];
}

// Interfaces for player statistics
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

  loadClubData(clubName: string) {
    // Load the club data and match data in parallel
    forkJoin({
      clubData: this.http.get<ClubData>('assets/mock_club_data.json'),
      matchData: this.matchService.getMatchesByTeam(clubName)
    }).subscribe({
      next: (result) => {
        // Set club data
        this.club = result.clubData.clubs.find(club => club.clubName === clubName);
        if (!this.club) {
          console.error('Club not found:', clubName);
          return;
        }
        
        // Set matches data
        this.matches = result.matchData;
        
        // Calculate player statistics
        this.calculatePlayerStats(clubName);
      },
      error: (error) => {
        console.error('Error loading data:', error);
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
