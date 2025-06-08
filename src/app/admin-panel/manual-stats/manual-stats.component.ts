import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../store/services/api.service';

interface PlayerStats {
  playerId: string;
  name: string;
  goals: number;
  assists: number;
  shots: number;
  hits: number;
  takeaways: number;
  giveaways: number;
  plusMinus: number;
  timeOnIce: number;
}

interface GoalieStats {
  goalieId: string;
  name: string;
  saves: number;
  shotsAgainst: number;
  goalsAgainst: number;
  savePercentage: number;
  timeOnIce: number;
}

@Component({
  selector: 'app-manual-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="manual-stats-container">
      <h2>Manual Stats Entry - {{ game?.homeTeam }} vs {{ game?.awayTeam }}</h2>
      
      <!-- Goalies Section -->
      <div class="stats-section">
        <h3>Goalies</h3>
        <div class="teams-container">
          <!-- Home Team Goalies -->
          <div class="team-stats">
            <h4>{{ game?.homeTeam }}</h4>
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Goalie</th>
                  <th>Saves</th>
                  <th>Shots Against</th>
                  <th>Goals Against</th>
                  <th>Save %</th>
                  <th>Time on Ice</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let goalie of homeGoalies">
                  <td>{{ goalie.name }}</td>
                  <td><input type="number" [(ngModel)]="goalie.saves" min="0"></td>
                  <td><input type="number" [(ngModel)]="goalie.shotsAgainst" min="0"></td>
                  <td><input type="number" [(ngModel)]="goalie.goalsAgainst" min="0"></td>
                  <td>{{ calculateSavePercentage(goalie) }}%</td>
                  <td><input type="number" [(ngModel)]="goalie.timeOnIce" min="0"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Away Team Goalies -->
          <div class="team-stats">
            <h4>{{ game?.awayTeam }}</h4>
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Goalie</th>
                  <th>Saves</th>
                  <th>Shots Against</th>
                  <th>Goals Against</th>
                  <th>Save %</th>
                  <th>Time on Ice</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let goalie of awayGoalies">
                  <td>{{ goalie.name }}</td>
                  <td><input type="number" [(ngModel)]="goalie.saves" min="0"></td>
                  <td><input type="number" [(ngModel)]="goalie.shotsAgainst" min="0"></td>
                  <td><input type="number" [(ngModel)]="goalie.goalsAgainst" min="0"></td>
                  <td>{{ calculateSavePercentage(goalie) }}%</td>
                  <td><input type="number" [(ngModel)]="goalie.timeOnIce" min="0"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Players Section -->
      <div class="stats-section">
        <h3>Players</h3>
        <div class="teams-container">
          <!-- Home Team Players -->
          <div class="team-stats">
            <h4>{{ game?.homeTeam }}</h4>
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Goals</th>
                  <th>Assists</th>
                  <th>Shots</th>
                  <th>Hits</th>
                  <th>Takeaways</th>
                  <th>Giveaways</th>
                  <th>+/-</th>
                  <th>Time on Ice</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let player of homePlayers">
                  <td>{{ player.name }}</td>
                  <td><input type="number" [(ngModel)]="player.goals" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.assists" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.shots" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.hits" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.takeaways" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.giveaways" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.plusMinus"></td>
                  <td><input type="number" [(ngModel)]="player.timeOnIce" min="0"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Away Team Players -->
          <div class="team-stats">
            <h4>{{ game?.awayTeam }}</h4>
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Goals</th>
                  <th>Assists</th>
                  <th>Shots</th>
                  <th>Hits</th>
                  <th>Takeaways</th>
                  <th>Giveaways</th>
                  <th>+/-</th>
                  <th>Time on Ice</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let player of awayPlayers">
                  <td>{{ player.name }}</td>
                  <td><input type="number" [(ngModel)]="player.goals" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.assists" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.shots" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.hits" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.takeaways" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.giveaways" min="0"></td>
                  <td><input type="number" [(ngModel)]="player.plusMinus"></td>
                  <td><input type="number" [(ngModel)]="player.timeOnIce" min="0"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="save-btn" (click)="saveStats()">Save Stats</button>
        <button class="cancel-btn" (click)="cancel()">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .manual-stats-container {
      max-width: 1400px;
      margin: 40px auto;
      background: #23293a;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
    }

    h2 {
      color: #90caf9;
      margin-bottom: 24px;
      text-align: center;
    }

    h3 {
      color: #90caf9;
      margin: 24px 0 16px;
    }

    h4 {
      color: #90caf9;
      margin: 16px 0;
    }

    .stats-section {
      margin-bottom: 32px;
    }

    .teams-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .team-stats {
      background: #1a1f2e;
      border-radius: 8px;
      padding: 16px;
    }

    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }

    .stats-table th,
    .stats-table td {
      padding: 8px;
      text-align: center;
      border: 1px solid #394867;
    }

    .stats-table th {
      background: #23293a;
      color: #90caf9;
      font-weight: bold;
    }

    .stats-table input {
      width: 60px;
      background: #2c3446;
      border: 1px solid #394867;
      color: #fff;
      padding: 4px;
      border-radius: 4px;
      text-align: center;
    }

    .actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 32px;
    }

    .save-btn,
    .cancel-btn {
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .save-btn {
      background: #43a047;
      color: #fff;
    }

    .save-btn:hover {
      background: #388e3c;
    }

    .cancel-btn {
      background: #d32f2f;
      color: #fff;
    }

    .cancel-btn:hover {
      background: #b71c1c;
    }

    @media (max-width: 1200px) {
      .teams-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ManualStatsComponent implements OnInit {
  game: any;
  homeGoalies: GoalieStats[] = [];
  awayGoalies: GoalieStats[] = [];
  homePlayers: PlayerStats[] = [];
  awayPlayers: PlayerStats[] = [];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit() {
    const gameId = this.route.snapshot.paramMap.get('gameId');
    if (gameId) {
      this.loadGameAndPlayers(gameId);
    }
  }

  loadGameAndPlayers(gameId: string) {
    this.api.getGame(gameId).subscribe(game => {
      this.game = game;
      // Load players for both teams
      this.loadTeamPlayers(game.homeClubId, true);
      this.loadTeamPlayers(game.awayClubId, false);
    });
  }

  loadTeamPlayers(teamId: string, isHome: boolean) {
    this.api.getTeamPlayers(teamId).subscribe(players => {
      const goalies = players.filter(p => p.position === 'G').map(p => ({
        goalieId: p._id,
        name: p.name,
        saves: 0,
        shotsAgainst: 0,
        goalsAgainst: 0,
        savePercentage: 0,
        timeOnIce: 0
      }));

      const skaters = players.filter(p => p.position !== 'G').map(p => ({
        playerId: p._id,
        name: p.name,
        goals: 0,
        assists: 0,
        shots: 0,
        hits: 0,
        takeaways: 0,
        giveaways: 0,
        plusMinus: 0,
        timeOnIce: 0
      }));

      if (isHome) {
        this.homeGoalies = goalies;
        this.homePlayers = skaters;
      } else {
        this.awayGoalies = goalies;
        this.awayPlayers = skaters;
      }
    });
  }

  calculateSavePercentage(goalie: GoalieStats): number {
    if (goalie.shotsAgainst === 0) return 0;
    return Math.round((goalie.saves / goalie.shotsAgainst) * 100);
  }

  saveStats() {
    const stats = {
      gameId: this.game._id,
      homeTeam: {
        goalies: this.homeGoalies,
        players: this.homePlayers
      },
      awayTeam: {
        goalies: this.awayGoalies,
        players: this.awayPlayers
      }
    };

    this.api.saveGameStats(stats).subscribe({
      next: () => {
        alert('Stats saved successfully!');
        // Navigate back to schedule
        window.history.back();
      },
      error: (err) => {
        alert('Failed to save stats: ' + (err?.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  cancel() {
    window.history.back();
  }
} 