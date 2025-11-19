import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ApiService } from '../../store/services/api.service';
import { EashlService } from '../../services/eashl.service';
import { ImageUrlService } from '../../shared/services/image-url.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppState } from '../../store';
import * as MatchesActions from '../../store/matches.actions';
import * as PlayoffsActions from '../../store/playoffs/playoffs.actions';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-schedule.component.html'
})
export class AdminScheduleComponent implements OnInit {
  games: any[] = [];
  filteredGames: any[] = [];
  clubs: any[] = [];
  currentFilter: 'all' | 'linked' | 'unlinked' = 'unlinked';
  unlinkedGamesCount: number = 0;
  
  // Club filtering and sorting
  selectedClub: string = 'all';
  sortBy: 'date' | 'homeTeam' | 'awayTeam' = 'date';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(
    private api: ApiService,
    private eashlService: EashlService,
    private router: Router,
    private store: Store<AppState>,
    private imageUrlService: ImageUrlService
  ) {}

  ngOnInit(): void {
    this.loadClubsAndGames();
    
    // Listen for storage events to refresh data when clubs are updated
    window.addEventListener('storage', (event) => {
      if (event.key === 'admin-data-updated') {
        this.loadClubsAndGames();
      }
    });
  }

  setFilter(filter: 'all' | 'linked' | 'unlinked'): void {
    this.currentFilter = filter;
    this.applyFilter();
  }

  onClubFilterChange(): void {
    this.applyFilter();
  }


  onSortChange(): void {
    this.applyFilter();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilter();
  }

  clearFilters(): void {
    this.selectedClub = 'all';
    this.sortBy = 'date';
    this.sortOrder = 'asc';
    this.applyFilter();
  }

  get sortedClubs(): any[] {
    return [...this.clubs].sort((a, b) => a.name.localeCompare(b.name));
  }

