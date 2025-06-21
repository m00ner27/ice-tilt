import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Match, PlayerMatchStats } from '../store/services/match.service';

@Component({
  selector: 'app-game-summary',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./game-summary.component.css'],
  templateUrl: './game-summary.component.html'
})
export class GameSummaryComponent implements OnInit {
  match: Match | null = null;
  homeSkaters: PlayerMatchStats[] = [];
  awaySkaters: PlayerMatchStats[] = [];
  homeGoalies: PlayerMatchStats[] = [];
  awayGoalies: PlayerMatchStats[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state && state['match']) {
      this.match = state['match'];
      this.processPlayerStats();
    } else {
      // Handle case where match data is not available, maybe redirect
      console.error('Match data not found in state!');
    }
  }

  private processPlayerStats(): void {
    if (!this.match) return;

    this.homeSkaters = this.match.playerStats
      .filter(p => p.team === this.match?.homeTeam && p.position.toLowerCase() !== 'goalie');
    this.awaySkaters = this.match.playerStats
      .filter(p => p.team === this.match?.awayTeam && p.position.toLowerCase() !== 'goalie');
    this.homeGoalies = this.match.playerStats
      .filter(p => p.team === this.match?.homeTeam && p.position.toLowerCase() === 'goalie');
    this.awayGoalies = this.match.playerStats
      .filter(p => p.team === this.match?.awayTeam && p.position.toLowerCase() === 'goalie');
  }

  goBack(): void {
    window.history.back();
  }
}
