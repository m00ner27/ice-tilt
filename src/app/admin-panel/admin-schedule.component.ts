import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../store/services/api.service';
import { EashlService } from '../services/eashl.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
            <tr *ngFor="let game of games" (click)="loadEashlGames(game)">
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
                    <option *ngFor="let file of game.eashlGames" [value]="file.matchId">{{ file.label }}</option>
                  </select>
                  <div class="linked-files" *ngIf="game.eashlMatchId">
                    <span class="linked-file">Linked: {{ getLinkedFileName(game) }}</span>
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
    private eashlService: EashlService,
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
            selectedStatsFile: '',
            eashlGames: []
          };
          mapped._original = JSON.parse(JSON.stringify({
            forfeitOption: mapped.forfeitOption,
          }));
          return mapped;
        });
        console.log('Mapped games with clubs:', this.games);
      });
    });
  }

  loadEashlGames(game: any) {
    console.log('--- Loading EASHL Games for ---', game);
    if (game.eashlGames && game.eashlGames.length > 0) {
      console.log('Games already loaded, skipping fetch.');
      return;
    }

    const homeClub = this.clubs.find(c => c._id === game.homeClubId);
    const awayClub = this.clubs.find(c => c._id === game.awayClubId);
    console.log('Found Home Club:', homeClub);
    console.log('Found Away Club:', awayClub);

    if (!homeClub?.eashlClubId || !awayClub?.eashlClubId) {
      console.error('One or both clubs missing EASHL Club ID. Home ID:', homeClub?.eashlClubId, 'Away ID:', awayClub?.eashlClubId);
      return;
    }
    console.log(`Fetching games for ${homeClub.name} (${homeClub.eashlClubId}) and ${awayClub.name} (${awayClub.eashlClubId})`);

    const homeGames$ = this.eashlService.getClubMatches(homeClub.eashlClubId).pipe(
      catchError(err => {
        console.error(`Failed to load games for ${homeClub.name}`, err);
        return of([]);
      })
    );
    const awayGames$ = this.eashlService.getClubMatches(awayClub.eashlClubId).pipe(
      catchError(err => {
        console.error(`Failed to load games for ${awayClub.name}`, err);
        return of([]);
      })
    );

    forkJoin([homeGames$, awayGames$]).pipe(
      map(([homeGames, awayGames]) => {
        console.log('Raw data from API:', { homeGames, awayGames });
        const allGames = [...homeGames, ...awayGames];
        const uniqueGames = Array.from(new Map(allGames.map(item => [item.matchId, item])).values());
        console.log('Unique games found:', uniqueGames);
        return uniqueGames.map(match => {
          const clubDetails = match.clubs[homeClub.eashlClubId];
          const opponentDetails = clubDetails ? match.clubs[clubDetails.opponentClubId] : null;
          const opponentName = opponentDetails ? opponentDetails.details.name : 'Unknown';
          const score = clubDetails ? `${clubDetails.score} - ${clubDetails.opponentScore}` : 'N/A';
          const timeAgo = match.timeAgo.number + ' ' + match.timeAgo.unit + ' ago';
          return {
            matchId: match.matchId,
            label: `${homeClub.name} vs ${opponentName} (${score}) - ${timeAgo}`
          };
        });
      })
    ).subscribe(formattedGames => {
      console.log('Final formatted games for dropdown:', formattedGames);
      game.eashlGames = formattedGames;
      console.log('Updated game object:', game);
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'Date TBD';
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

  getLinkedFileName(game: any): string {
    const linkedFile = game.eashlGames?.find((f: any) => f.matchId === game.eashlMatchId);
    if (linkedFile) {
      return linkedFile.label;
    }
    // If games haven't been loaded, just show the ID
    return game.eashlMatchId ? `Match ID: ${game.eashlMatchId}` : '';
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
    const updates = this.games
      .filter(game => game.forfeitOption || game.selectedStatsFile)
      .map(game => ({
        gameId: game._id,
        forfeit: game.forfeitOption,
        eashlMatchId: game.selectedStatsFile || game.eashlMatchId
      }));

    if (updates.length > 0) {
      this.api.bulkUpdateGames(updates).subscribe({
        next: (updatedGames) => {
          alert('Changes submitted successfully!');
          // Now, for each updated game that has an eashlMatchId, fetch the detailed stats
          const eashlUpdatePromises = updatedGames
            .filter((game: any) => game && game.eashlMatchId)
            .map((game: any) => this.api.getGameEashlData(game._id).toPromise());

          Promise.all(eashlUpdatePromises)
            .then(() => {
              console.log('All EASHL data fetched and stored.');
              this.loadClubsAndGames(); // Reload all data
            })
            .catch(err => {
              console.error('Error fetching some EASHL data after bulk update:', err);
              this.loadClubsAndGames(); // Still reload
            });
        },
        error: (err) => {
          alert('Failed to submit changes: ' + (err?.error?.message || err.message || 'Unknown error'));
        }
      });
    } else {
      alert('No changes to submit.');
    }
  }
}
