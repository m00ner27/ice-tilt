import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { Match, PlayerMatchStats, MatchService } from '../services/match.service';

interface PlayerStatDisplay {
  name: string;
  number: number;
  position: string;
  goals?: number;
  assists?: number;
  points?: number;
  plusMinus?: number;
  saves?: number;
  shotsAgainst?: number;
  savePercentage?: number;
  goalsAgainst?: number;
  shutout?: number;
}

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.css']
})
export class MatchDetailComponent implements OnInit {
  match: Match | null = null;
  viewingTeam: string | null = null;
  homeTeamPlayers: PlayerStatDisplay[] = [];
  awayTeamPlayers: PlayerStatDisplay[] = [];
  homeTeamGoalies: PlayerStatDisplay[] = [];
  awayTeamGoalies: PlayerStatDisplay[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private matchService: MatchService
  ) {
    // Try to get the match from the router state first (when coming from match-history)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.match = navigation.extras.state['match'] as Match;
      this.viewingTeam = navigation.extras.state['teamName'] as string;
    }
  }
  
  ngOnInit(): void {
    // If we don't have the match from router state, load it using the ID from the URL
    if (!this.match) {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.loadMatch(id);
    } else {
      this.processMatchData();
    }
  }
  
  loadMatch(id: number): void {
    this.matchService.getMatches().subscribe(matches => {
      this.match = matches.find(m => m.id === id) || null;
      if (this.match) {
        this.processMatchData();
      } else {
        console.error('Match not found with ID:', id);
      }
    });
  }
  
  processMatchData(): void {
    if (!this.match) return;
    
    // Process player stats
    this.homeTeamPlayers = [];
    this.awayTeamPlayers = [];
    this.homeTeamGoalies = [];
    this.awayTeamGoalies = [];
    
    this.match.playerStats.forEach(player => {
      const playerDisplay = this.convertToPlayerDisplay(player);
      
      if (player.team === this.match?.homeTeam) {
        if (player.position === 'G') {
          this.homeTeamGoalies.push(playerDisplay);
        } else {
          this.homeTeamPlayers.push(playerDisplay);
        }
      } else {
        if (player.position === 'G') {
          this.awayTeamGoalies.push(playerDisplay);
        } else {
          this.awayTeamPlayers.push(playerDisplay);
        }
      }
    });
    
    // Sort skaters by points
    this.homeTeamPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));
    this.awayTeamPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));
  }
  
  convertToPlayerDisplay(player: PlayerMatchStats): PlayerStatDisplay {
    const basePlayer: PlayerStatDisplay = {
      name: player.name,
      number: player.number,
      position: player.position
    };
    
    if (player.position === 'G') {
      // Goalie stats
      return {
        ...basePlayer,
        saves: player.saves,
        shotsAgainst: player.shotsAgainst,
        savePercentage: player.shotsAgainst ? 
          player.saves! / player.shotsAgainst : 0,
        goalsAgainst: player.goalsAgainst,
        shutout: player.shutout
      };
    } else {
      // Skater stats
      return {
        ...basePlayer,
        goals: player.goals || 0,
        assists: player.assists || 0,
        points: (player.goals || 0) + (player.assists || 0),
        plusMinus: player.plusMinus || 0
      };
    }
  }
  
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  getWinningTeam(): string {
    if (!this.match) return '';
    
    return this.match.homeScore > this.match.awayScore ? 
      this.match.homeTeam : this.match.awayTeam;
  }
  
  isTeamWinner(teamName: string): boolean {
    return teamName === this.getWinningTeam();
  }
  
  goBack(): void {
    this.location.back();
  }
} 