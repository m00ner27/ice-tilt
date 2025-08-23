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
                  
                  <!-- Overtime Checkbox -->
                  <div class="overtime-checkbox" *ngIf="game.selectedFileOrAction && !game.selectedFileOrAction.startsWith('forfeit-')">
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="game.isOvertime" (click)="$event.stopPropagation()">
                      <span class="checkbox-text">Overtime Game</span>
                    </label>
                  </div>
                  
                  <div class="linked-files" *ngIf="game.eashlMatchId && !isForfeit(game.status)">
                    <span class="linked-file">Linked: {{ getLinkedFileName(game) }}</span>
                    <span class="overtime-indicator" *ngIf="game.isOvertime">⚡ OT</span>
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
    .overtime-checkbox {
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: #90caf9;
      font-size: 0.9rem;
    }
    .checkbox-label input[type="checkbox"] {
      margin-right: 6px;
      accent-color: #1976d2;
    }
    .checkbox-text {
      font-weight: 500;
    }
    .overtime-indicator {
      background: #ff5722;
      color: #fff;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 0.85rem;
      margin-left: 8px;
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
    console.log('=== Applying filter ===');
    console.log('Current filter:', this.currentFilter);
    console.log('Total games:', this.games.length);
    
    if (this.currentFilter === 'unlinked') {
      this.filteredGames = this.games.filter(g => !this.isGameLinked(g) && !this.isForfeit(g.status));
      console.log('Unlinked games:', this.filteredGames.length);
    } else if (this.currentFilter === 'linked') {
      this.filteredGames = this.games.filter(g => this.isGameLinked(g) || this.isForfeit(g.status));
      console.log('Linked games:', this.filteredGames.length);
    } else {
      this.filteredGames = this.games;
      console.log('All games:', this.filteredGames.length);
    }
  }

  calculateUnlinkedCount(): void {
    this.unlinkedGamesCount = this.games.filter(g => !this.isGameLinked(g) && !this.isForfeit(g.status)).length;
    console.log('Unlinked count calculated:', this.unlinkedGamesCount);
  }

  private isGameLinked(game: any): boolean {
    // A game is considered "linked" if it has:
    // 1. An EASHL match ID, OR
    // 2. Manual stats entered (eashlData with manualEntry flag)
    const hasEashlMatchId = !!game.eashlMatchId;
    const hasManualStats = !!(game.eashlData && game.eashlData.manualEntry);
    const isLinked = hasEashlMatchId || hasManualStats;
    
    console.log(`=== GAME LINKING CHECK ===`);
    console.log(`Game ID: ${game._id}`);
    console.log(`EASHL Match ID: ${game.eashlMatchId}`);
    console.log(`Has EASHL Match ID: ${hasEashlMatchId}`);
    console.log(`EASHL Data:`, game.eashlData);
    console.log(`Manual Entry Flag: ${game.eashlData?.manualEntry}`);
    console.log(`Has Manual Stats: ${hasManualStats}`);
    console.log(`Is Linked: ${isLinked}`);
    
    return isLinked;
  }

  loadClubsAndGames(): void {
    console.log('=== Loading clubs and games ===');
    this.api.getClubs().subscribe(clubs => {
      this.clubs = clubs;
      console.log('Clubs loaded:', clubs.length);
      this.api.getGames().subscribe(games => {
        console.log('Games loaded from API:', games.length);
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
        console.log('Mapped games with clubs:', this.games.length);
        console.log('Games with eashlMatchId:', this.games.filter(g => g.eashlMatchId).length);
        console.log('Games without eashlMatchId:', this.games.filter(g => !g.eashlMatchId).length);
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
          
          // Extract the actual score values for later use
          const homeScore = clubDetails ? parseInt(clubDetails.score) : 0;
          const awayScore = clubDetails ? parseInt(clubDetails.opponentScore) : 0;
          
          return {
            matchId: match.matchId,
            label: `${homeClub.name} vs ${opponentName} (${score}) - ${timeAgo}`,
            score: {
              home: homeScore,
              away: awayScore
            },
            // Also store the raw match data for debugging
            rawMatch: match
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
    console.log('getLinkedFileName called for game:', {
      _id: game._id,
      score: game.score,
      homeTeamScore: game.homeTeamScore,
      awayTeamScore: game.awayTeamScore,
      eashlMatchId: game.eashlMatchId,
      status: game.status
    });
    
    // If we have the actual game score, show it instead of the match ID
    if (game.score && typeof game.score.home !== 'undefined' && typeof game.score.away !== 'undefined') {
      const homeScore = game.score.home;
      const awayScore = game.score.away;
      const overtimeIndicator = game.isOvertime ? ' (OT)' : '';
      const result = `${game.homeTeam} ${homeScore} - ${awayScore} ${game.awayTeam}${overtimeIndicator}`;
      console.log('Showing score from score object:', result);
      return result;
    }
    
    // Also check for direct score fields
    if (typeof game.homeTeamScore !== 'undefined' && typeof game.awayTeamScore !== 'undefined') {
      const homeScore = game.homeTeamScore;
      const awayScore = game.awayTeamScore;
      const overtimeIndicator = game.isOvertime ? ' (OT)' : '';
      const result = `${game.homeTeam} ${homeScore} - ${awayScore} ${game.awayTeam}${overtimeIndicator}`;
      console.log('Showing score from direct fields:', result);
      return result;
    }
    
    // Fallback to the original method if score isn't available yet
    const linkedFile = game.eashlGames?.find((f: any) => f.matchId === game.eashlMatchId);
    if (linkedFile) {
      console.log('Showing linked file label:', linkedFile.label);
      return linkedFile.label;
    }
    
    // Last fallback - just show the ID
    const result = game.eashlMatchId ? `Match ID: ${game.eashlMatchId}` : '';
    console.log('Showing match ID:', result);
    return result;
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
    // Show merge modal to select which game to merge with
    this.showMergeModal(game);
  }

  showMergeModal(primaryGame: any) {
    // Load EASHL games for this team matchup (same as the dropdown)
    this.loadEashlGamesForMerge(primaryGame);
  }

  loadEashlGamesForMerge(primaryGame: any) {
    console.log('=== LOADING EASHL GAMES FOR MERGE ===');
    
    const homeId = primaryGame.homeClubId?._id || primaryGame.homeClubId;
    const awayId = primaryGame.awayClubId?._id || primaryGame.awayClubId;

    const homeClub = this.clubs.find(c => c._id === homeId);
    const awayClub = this.clubs.find(c => c._id === awayId);
    
    if (!homeClub?.eashlClubId || !awayClub?.eashlClubId) {
      alert('One or both clubs missing EASHL Club ID. Cannot load games for merging.');
      return;
    }

    console.log(`Fetching EASHL games for ${homeClub.name} (${homeClub.eashlClubId}) and ${awayClub.name} (${awayClub.eashlClubId})`);

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
        console.log('Raw EASHL data for merge:', { homeResponse, awayResponse });
        
        // Extract the arrays from the response objects
        const homeGames = homeResponse?.homeGames || [];
        const awayGames = awayResponse?.awayGames || [];
        
        const allGames = [...homeGames, ...awayGames];
        const uniqueGames = Array.from(new Map(allGames.map(item => [item.matchId, item])).values());
        
        console.log('Unique EASHL games found for merge:', uniqueGames);
        
        if (uniqueGames.length < 2) {
          alert('Need at least 2 EASHL games to merge. Found: ' + uniqueGames.length);
          return;
        }
        
        // Show the merge selection modal with EASHL games
        this.showEashlMergeModal(primaryGame, uniqueGames);
      })
    ).subscribe();
  }

  showEashlMergeModal(primaryGame: any, eashlGames: any[]) {
    console.log('=== SHOWING EASHL MERGE MODAL ===');
    
    // Create HTML for the EASHL game selection modal
    const modalHtml = `
      <div style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 20px auto;">
        <h3 style="margin-top: 0; color: #333;">Select EASHL Games to Merge</h3>
        <p style="color: #666; margin-bottom: 20px;">Choose 2 EASHL games to merge into one complete game record:</p>
        
        <div style="margin-bottom: 20px;">
          ${eashlGames.map((game, i) => `
            <label style="display: block; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
              <input type="checkbox" name="mergeGame" value="${game.matchId}" style="margin-right: 10px;">
              <strong>${this.formatEashlGameLabel(game, primaryGame)}</strong>
            </label>
          `).join('')}
        </div>
        
        <div style="text-align: right;">
          <button onclick="window.mergeCancel()" style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer;">Cancel</button>
          <button onclick="window.mergeEashlGames()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Merge Selected Games</button>
        </div>
      </div>
    `;

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); z-index: 10000; display: flex; 
      align-items: center; justify-content: center;
    `;
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    // Add global functions for the modal buttons
    (window as any).mergeCancel = () => {
      document.body.removeChild(modalContainer);
      delete (window as any).mergeCancel;
      delete (window as any).mergeEashlGames;
    };

    (window as any).mergeEashlGames = () => {
      const selectedCheckboxes = document.querySelectorAll('input[name="mergeGame"]:checked') as NodeListOf<HTMLInputElement>;
      const selectedGameIds = Array.from(selectedCheckboxes).map(cb => cb.value);
      
      if (selectedGameIds.length !== 2) {
        alert('Please select exactly 2 EASHL games to merge.');
        return;
      }
      
      // Format the selected EASHL games to extract scores
      const selectedGames = eashlGames
        .filter(g => selectedGameIds.includes(g.matchId))
        .map(game => {
          // Extract score data similar to how we do it in loadEashlGamesForGame
          const homeClub = this.clubs.find(c => c.eashlClubId === primaryGame.homeClubId?.eashlClubId);
          if (homeClub) {
            const clubDetails = game.clubs[homeClub.eashlClubId];
            if (clubDetails) {
              const homeScore = parseInt(clubDetails.score) || 0;
              const awayScore = parseInt(clubDetails.opponentScore) || 0;
              
              return {
                ...game,
                score: {
                  home: homeScore,
                  away: awayScore
                }
              };
            }
          }
          
          // Fallback if we can't extract scores
          return {
            ...game,
            score: { home: 0, away: 0 }
          };
        });
      
      if (selectedGames.length !== 2) {
        alert('Error: Could not process the selected EASHL games. Please try again.');
        return;
      }
      
      document.body.removeChild(modalContainer);
      delete (window as any).mergeCancel;
      delete (window as any).mergeEashlGames;
      
      this.confirmEashlMerge(primaryGame, selectedGames);
    };
  }

  calculateTeamGoals(eashlGame: any, homeClubEashlId: string, isHomeTeam: boolean): number {
    // Calculate team goals by summing player goals from the eashlData
    let totalGoals = 0;
    
    if (eashlGame.players) {
      // Get all club IDs from the game
      const clubIds = Object.keys(eashlGame.players);
      
      // Determine which club ID to use
      let targetClubId = '';
      if (isHomeTeam) {
        // For home team, use the homeClubEashlId
        targetClubId = homeClubEashlId;
      } else {
        // For away team, find the other club ID that's not the home team
        targetClubId = clubIds.find(id => id !== homeClubEashlId) || '';
      }
      
      console.log(`Looking for ${isHomeTeam ? 'home' : 'away'} team goals in club ID:`, targetClubId);
      
      if (targetClubId && eashlGame.players[targetClubId]) {
        const teamPlayers = eashlGame.players[targetClubId];
        
        // Sum goals from all players on this team
        Object.values(teamPlayers).forEach((player: any) => {
          if (player.skgoals && !isNaN(parseInt(player.skgoals))) {
            totalGoals += parseInt(player.skgoals);
          }
        });
      }
    }
    
    console.log(`Team ${isHomeTeam ? 'home' : 'away'} goals calculated:`, totalGoals);
    return totalGoals;
  }

  combinePlayerStats(game1: any, game2: any, homeClubEashlId: string): any {
    // Combine player statistics from two EASHL games
    const combinedPlayers: any = {};
    
    // Process both games
    [game1, game2].forEach((game, gameIndex) => {
      if (game.players) {
        Object.keys(game.players).forEach(clubId => {
          if (!combinedPlayers[clubId]) {
            combinedPlayers[clubId] = {};
          }
          
          const teamPlayers = game.players[clubId];
          Object.keys(teamPlayers).forEach(playerId => {
            const player = teamPlayers[playerId];
            
            // Debug: log player data to see what fields are available
            console.log(`Player ${playerId} data:`, player);
            
            if (!combinedPlayers[clubId][playerId]) {
              // Initialize player if not exists - use the same field as match service
              const playerName = player.playername || player.name || player.gamertag || `Player ${playerId}`;
              
              console.log(`Player name resolved: ${playerName} from fields:`, {
                playername: player.playername,
                name: player.name,
                gamertag: player.gamertag
              });
              
              combinedPlayers[clubId][playerId] = {
                playername: playerName, // Use playername field to match existing structure
                name: playerName, // Also include name for compatibility
                jerseynum: player.jerseynum || 0,
                position: player.position || 'Unknown',
                skgoals: 0,
                skassists: 0,
                skplusmin: 0, // Note: match service uses skplusmin not skplusminus
                sktoi: 0,
                skhits: 0,
                skblk: 0,
                skgiveaways: 0,
                sktakeaways: 0,
                skpim: 0,
                glsaves: 0,
                glshots: 0,
                glga: 0,
                glso: 0
              };
            }
            
            // Add stats from this game to the combined total
            const combinedPlayer = combinedPlayers[clubId][playerId];
            
            // Skater stats
            if (player.skgoals) combinedPlayer.skgoals += parseInt(player.skgoals) || 0;
            if (player.skassists) combinedPlayer.skassists += parseInt(player.skassists) || 0;
            if (player.skplusmin) combinedPlayer.skplusmin += parseInt(player.skplusmin) || 0;
            if (player.sktoi) combinedPlayer.sktoi += parseInt(player.sktoi) || 0;
            if (player.skhits) combinedPlayer.skhits += parseInt(player.skhits) || 0;
            if (player.skblk) combinedPlayer.skblk += parseInt(player.skblk) || 0;
            if (player.skgiveaways) combinedPlayer.skgiveaways += parseInt(player.skgiveaways) || 0;
            if (player.sktakeaways) combinedPlayer.sktakeaways += parseInt(player.sktakeaways) || 0;
            if (player.skpim) combinedPlayer.skpim += parseInt(player.skpim) || 0;
            
            // Goalie stats
            if (player.glsaves) combinedPlayer.glsaves += parseInt(player.glsaves) || 0;
            if (player.glshots) combinedPlayer.glshots += parseInt(player.glshots) || 0;
            if (player.glga) combinedPlayer.glga += parseInt(player.glga) || 0;
            if (player.glso) combinedPlayer.glso += parseInt(player.glso) || 0;
          });
        });
      }
    });
    
    console.log('Combined player stats:', combinedPlayers);
    return combinedPlayers;
  }

  formatEashlGameLabel(eashlGame: any, primaryGame: any): string {
    // Format the EASHL game label similar to the dropdown
    const homeClub = this.clubs.find(c => c.eashlClubId === primaryGame.homeClubId?.eashlClubId);
    const awayClub = this.clubs.find(c => c.eashlClubId === primaryGame.awayClubId?.eashlClubId);
    
    if (homeClub && awayClub) {
      const clubDetails = eashlGame.clubs[homeClub.eashlClubId];
      if (clubDetails) {
        const opponentDetails = eashlGame.clubs[clubDetails.opponentClubId];
        const opponentName = opponentDetails ? opponentDetails.details.name : 'Unknown';
        const score = clubDetails ? `${clubDetails.score} - ${clubDetails.opponentScore}` : 'N/A';
        const timeAgo = eashlGame.timeAgo.number + ' ' + eashlGame.timeAgo.unit + ' ago';
        return `${homeClub.name} vs ${opponentName} (${score}) - ${timeAgo}`;
      }
    }
    
    return `Game ${eashlGame.matchId} - ${eashlGame.timeAgo.number} ${eashlGame.timeAgo.unit} ago`;
  }

  confirmEashlMerge(primaryGame: any, selectedEashlGames: any[]) {
    const confirmMessage = `Are you sure you want to merge these EASHL games?\n\n` +
      `Primary Game: ${primaryGame.homeTeam} vs ${primaryGame.awayTeam}\n` +
      `EASHL Game 1: ${this.formatEashlGameLabel(selectedEashlGames[0], primaryGame)}\n` +
      `EASHL Game 2: ${this.formatEashlGameLabel(selectedEashlGames[1], primaryGame)}\n\n` +
      `This will create one complete game record with merged EASHL data.`;

    if (confirm(confirmMessage)) {
      this.performEashlMerge(primaryGame._id, selectedEashlGames);
    }
  }

  performEashlMerge(primaryGameId: string, selectedEashlGames: any[]) {
    // Actually merge the EASHL data from both games
    if (selectedEashlGames.length !== 2) {
      alert('Please select exactly 2 EASHL games to merge.');
      return;
    }
    
    const game1 = selectedEashlGames[0];
    const game2 = selectedEashlGames[1];
    
    console.log('Merging EASHL games:', { game1: game1.matchId, game2: game2.matchId });
    
    // First, extract and combine the scores from the selected EASHL games
    console.log('Extracting scores from EASHL games...');
    
    // Calculate scores by summing player goals instead of trusting EA's game-level scores
    // This is more accurate because EA sometimes shows default scores (like 3-0) for incomplete games
    let combinedScore = { home: 0, away: 0 };
    
    console.log('Calculating scores from player goals...');
    
    // Get the home club EASHL ID to identify which team is which
    const homeClub = this.games.find(g => g._id === primaryGameId)?.homeClubId;
    const homeClubEashlId = homeClub?.eashlClubId;
    
    if (homeClubEashlId) {
      console.log('Home club EASHL ID:', homeClubEashlId);
      
      // Calculate scores for Game 1 by summing player goals
      const game1HomeGoals = this.calculateTeamGoals(game1, homeClubEashlId, true);
      const game1AwayGoals = this.calculateTeamGoals(game1, homeClubEashlId, false);
      
      // Calculate scores for Game 2 by summing player goals
      const game2HomeGoals = this.calculateTeamGoals(game2, homeClubEashlId, true);
      const game2AwayGoals = this.calculateTeamGoals(game2, homeClubEashlId, false);
      
      // Combine the actual goals scored
      combinedScore = {
        home: game1HomeGoals + game2HomeGoals,
        away: game1AwayGoals + game2AwayGoals
      };
      
      console.log('Game 1 actual goals:', { home: game1HomeGoals, away: game1AwayGoals });
      console.log('Game 2 actual goals:', { home: game2HomeGoals, away: game2AwayGoals });
      console.log('Combined actual goals:', combinedScore);
    } else {
      console.error('Could not find home club EASHL ID');
    }
    
    // Combine player statistics from both games
    const combinedPlayerStats = this.combinePlayerStats(game1, game2, homeClubEashlId);
    
    // Create combined EASHL data structure
    const combinedEashlData = {
      players: combinedPlayerStats,
      // We could also combine club stats if needed
      clubs: {
        [homeClubEashlId]: {
          score: combinedScore.home,
          opponentScore: combinedScore.away
        }
      }
    };
    
    // Send the combined score and player stats to the backend
    const updatePayload = {
      gameId: primaryGameId,
      eashlMatchId: `${game1.matchId}+${game2.matchId}`, // Use a special format to indicate merged games
      status: 'completed', // Mark as completed since we have the final scores
      score: combinedScore,
      homeTeamScore: combinedScore.home,
      awayTeamScore: combinedScore.away,
      eashlData: combinedEashlData // Include the combined player statistics
    };
    
    this.api.bulkUpdateGames([updatePayload]).subscribe({
      next: (updatedGames) => {
        alert(`EASHL games merged successfully!\n\nGame ${primaryGameId} now linked to merged EASHL matches ${game1.matchId} + ${game2.matchId}`);
        
        console.log('EASHL merge result:', updatedGames);
        
        // Update the local game data immediately
        const gameIndex = this.games.findIndex(g => g._id === primaryGameId);
        if (gameIndex !== -1) {
          const updatedGame = {
            ...this.games[gameIndex],
            eashlMatchId: `${game1.matchId}+${game2.matchId}`,
            status: 'pending_stats'
          };
          console.log('Updated game after EASHL merge:', updatedGame);
          this.games[gameIndex] = updatedGame;
        }
        
        // Refresh the display and recalculate counts
        this.applyFilter();
        this.calculateUnlinkedCount();
        
        // Update the local game with the combined score and EASHL data that was sent to backend
        if (gameIndex !== -1) {
          this.games[gameIndex] = {
            ...this.games[gameIndex],
            score: combinedScore,
            homeTeamScore: combinedScore.home,
            awayTeamScore: combinedScore.away,
            status: 'completed',
            eashlData: combinedEashlData // Include the combined player statistics locally
          };
          
          console.log('Local game updated with combined score and EASHL data:', this.games[gameIndex]);
        }
        
        // Force a complete data refresh to ensure everything is in sync
        setTimeout(() => {
          console.log('Refreshing data after EASHL merge...');
          this.loadClubsAndGames();
        }, 100);
      },
      error: (err) => {
        alert('Failed to merge EASHL games: ' + (err?.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  confirmMerge(primaryGame: any, secondaryGame: any) {
    const confirmMessage = `Are you sure you want to merge these games?\n\n` +
      `Primary Game: ${primaryGame.homeTeam} vs ${primaryGame.awayTeam} (${this.formatDateTime(primaryGame.date)})\n` +
      `Secondary Game: ${secondaryGame.homeTeam} vs ${secondaryGame.awayTeam} (${this.formatDateTime(secondaryGame.date)})\n\n` +
      `This will combine the stats from both games and delete the secondary game.`;

    if (confirm(confirmMessage)) {
      this.performMerge(primaryGame._id, secondaryGame._id);
    }
  }

  performMerge(primaryGameId: string, secondaryGameId: string) {
    this.api.mergeGames(primaryGameId, secondaryGameId).subscribe({
      next: (result) => {
        alert(`Games merged successfully!\n\nMerged game ID: ${result.mergedGame._id}\nDeleted game ID: ${result.deletedGameId}`);
        
        console.log('Merge result:', result);
        console.log('Merged game data:', result.mergedGame);
        
        // Remove the deleted game from the local list
        this.games = this.games.filter(g => g._id !== secondaryGameId);
        
        // Update the primary game with merged data
        const primaryGameIndex = this.games.findIndex(g => g._id === primaryGameId);
        if (primaryGameIndex !== -1) {
          // Update the game with merged data and ensure proper mapping
          const homeId = result.mergedGame.homeClubId?._id || result.mergedGame.homeClubId;
          const awayId = result.mergedGame.awayClubId?._id || result.mergedGame.awayClubId;
          
          const homeClub = this.clubs.find(c => c._id === homeId);
          const awayClub = this.clubs.find(c => c._id === awayId);
          
          const updatedGame = {
            ...this.games[primaryGameIndex],
            ...result.mergedGame,
            homeTeam: homeClub ? homeClub.name : 'Unknown',
            awayTeam: awayClub ? awayClub.name : 'Unknown',
            homeLogo: homeClub ? homeClub.logoUrl : '',
            awayLogo: awayClub ? awayClub.logoUrl : '',
            selectedFileOrAction: '',
            eashlGames: []
          };
          
          console.log('Updated game data:', updatedGame);
          this.games[primaryGameIndex] = updatedGame;
        }
        
        // Refresh the display and recalculate counts
        this.applyFilter();
        this.calculateUnlinkedCount();
        
        // Force a complete data refresh to ensure everything is in sync
        setTimeout(() => {
          console.log('Refreshing data after merge...');
          this.loadClubsAndGames();
        }, 100);
      },
      error: (err) => {
        alert('Failed to merge games: ' + (err?.error?.message || err.message || 'Unknown error'));
      }
    });
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
        const payload: { gameId: string; forfeit?: string | null; eashlMatchId?: string | null; status?: string; isOvertime?: boolean } = {
          gameId: game._id
        };

        if (selected.startsWith('forfeit-')) {
          payload.forfeit = selected;
          payload.status = selected;
          payload.eashlMatchId = null; // Explicitly unlink stats
          payload.isOvertime = false; // Forfeit games are not overtime
        } else {
          // It's a matchId
          payload.eashlMatchId = selected;
          payload.forfeit = null; // Explicitly remove forfeit
          payload.status = 'pending_stats';
          payload.isOvertime = game.isOvertime || false; // Include overtime flag
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