  applyFilter(): void {
    
    let filtered = [...this.games];
    
    // Apply status filter (linked/unlinked/all)
    if (this.currentFilter === 'unlinked') {
      filtered = filtered.filter(g => !this.isGameLinked(g) && !this.isForfeit(g.status));
    } else if (this.currentFilter === 'linked') {
      filtered = filtered.filter(g => this.isGameLinked(g) || this.isForfeit(g.status));
    }
    
    // Apply club filter
    if (this.selectedClub !== 'all') {
      filtered = filtered.filter(g => 
        g.homeTeam === this.selectedClub || g.awayTeam === this.selectedClub
      );
    }
    
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'homeTeam':
          aValue = a.homeTeam.toLowerCase();
          bValue = b.homeTeam.toLowerCase();
          break;
        case 'awayTeam':
          aValue = a.awayTeam.toLowerCase();
          bValue = b.awayTeam.toLowerCase();
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }
      
      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    this.filteredGames = filtered;
  }

  calculateUnlinkedCount(): void {
    this.unlinkedGamesCount = this.games.filter(g => !this.isGameLinked(g) && !this.isForfeit(g.status)).length;
  }

  private isGameLinked(game: any): boolean {
    // A game is considered "linked" if it has:
    // 1. An EASHL match ID, OR
    // 2. Manual stats entered (eashlData with manualEntry flag)
    const hasEashlMatchId = !!game.eashlMatchId;
    const hasManualStats = !!(game.eashlData && game.eashlData.manualEntry);
    const isLinked = hasEashlMatchId || hasManualStats;
    
    
    return isLinked;
  }

  loadClubsAndGames(): void {
    this.api.getClubs().subscribe({
      next: (clubs) => {
        this.clubs = clubs || [];
        this.api.getGames().subscribe({
          next: (games) => {
            this.games = (games || []).map(game => {
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
          },
          error: (error) => {
            console.error('Error loading games:', error);
            this.games = [];
            this.applyFilter();
            this.calculateUnlinkedCount();
          }
        });
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
        this.clubs = [];
      }
    });
  }

  loadEashlGames(game: any) {
    game.eashlGames = [];

    const homeId = game.homeClubId?._id || game.homeClubId;
    const awayId = game.awayClubId?._id || game.awayClubId;

    const homeClub = this.clubs.find(c => c._id === homeId);
    const awayClub = this.clubs.find(c => c._id === awayId);

    if (!homeClub?.eashlClubId || !awayClub?.eashlClubId) {
      console.error('One or both clubs missing EASHL Club ID. Home ID:', homeClub?.eashlClubId, 'Away ID:', awayClub?.eashlClubId);
      return;
    }

    const homeGames$ = this.eashlService.getClubMatches(homeClub.eashlClubId).pipe(
      catchError(err => {
        console.error(`Failed to load games for ${homeClub.name} (EASHL ID: ${homeClub.eashlClubId})`, err);
        if (err.status === 404) {
          console.error(`EASHL Club ID ${homeClub.eashlClubId} not found. Please verify the EASHL Club ID is correct.`);
        }
        return of([]);
      })
    );
    const awayGames$ = this.eashlService.getClubMatches(awayClub.eashlClubId).pipe(
      catchError(err => {
        console.error(`Failed to load games for ${awayClub.name} (EASHL ID: ${awayClub.eashlClubId})`, err);
        if (err.status === 404) {
          console.error(`EASHL Club ID ${awayClub.eashlClubId} not found. Please verify the EASHL Club ID is correct.`);
        }
        return of([]);
      })
    );

    forkJoin([homeGames$, awayGames$]).pipe(
      map(([homeResponse, awayResponse]) => {
        // Extract the arrays from the response objects
        const homeGames = homeResponse?.homeGames || [];
        const awayGames = awayResponse?.awayGames || [];
        
        const allGames = [...homeGames, ...awayGames];
        const uniqueGames = Array.from(new Map(allGames.map(item => [item.matchId, item])).values());
        return uniqueGames.map(match => {
          const clubDetails = match.clubs[homeClub.eashlClubId];
          const opponentDetails = clubDetails ? match.clubs[clubDetails.opponentClubId] : null;
          const opponentName = opponentDetails?.details?.name || 'Unknown';
          const score = clubDetails ? `${clubDetails.score} - ${clubDetails.opponentScore}` : 'N/A';
          const timeAgo = match.timeAgo?.number + ' ' + match.timeAgo?.unit + ' ago' || 'Unknown time';
          
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
      game.eashlGames = formattedGames;
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
    // If we have the actual game score, show it instead of the match ID
    if (game.score && typeof game.score.home !== 'undefined' && typeof game.score.away !== 'undefined') {
      const homeScore = game.score.home;
      const awayScore = game.score.away;
      const overtimeIndicator = game.isOvertime ? ' (OT)' : '';
      const result = `${game.homeTeam} ${homeScore} - ${awayScore} ${game.awayTeam}${overtimeIndicator}`;
      return result;
    }
    
    // Also check for direct score fields
    if (typeof game.homeTeamScore !== 'undefined' && typeof game.awayTeamScore !== 'undefined') {
      const homeScore = game.homeTeamScore;
      const awayScore = game.awayTeamScore;
      const overtimeIndicator = game.isOvertime ? ' (OT)' : '';
      const result = `${game.homeTeam} ${homeScore} - ${awayScore} ${game.awayTeam}${overtimeIndicator}`;
      return result;
    }
    
    // Fallback to the original method if score isn't available yet
    const linkedFile = game.eashlGames?.find((f: any) => f.matchId === game.eashlMatchId);
    if (linkedFile) {
      return linkedFile.label;
    }
    
    // Last fallback - just show the ID
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
    // Show merge modal to select which game to merge with
    this.showMergeModal(game);
  }

  showMergeModal(primaryGame: any) {
    // Load EASHL games for this team matchup (same as the dropdown)
    this.loadEashlGamesForMerge(primaryGame);
  }

  loadEashlGamesForMerge(primaryGame: any) {
    
    const homeId = primaryGame.homeClubId?._id || primaryGame.homeClubId;
    const awayId = primaryGame.awayClubId?._id || primaryGame.awayClubId;

    const homeClub = this.clubs.find(c => c._id === homeId);
    const awayClub = this.clubs.find(c => c._id === awayId);
    
    
    if (!homeClub?.eashlClubId || !awayClub?.eashlClubId) {
      alert('One or both clubs missing EASHL Club ID. Cannot load games for merging.');
      return;
    }


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
        // Extract the arrays from the response objects
        const homeGames = homeResponse?.homeGames || [];
        const awayGames = awayResponse?.awayGames || [];
        
        const allGames = [...homeGames, ...awayGames];
        const uniqueGames = Array.from(new Map(allGames.map(item => [item.matchId, item])).values());
        
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
    
    // Create HTML for the EASHL game selection modal
    const modalHtml = `
      <div style="background: white; padding: 20px; border-radius: 8px; max-width: 800px; margin: 20px auto;">
        <h3 style="margin-top: 0; color: #333;">Select EASHL Games to Merge</h3>
        <p style="color: #666; margin-bottom: 20px;">Choose 2 or more EASHL games to merge into one complete game record:</p>
        
        <div style="margin-bottom: 20px; max-height: 400px; overflow-y: auto;">
          ${eashlGames.map((game, i) => `
            <label style="display: block; margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; transition: background-color 0.2s;" 
                   onmouseover="this.style.backgroundColor='#f8f9fa'" 
                   onmouseout="this.style.backgroundColor='white'">
              <input type="checkbox" name="mergeGame" value="${game.matchId}" style="margin-right: 10px; transform: scale(1.2);">
              <div style="font-weight: bold; margin-bottom: 5px;">${this.formatEashlGameLabel(game, primaryGame)}</div>
              <div style="font-size: 12px; color: #666; margin-left: 20px;">
                Match ID: ${game.matchId} | Time: ${game.timeAgo.number} ${game.timeAgo.unit} ago
              </div>
            </label>
          `).join('')}
        </div>
        
        <!-- Overtime Selection -->
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
          <label style="display: flex; align-items: center; cursor: pointer; font-weight: 500; color: #333;">
            <input type="checkbox" id="mergeOvertime" style="margin-right: 10px; transform: scale(1.2);">
            <span>⚡ This was an Overtime Game</span>
          </label>
          <div style="font-size: 12px; color: #666; margin-left: 26px; margin-top: 5px;">
            Check this if the merged game went to overtime
          </div>
        </div>
        
        <div style="text-align: right;">
          <button onclick="window.mergeCancel()" style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer;">Cancel</button>
          <button onclick="window.mergeEashlGames()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer;">Merge Selected Games</button>
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
      
      if (selectedGameIds.length < 2) {
        alert('Please select at least 2 EASHL games to merge.');
        return;
      }
      
      // Get overtime selection
      const overtimeCheckbox = document.getElementById('mergeOvertime') as HTMLInputElement;
      const isOvertime = overtimeCheckbox ? overtimeCheckbox.checked : false;
      
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
      
      if (selectedGames.length < 2) {
        alert('Error: Please select at least 2 EASHL games to merge.');
        return;
      }
      
      if (selectedGames.length !== selectedGameIds.length) {
        alert('Error: Could not process all selected EASHL games. Please try again.');
        return;
      }
      
      document.body.removeChild(modalContainer);
      delete (window as any).mergeCancel;
      delete (window as any).mergeEashlGames;
      
      this.confirmEashlMerge(primaryGame, selectedGames, isOvertime);
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
                skshots: 0, // shots
                skbs: 0, // blocked shots (alternative field name)
                skppg: 0, // power play goals
                skshg: 0, // short handed goals
                skgwg: 0, // game winning goals
                skfow: 0, // faceoffs won
                skfol: 0, // faceoffs lost
                skpassattempts: 0,
                skpasses: 0,
                skinterceptions: 0,
                glsaves: 0,
                glshots: 0,
                glga: 0,
                glso: 0
              };
            }
            
            // Add stats from this game to the combined total
            const combinedPlayer = combinedPlayers[clubId][playerId];
            
            // Skater stats - use !== undefined to allow 0 values to be added
            if (player.skgoals !== undefined) combinedPlayer.skgoals += parseInt(player.skgoals) || 0;
            if (player.skassists !== undefined) combinedPlayer.skassists += parseInt(player.skassists) || 0;
            if (player.skplusmin !== undefined) combinedPlayer.skplusmin += parseInt(player.skplusmin) || 0;
            if (player.sktoi !== undefined) combinedPlayer.sktoi += parseInt(player.sktoi) || 0;
            if (player.skhits !== undefined) combinedPlayer.skhits += parseInt(player.skhits) || 0;
            if (player.skblk !== undefined) combinedPlayer.skblk += parseInt(player.skblk) || 0;
            if (player.skgiveaways !== undefined) combinedPlayer.skgiveaways += parseInt(player.skgiveaways) || 0;
            if (player.sktakeaways !== undefined) combinedPlayer.sktakeaways += parseInt(player.sktakeaways) || 0;
            if (player.skpim !== undefined) combinedPlayer.skpim += parseInt(player.skpim) || 0;
            if (player.skshots !== undefined) combinedPlayer.skshots += parseInt(player.skshots) || 0;
            if (player.skbs !== undefined) combinedPlayer.skbs += parseInt(player.skbs) || 0;
            if (player.skppg !== undefined) combinedPlayer.skppg += parseInt(player.skppg) || 0;
            if (player.skshg !== undefined) combinedPlayer.skshg += parseInt(player.skshg) || 0;
            if (player.skgwg !== undefined) combinedPlayer.skgwg += parseInt(player.skgwg) || 0;
            if (player.skfow !== undefined) combinedPlayer.skfow += parseInt(player.skfow) || 0;
            if (player.skfol !== undefined) combinedPlayer.skfol += parseInt(player.skfol) || 0;
            if (player.skpassattempts !== undefined) combinedPlayer.skpassattempts += parseInt(player.skpassattempts) || 0;
            if (player.skpasses !== undefined) combinedPlayer.skpasses += parseInt(player.skpasses) || 0;
            if (player.skinterceptions !== undefined) combinedPlayer.skinterceptions += parseInt(player.skinterceptions) || 0;
            
            // Goalie stats - CRITICAL FIX: use !== undefined to allow 0 values to be added
            // Previously, if glsaves was 0, it wouldn't be added, causing goalie stats to show as 0
            if (player.glsaves !== undefined) combinedPlayer.glsaves += parseInt(player.glsaves) || 0;
            if (player.glshots !== undefined) combinedPlayer.glshots += parseInt(player.glshots) || 0;
            if (player.glga !== undefined) combinedPlayer.glga += parseInt(player.glga) || 0;
            if (player.glso !== undefined) combinedPlayer.glso += parseInt(player.glso) || 0;
          });
        });
      }
    });
    
    return combinedPlayers;
  }

  combineMultiplePlayerStats(games: any[], homeClubEashlId: string): any {
    // Combine player statistics from multiple EASHL games
    const combinedPlayers: any = {};
    
    // Process all games
    games.forEach((game, gameIndex) => {
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
                skshots: 0, // shots
                skbs: 0, // blocked shots (alternative field name)
                skppg: 0, // power play goals
                skshg: 0, // short handed goals
                skgwg: 0, // game winning goals
                skfow: 0, // faceoffs won
                skfol: 0, // faceoffs lost
                skpassattempts: 0,
                skpasses: 0,
                skinterceptions: 0,
                glsaves: 0,
                glshots: 0,
                glga: 0,
                glso: 0
              };
            }
            
            // Add stats from this game to the combined total
            const combinedPlayer = combinedPlayers[clubId][playerId];
            
            // Skater stats - use !== undefined to allow 0 values to be added
            if (player.skgoals !== undefined) combinedPlayer.skgoals += parseInt(player.skgoals) || 0;
            if (player.skassists !== undefined) combinedPlayer.skassists += parseInt(player.skassists) || 0;
            if (player.skplusmin !== undefined) combinedPlayer.skplusmin += parseInt(player.skplusmin) || 0;
            if (player.sktoi !== undefined) combinedPlayer.sktoi += parseInt(player.sktoi) || 0;
            if (player.skhits !== undefined) combinedPlayer.skhits += parseInt(player.skhits) || 0;
            if (player.skblk !== undefined) combinedPlayer.skblk += parseInt(player.skblk) || 0;
            if (player.skgiveaways !== undefined) combinedPlayer.skgiveaways += parseInt(player.skgiveaways) || 0;
            if (player.sktakeaways !== undefined) combinedPlayer.sktakeaways += parseInt(player.sktakeaways) || 0;
            if (player.skpim !== undefined) combinedPlayer.skpim += parseInt(player.skpim) || 0;
            if (player.skshots !== undefined) combinedPlayer.skshots += parseInt(player.skshots) || 0;
            if (player.skbs !== undefined) combinedPlayer.skbs += parseInt(player.skbs) || 0;
            if (player.skppg !== undefined) combinedPlayer.skppg += parseInt(player.skppg) || 0;
            if (player.skshg !== undefined) combinedPlayer.skshg += parseInt(player.skshg) || 0;
            if (player.skgwg !== undefined) combinedPlayer.skgwg += parseInt(player.skgwg) || 0;
            if (player.skfow !== undefined) combinedPlayer.skfow += parseInt(player.skfow) || 0;
            if (player.skfol !== undefined) combinedPlayer.skfol += parseInt(player.skfol) || 0;
            if (player.skpassattempts !== undefined) combinedPlayer.skpassattempts += parseInt(player.skpassattempts) || 0;
            if (player.skpasses !== undefined) combinedPlayer.skpasses += parseInt(player.skpasses) || 0;
            if (player.skinterceptions !== undefined) combinedPlayer.skinterceptions += parseInt(player.skinterceptions) || 0;
            
            // Goalie stats - CRITICAL FIX: use !== undefined to allow 0 values to be added
            // Previously, if glsaves was 0, it wouldn't be added, causing goalie stats to show as 0
            if (player.glsaves !== undefined) combinedPlayer.glsaves += parseInt(player.glsaves) || 0;
            if (player.glshots !== undefined) combinedPlayer.glshots += parseInt(player.glshots) || 0;
            if (player.glga !== undefined) combinedPlayer.glga += parseInt(player.glga) || 0;
            if (player.glso !== undefined) combinedPlayer.glso += parseInt(player.glso) || 0;
          });
        });
      }
    });
    
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
        const opponentName = opponentDetails?.details?.name || 'Unknown';
        const score = clubDetails ? `${clubDetails.score} - ${clubDetails.opponentScore}` : 'N/A';
        const timeAgo = eashlGame.timeAgo?.number + ' ' + eashlGame.timeAgo?.unit + ' ago' || 'Unknown time';
        
        // Get goal scorers for better identification
        const goalScorers = this.getGoalScorers(eashlGame, homeClub.eashlClubId, clubDetails.opponentClubId);
        const goalScorerText = goalScorers ? ` | Goals: ${goalScorers}` : '';
        
        return `${homeClub.name} vs ${opponentName} (${score})${goalScorerText} - ${timeAgo}`;
      }
    }
    
    return `Game ${eashlGame.matchId} - ${eashlGame.timeAgo.number} ${eashlGame.timeAgo.unit} ago`;
  }

  getGoalScorers(eashlGame: any, homeClubId: string, awayClubId: string): string {
    if (!eashlGame.players) return '';
    
    const homeGoalScorers: string[] = [];
    const awayGoalScorers: string[] = [];
    
    // Process home team goal scorers
    if (eashlGame.players[homeClubId]) {
      Object.values(eashlGame.players[homeClubId]).forEach((player: any) => {
        if (player.skgoals && player.skgoals > 0) {
          const name = player.playername || player.name || 'Unknown';
          homeGoalScorers.push(`${name}(${player.skgoals})`);
        }
      });
    }
    
    // Process away team goal scorers
    if (eashlGame.players[awayClubId]) {
      Object.values(eashlGame.players[awayClubId]).forEach((player: any) => {
        if (player.skgoals && player.skgoals > 0) {
          const name = player.playername || player.name || 'Unknown';
          awayGoalScorers.push(`${name}(${player.skgoals})`);
        }
      });
    }
    
    const homeGoals = homeGoalScorers.length > 0 ? homeGoalScorers.join(', ') : 'No goals';
    const awayGoals = awayGoalScorers.length > 0 ? awayGoalScorers.join(', ') : 'No goals';
    
    return `Home: ${homeGoals} | Away: ${awayGoals}`;
  }

  confirmEashlMerge(primaryGame: any, selectedEashlGames: any[], isOvertime: boolean = false) {
    const gameList = selectedEashlGames.map((game, index) => 
      `EASHL Game ${index + 1}: ${this.formatEashlGameLabel(game, primaryGame)}`
    ).join('\n');
    
    const overtimeText = isOvertime ? '\n⚡ This will be marked as an Overtime Game' : '';
    
    const confirmMessage = `Are you sure you want to merge these EASHL games?\n\n` +
      `Primary Game: ${primaryGame.homeTeam} vs ${primaryGame.awayTeam}\n` +
      `${gameList}\n\n` +
      `This will create one complete game record with merged EASHL data from ${selectedEashlGames.length} games.${overtimeText}`;

    if (confirm(confirmMessage)) {
      this.performEashlMerge(primaryGame._id, selectedEashlGames, isOvertime);
    }
  }

  performEashlMerge(primaryGameId: string, selectedEashlGames: any[], isOvertime: boolean = false) {
    // Actually merge the EASHL data from multiple games
    if (selectedEashlGames.length < 2) {
      alert('Please select at least 2 EASHL games to merge.');
      return;
    }
    
    // First, extract and combine the scores from the selected EASHL games
    // Calculate scores by summing player goals instead of trusting EA's game-level scores
    // This is more accurate because EA sometimes shows default scores (like 3-0) for incomplete games
    let combinedScore = { home: 0, away: 0 };
    
    // Get the home club EASHL ID to identify which team is which
    const homeClub = this.games.find(g => g._id === primaryGameId)?.homeClubId;
    const homeClubEashlId = homeClub?.eashlClubId;
    
    if (homeClubEashlId) {
      
      // Calculate scores for each game by summing player goals
      selectedEashlGames.forEach((game, index) => {
        const gameHomeGoals = this.calculateTeamGoals(game, homeClubEashlId, true);
        const gameAwayGoals = this.calculateTeamGoals(game, homeClubEashlId, false);
        
        combinedScore.home += gameHomeGoals;
        combinedScore.away += gameAwayGoals;
        
      });
      
    } else {
      console.error('Could not find home club EASHL ID');
    }
    
    // Combine player statistics from all selected games
    const combinedPlayerStats = this.combineMultiplePlayerStats(selectedEashlGames, homeClubEashlId);
    
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
      eashlMatchId: selectedEashlGames.map(game => game.matchId).join('+'), // Use a special format to indicate merged games
      status: 'completed', // Mark as completed since we have the final scores
      score: combinedScore,
      homeTeamScore: combinedScore.home,
      awayTeamScore: combinedScore.away,
      isOvertime: isOvertime, // Include the overtime flag
      eashlData: combinedEashlData // Include the combined player statistics
    };
    
    this.api.bulkUpdateGames([updatePayload]).subscribe({
      next: (updatedGames) => {
        const mergedMatchIds = selectedEashlGames.map(game => game.matchId).join(' + ');
        alert(`EASHL games merged successfully!\n\nGame ${primaryGameId} now linked to merged EASHL matches: ${mergedMatchIds}`);
        
        // Update the local game data immediately
        const gameIndex = this.games.findIndex(g => g._id === primaryGameId);
        if (gameIndex !== -1) {
          const updatedGame = {
            ...this.games[gameIndex],
            eashlMatchId: mergedMatchIds,
            status: 'pending_stats',
            isOvertime: isOvertime
          };
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
            isOvertime: isOvertime, // Include the overtime flag
            eashlData: combinedEashlData // Include the combined player statistics locally
          };
          
        }
        
        // Force a complete data refresh to ensure everything is in sync
        setTimeout(() => {
          this.loadClubsAndGames();
          
          // Also reload the NgRx store and trigger storage event
          this.store.dispatch(MatchesActions.loadMatches());
          const timestamp = Date.now().toString();
          localStorage.setItem('admin-data-updated', timestamp);
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
    this.api.mergeGames(primaryGameId, [secondaryGameId]).subscribe({
      next: (result) => {
        alert(`Games merged successfully!\n\nMerged game ID: ${result.mergedGame._id}\nDeleted game ID: ${result.deletedGameId}`);
        
        
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
          
          this.games[primaryGameIndex] = updatedGame;
        }
        
        // Refresh the display and recalculate counts
        this.applyFilter();
        this.calculateUnlinkedCount();
        
        // Force a complete data refresh to ensure everything is in sync
        setTimeout(() => {
          this.loadClubsAndGames();
          // Also reload the NgRx store so standings component gets updated
          this.store.dispatch(MatchesActions.loadMatches());
          // Trigger storage event to notify standings component
          localStorage.setItem('admin-data-updated', Date.now().toString());
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
            
            // Also reload the NgRx store and trigger storage event
            this.store.dispatch(MatchesActions.loadMatches());
            
            // If this was a playoff game, reload playoff brackets to update series records
            if (game.isPlayoff && game.playoffBracketId) {
              console.log('Unlinked playoff game stats, reloading playoff brackets...');
              this.store.dispatch(PlayoffsActions.loadPlayoffBrackets({}));
            }
            
            const timestamp = Date.now().toString();
            localStorage.setItem('admin-data-updated', timestamp);
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
          // Also reload the NgRx store so standings component gets updated
          this.store.dispatch(MatchesActions.loadMatches());
          // Trigger storage event to notify standings component
          localStorage.setItem('admin-data-updated', Date.now().toString());
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
              this.loadClubsAndGames(); // Reload all data
              // Also reload the NgRx store so standings component gets updated
              this.store.dispatch(MatchesActions.loadMatches());
              // Trigger storage event to notify standings component
              const timestamp = Date.now().toString();
              localStorage.setItem('admin-data-updated', timestamp);
            })
            .catch(err => {
              console.error('Error fetching some EASHL data after bulk update:', err);
              this.loadClubsAndGames(); // Still reload
              // Also reload the NgRx store so standings component gets updated
              this.store.dispatch(MatchesActions.loadMatches());
              // Trigger storage event to notify standings component
              const timestamp = Date.now().toString();
              localStorage.setItem('admin-data-updated', timestamp);
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

  // Helper method to get the full image URL using the centralized service
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  // Handle image loading errors
  onImageError(event: any): void {
    // Prevent infinite error loops - if we're already showing the default image, don't change it
    if (event.target.src.includes('square-default.png')) {
      return;
    }
    
    // Set the fallback image - use a path that will be treated as a local asset
    event.target.src = '/assets/images/square-default.png';
  }
}
