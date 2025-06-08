import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../store/services/api.service';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="admin-schedule-page">
      <h2>Admin: Game Schedule</h2>
      <div class="schedule-table-container">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Home Team</th>
              <th>Away Team</th>
              <th>Forfeit</th>
              <th>Stats Files</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let game of games">
              <td>{{ formatDateTime(game.date) }}</td>
              <td>
                <img [src]="game.homeLogo" alt="Home Logo" class="team-logo" />
                {{ game.homeTeam }}
              </td>
              <td>
                <img [src]="game.awayLogo" alt="Away Logo" class="team-logo" />
                {{ game.awayTeam }}
              </td>
              <td>
                <select [(ngModel)]="game.forfeitOption" class="forfeit-select">
                  <option value="">NO CHANGE</option>
                  <option value="forfeit-home">Forfeit Win: {{ game.homeTeam }}</option>
                  <option value="forfeit-away">Forfeit Win: {{ game.awayTeam }}</option>
                  <option value="forfeit-draw">Forfeit DRAW</option>
                </select>
                <span *ngIf="game.forfeitOption" class="forfeit-indicator">
                  {{ getForfeitLabel(game) }}
                </span>
              </td>
              <td>
                <div class="stats-files">
                  <select [(ngModel)]="game.selectedStatsFile" class="stats-file-select">
                    <option value="">Link Stats File</option>
                    <option *ngFor="let file of game.statsFiles" [value]="file.id">{{ file.label }}</option>
                  </select>
                  <button class="add-file-btn" (click)="addStatsFile(game)">+</button>
                  <div class="linked-files" *ngIf="game.linkedStatsFiles?.length">
                    <span *ngFor="let file of game.linkedStatsFiles" class="linked-file">{{ file.label }}</span>
                  </div>
                </div>
              </td>
              <td>
                <button class="action-btn" (click)="manualStats(game)">Manually Enter Stats</button>
                <button class="action-btn merge" (click)="mergeStats(game)">Merge Stats</button>
              </td>
            </tr>
          </tbody>
        </table>
        <button class="submit-btn" (click)="submitChanges()">Submit Changes</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-schedule-page {
      max-width: 1200px;
      margin: 40px auto;
      background: #23293a;
      border-radius: 12px;
      padding: 32px 28px 28px 28px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
    }
    h2 {
      color: #90caf9;
      margin-bottom: 24px;
      text-align: center;
    }
    .schedule-table-container {
      overflow-x: auto;
    }
    .schedule-table {
      width: 100%;
      background: #1a1f2e;
      color: #fff;
      border-collapse: collapse;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .schedule-table th, .schedule-table td {
      padding: 12px 15px;
      text-align: center;
      border-top: 1px solid #394867;
    }
    .schedule-table th {
      background: #23293a;
      color: #90caf9;
      font-weight: bold;
      font-size: 1.05rem;
    }
    .schedule-table tbody tr:hover {
      background: #2c3446;
    }
    .team-logo {
      width: 28px;
      height: 28px;
      object-fit: contain;
      border-radius: 4px;
      background: #181c24;
      margin-right: 8px;
      vertical-align: middle;
    }
    .forfeit-select, .stats-file-select {
      background: #2c3446;
      color: #fff;
      border: 1px solid #394867;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 1rem;
    }
    .add-file-btn {
      background: #1976d2;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 4px 10px;
      margin-left: 6px;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .add-file-btn:hover {
      background: #1565c0;
    }
    .linked-files {
      margin-top: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .linked-file {
      background: #394867;
      color: #fff;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 0.95rem;
    }
    .action-btn {
      background: #1976d2;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      margin: 2px 0;
      font-size: 0.98rem;
      cursor: pointer;
      transition: background 0.2s;
      display: block;
      width: 100%;
    }
    .action-btn.merge {
      background: #d32f2f;
      margin-top: 4px;
    }
    .action-btn:hover {
      background: #1565c0;
    }
    .action-btn.merge:hover {
      background: #b71c1c;
    }
    @media (max-width: 900px) {
      .schedule-table th, .schedule-table td {
        padding: 8px 6px;
        font-size: 0.95rem;
      }
      .team-logo {
        width: 22px;
        height: 22px;
      }
    }
    .submit-btn {
      background: #43a047;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 12px 32px;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 24px auto 0 auto;
      display: block;
      cursor: pointer;
      transition: background 0.2s;
    }
    .submit-btn:hover {
      background: #388e3c;
    }
    .forfeit-indicator {
      display: block;
      margin-top: 6px;
      color: #ffb300;
      font-size: 0.98rem;
      font-weight: 600;
    }
  `]
})
export class AdminScheduleComponent implements OnInit {
  games: any[] = [];
  clubs: any[] = [];

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClubsAndGames();
  }

  loadClubsAndGames(): void {
    this.api.getClubs().subscribe(clubs => {
      this.clubs = clubs;
      this.api.getGames().subscribe(games => {
        this.games = games.map(game => {
          const homeClub = this.clubs.find(c => c._id === game.homeClubId);
          const awayClub = this.clubs.find(c => c._id === game.awayClubId);
          const mapped = {
            ...game,
            homeTeam: homeClub ? homeClub.name : 'Unknown',
            awayTeam: awayClub ? awayClub.name : 'Unknown',
            homeLogo: homeClub ? homeClub.logoUrl : '',
            awayLogo: awayClub ? awayClub.logoUrl : '',
            forfeitOption: '',
            statsFiles: [], // Placeholder for EASHL API files
            selectedStatsFile: '',
            linkedStatsFiles: []
          };
          mapped._original = JSON.parse(JSON.stringify({
            forfeitOption: mapped.forfeitOption,
            linkedStatsFiles: mapped.linkedStatsFiles
          }));
          return mapped;
        });
      });
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  }

  addStatsFile(game: any) {
    if (game.selectedStatsFile) {
      const file = game.statsFiles.find((f: any) => f.id === game.selectedStatsFile);
      if (file && !game.linkedStatsFiles.some((f: any) => f.id === file.id)) {
        game.linkedStatsFiles.push(file);
      }
      game.selectedStatsFile = '';
    }
  }

  manualStats(game: any) {
    this.router.navigate(['/admin/manual-stats', game._id]);
  }

  mergeStats(game: any) {
    // Placeholder for merge stats route
    alert('Merge stats for game: ' + game._id);
  }

  getForfeitLabel(game: any): string {
    switch (game.forfeitOption) {
      case 'forfeit-home':
        return `Forfeit Win: ${game.homeTeam}`;
      case 'forfeit-away':
        return `Forfeit Win: ${game.awayTeam}`;
      case 'forfeit-draw':
        return 'Forfeit DRAW';
      default:
        return '';
    }
  }

  submitChanges() {
    const changedGames = this.games.filter(game => {
      return (
        game.forfeitOption !== game._original.forfeitOption ||
        JSON.stringify(game.linkedStatsFiles) !== JSON.stringify(game._original.linkedStatsFiles)
      );
    });
    if (changedGames.length === 0) {
      alert('No changes to submit.');
      return;
    }
    this.api.bulkUpdateGames(changedGames.map(g => ({
      gameId: g._id,
      forfeitOption: g.forfeitOption,
      linkedStatsFiles: g.linkedStatsFiles
      // Add more fields as needed
    }))).subscribe({
      next: (res) => {
        alert('Changes submitted successfully!');
        // Optionally reload games or update originals
        this.loadClubsAndGames();
      },
      error: (err) => {
        alert('Failed to submit changes: ' + (err?.error?.message || err.message || 'Unknown error'));
      }
    });
  }
}
