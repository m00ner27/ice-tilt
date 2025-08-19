import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../store/services/api.service';
import { EashlService } from '../../services/eashl.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="admin-schedule-page">
      <h2>Admin: Game Schedule</h2>
      <div class="filter-controls">
        <button (click)="setFilter('unlinked')" [class.active]="currentFilter === 'unlinked'">
          Needs Linking <span *ngIf="unlinkedGamesCount > 0" class="count-badge">{{ unlinkedGamesCount }}</span>
        </button>
        <button (click)="setFilter('linked')" [class.active]="currentFilter === 'linked'">Completed</button>
        <button (click)="setFilter('all')" [class.active]="currentFilter === 'all'">All Games</button>
      </div>
      <div class="schedule-table-container">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Home Team</th>
              <th>Away Team</th>
              <th>Link / Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let game of filteredGames" (click)="loadEashlGames(game)">
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
                <div class="stats-files">
                  <select [(ngModel)]="game.selectedFileOrAction" class="stats-file-select" (focus)="loadEashlGames(game)" (click)="$event.stopPropagation()">
                    <option value="" disabled>{{ game.eashlMatchId ? 'Change Linked File' : 'Link Stats / Forfeit' }}</option>
                    
                    <!-- Forfeit Options -->
                    <option value="forfeit-home">Forfeit Win: {{ game.homeTeam }}</option>
                    <option value="forfeit-away">Forfeit Win: {{ game.awayTeam }}</option>
                    <option value="forfeit-draw">Forfeit DRAW</option>
                    
                    <!-- File Options -->
                    <ng-container *ngIf="game.eashlGames?.length > 0">
                      <option disabled>──────────</option>
                      <option *ngFor="let file of game.eashlGames" [value]="file.matchId">{{ file.label }}</option>
                    </ng-container>
                  </select>
                  
                  <div class="linked-files" *ngIf="game.eashlMatchId && !isForfeit(game.status)">
                    <span class="linked-file">Linked: {{ getLinkedFileName(game) }}</span>
                  </div>

                  <div class="forfeit-indicator" *ngIf="isForfeit(game.status)">
                     {{ getForfeitDisplay(game) }}
                  </div>
                </div>
              </td>
              <td>
                <button class="action-btn" (click)="$event.stopPropagation(); manualStats(game)">Manually Enter Stats</button>
                <button class="action-btn merge" (click)="$event.stopPropagation(); mergeStats(game)">Merge Stats</button>
                <button *ngIf="game.eashlMatchId" class="action-btn unlink" (click)="$event.stopPropagation(); unlinkStats(game)">Unlink Stats</button>
                <button *ngIf="!game.eashlMatchId" class="action-btn delete" (click)="$event.stopPropagation(); deleteGame(game)">Delete Game</button>
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
    .filter-controls {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .filter-controls button {
      background: #2c3446;
      color: #fff;
      border: 1px solid #394867;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-controls button:hover {
      background: #394867;
    }
    .filter-controls button.active {
      background: #1976d2;
      border-color: #1976d2;
      font-weight: 600;
    }
    .count-badge {
      background-color: #d32f2f;
      color: white;
      border-radius: 12px;
      padding: 3px 8px;
      font-size: 0.85em;
      margin-left: 8px;
      vertical-align: middle;
      line-height: 1;
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
    .action-btn.unlink {
      background: #ff9800;
      margin-top: 4px;
    }
    .action-btn.unlink:hover {
      background: #f57c00;
    }
    .action-btn.delete {
      background: #c62828;
      margin-top: 4px;
    }
    .action-btn.delete:hover {
      background: #ad1f1f;
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
  filteredGames: any[] = [];
  clubs: any[] = [];
  currentFilter: 'all' | 'linked' | 'unlinked' = 'unlinked';
  unlinkedGamesCount: number = 0;

  constructor(
    private api: ApiService,
    private eashlService: EashlService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClubsAndGames();
  }

  setFilter(filter: 'all' | 'linked' | 'unlinked'): void {
    this.currentFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.currentFilter === 'unlinked') {
      this.filteredGames = this.games.filter(g => !g.eashlMatchId && !this.isForfeit(g.status));
    } else if (this.currentFilter === 'linked') {
      this.filteredGames = this.games.filter(g => g.eashlMatchId || this.isForfeit(g.status));
    } else {
      this.filteredGames = this.games;
    }
  }

  calculateUnlinkedCount(): void {
    this.unlinkedGamesCount = this.games.filter(g => !g.eashlMatchId && !this.isForfeit(g.status)).length;
  }

  loadClubsAndGames(): void {
    this.api.getClubs().subscribe(clubs => {
      this.clubs = clubs;
      this.api.getGames().subscribe(games => {
        this.games = games.map(game => {
          // Ensure that homeClubId and awayClubId are objects before accessing their properties
          const homeId = game.homeClubId?._id || game.homeClubId;
          const awayId = game.awayClubId?._id || game.awayClubId;

          const homeClub = this.clubs.find(c => c._id === homeId);
          const awayClub = this.clubs.find(c => c._id === awayId);
          
          const mapped = {
            ...game,
            homeTeam: homeClub ? homeClub.name : 'Unknown',
            awayTeam: awayClub ? awayClub.name : 'Unknown',
            homeLogo: homeClub ? homeClub.logoUrl : '',
            awayLogo: awayClub ? awayClub.logoUrl : '',
            selectedFileOrAction: '',
            eashlGames: []
          };
          return mapped;
        });
        this.games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.applyFilter();
        this.calculateUnlinkedCount();
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

    const homeId = game.homeClubId?._id || game.homeClubId;
    const awayId = game.awayClubId?._id || game.awayClubId;

    const homeClub = this.clubs.find(c => c._id === homeId);
    const awayClub = this.clubs.find(c => c._id === awayId);
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
      map(([homeResponse, awayResponse]) => {
        console.log('Raw data from API:', { homeResponse, awayResponse });
        
        // Extract the arrays from the response objects
        const homeGames = homeResponse?.homeGames || [];
        const awayGames = awayResponse?.awayGames || [];
        
        console.log('Extracted games:', { homeGames, awayGames });
        
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

  isForfeit(status: string): boolean {
    return status?.startsWith('forfeit');
  }

  getForfeitDisplay(game: any): string {
    switch (game.status) {
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

  unlinkStats(game: any) {
    if (confirm(`Are you sure you want to unlink stats for ${game.homeTeam} vs ${game.awayTeam}?`)) {
      this.api.unlinkGameStats(game._id).subscribe({
        next: (updatedGame) => {
          console.log('Stats unlinked', updatedGame);
          const index = this.games.findIndex(g => g._id === game._id);
          if (index !== -1) {
            // update game in list
            const updatedGameWithAssets = {
              ...updatedGame,
              homeLogo: this.games[index].homeLogo,
              awayLogo: this.games[index].awayLogo,
              homeTeam: this.games[index].homeTeam,
              awayTeam: this.games[index].awayTeam,
            };
            this.games[index] = updatedGameWithAssets;
            this.applyFilter();
            this.calculateUnlinkedCount();
          }
        },
        error: (err) => {
          alert('Failed to unlink stats: ' + (err?.error?.message || err.message || 'Unknown error'));
        }
      });
    }
  }

  deleteGame(game: any) {
    if (confirm(`Are you sure you want to delete the game between ${game.homeTeam} and ${game.awayTeam}? This action cannot be undone.`)) {
      this.api.deleteGame(game._id).subscribe({
        next: () => {
          alert('Game deleted successfully!');
          this.loadClubsAndGames(); // Reload data
        },
        error: (err) => {
          alert('Failed to delete game: ' + (err?.error?.message || err.message || 'Unknown error'));
        }
      });
    }
  }

  submitChanges() {
    const updates = this.games
      .filter(game => game.selectedFileOrAction)
      .map(game => {
        const selected = game.selectedFileOrAction;
        const payload: { gameId: string; forfeit?: string | null; eashlMatchId?: string | null; status?: string } = {
          gameId: game._id
        };

        if (selected.startsWith('forfeit-')) {
          payload.forfeit = selected;
          payload.status = selected;
          payload.eashlMatchId = null; // Explicitly unlink stats
        } else {
          // It's a matchId
          payload.eashlMatchId = selected;
          payload.forfeit = null; // Explicitly remove forfeit
          payload.status = 'pending_stats';
        }
        return payload;
      });

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
