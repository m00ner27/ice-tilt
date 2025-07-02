import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { Match, PlayerMatchStats, MatchService } from '../store/services/match.service';

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
      if (this.match) {
        this.processMatchData();
      }
    }
  }
  
  ngOnInit(): void {
    if (!this.match) {
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.loadMatch(id);
        }
      });
    }
  }
  
  loadMatch(id: string): void {
    this.matchService.getMatch(id).subscribe(match => {
      this.match = match;
      if (this.match) {
        this.processMatchData();
      } else {
        console.error('Match not found with ID:', id);
      }
    });
  }
  
  processMatchData(): void {
    if (!this.match) return;

    this.homeTeamPlayers = [];
    this.awayTeamPlayers = [];
    this.homeTeamGoalies = [];
    this.awayTeamGoalies = [];

    this.match.playerStats.forEach(player => {
      const playerDisplay = this.convertToPlayerDisplay(player);
      
      if (player.team === this.match?.homeTeam) {
        if (this.isGoalie(player.position)) {
          this.homeTeamGoalies.push(playerDisplay);
        } else {
          this.homeTeamPlayers.push(playerDisplay);
        }
      } else {
        if (this.isGoalie(player.position)) {
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
      position: this.formatPosition(player.position)
    };
    
    if (this.isGoalie(player.position)) {
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
  
  isTeamWinner(teamName: string | undefined): boolean {
    if (!this.match || !this.match.eashlData || !teamName) {
      return false;
    }
    
    if (this.match.homeScore > this.match.awayScore) {
      return teamName === this.match.homeTeam;
    } else if (this.match.awayScore > this.match.homeScore) {
      return teamName === this.match.awayTeam;
    }
    
    return false;
  }
  
  goBack(): void {
    this.location.back();
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

  calculateSavePercentage(saves?: number, shotsAgainst?: number): string {
    if (shotsAgainst === 0 || saves === undefined || shotsAgainst === undefined) {
      return '.000';
    }
    const percentage = saves / shotsAgainst;
    return percentage.toFixed(3).toString();
  }

  getTeamLogo(team: string | undefined): string {
    if (!team) return 'assets/images/square-default.png';
    const teamMap: { [key: string]: string } = {
      'roosters': 'square-iserlohnroosters.png',
      // Add more mappings as needed
    };
    const key = team.replace(/\s+/g, '').toLowerCase().replace(/^[^a-z0-9]+/, '');
    if (teamMap[key]) {
      return 'assets/images/' + teamMap[key];
    }
    return 'assets/images/square-' + key + '.png';
  }
} 