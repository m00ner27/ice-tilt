import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { selectPlayersState } from '../../store/players.selectors';
import { loadFreeAgents, createPlayer, deletePlayer } from '../../store/players.actions';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ApiService } from '../../store/services/api.service';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './players.component.html'
})
export class PlayersComponent implements OnInit, OnDestroy {
  players: any[] = [];
  clubs: any[] = [];
  seasons: any[] = [];
  selectedSeasonId: string | null = null;
  loading = false;
  error: string | null = null;
  sortBy: 'name' | 'season' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  playerClubMap: { [playerId: string]: string } = {}; // Map player ID to club name
  
  // Search and pagination properties
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 12; // Show 12 players per page (4 rows of 3)
  
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loadPlayers();
    this.loadClubs();
    this.loadSeasons();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlayers() {
    this.loading = true;
    this.apiService.getAllPlayers().subscribe({
      next: (players) => {
        console.log('Loaded players:', players.length);
        console.log('Sample player structure:', players[0]);
        this.players = players;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading players:', error);
        this.error = 'Failed to load players';
        this.loading = false;
      }
    });
  }

  loadClubs() {
    this.apiService.getClubs().subscribe({
      next: (clubs) => {
        const clubsArray = clubs || [];
        console.log('Loaded clubs:', clubsArray.length);
        if (clubsArray.length > 0) {
          console.log('Sample club structure:', clubsArray[0]);
          console.log('Sample club seasons:', clubsArray[0].seasons);
          if (clubsArray[0].seasons && clubsArray[0].seasons.length > 0) {
            console.log('First season structure:', clubsArray[0].seasons[0]);
            if (clubsArray[0].seasons[0].roster) {
              console.log('First season roster:', clubsArray[0].seasons[0].roster);
            }
          }
        }
        this.clubs = clubsArray;
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
        this.clubs = [];
      }
    });
  }

  loadSeasons() {
    this.apiService.getSeasons().subscribe({
      next: (seasons) => {
        this.seasons = seasons || [];
        // Auto-select the first season if available
        if (this.seasons.length > 0) {
          this.selectedSeasonId = this.seasons[0]._id;
          // Load club rosters after a short delay to ensure clubs are loaded
          setTimeout(() => {
            this.loadClubRosters();
          }, 1000);
        }
      },
      error: (error) => {
        console.error('Error loading seasons:', error);
        this.seasons = [];
      }
    });
  }

  getPlayerClubForSeason(player: any): string | null {
    if (!this.selectedSeasonId) {
      return null;
    }

    // Use the player club map to get the club name
    const clubName = this.playerClubMap[player._id];
    
    if (player.gamertag === 'm00ner38') {
      console.log('=== DEBUG: m00ner38 club search ===');
      console.log('Player ID:', player._id);
      console.log('Club name from map:', clubName);
      console.log('Player club map keys:', Object.keys(this.playerClubMap));
    }

    return clubName || null;
  }

  isPlayerFreeAgent(player: any): boolean {
    return !this.getPlayerClubForSeason(player);
  }

  getSortedPlayers(): any[] {
    // This method is now deprecated in favor of getFilteredPlayers()
    // Keeping it for backward compatibility but it now uses the new filtering logic
    return this.getFilteredPlayers();
  }

  setSortBy(sortBy: 'name' | 'season') {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
    this.currentPage = 1; // Reset to first page when sorting changes
  }

  onSeasonChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedSeasonId = target.value || null;
    this.currentPage = 1; // Reset to first page when season changes
    if (this.selectedSeasonId) {
      this.loadClubRosters();
    }
  }

  loadClubRosters() {
    if (!this.selectedSeasonId || this.clubs.length === 0) {
      return;
    }

    console.log('Loading club rosters for season:', this.selectedSeasonId);
    this.playerClubMap = {}; // Reset the map

    // Load roster for each club
    const rosterPromises = this.clubs.map(club => {
      if (club._id) {
        return this.apiService.getClubRoster(club._id, this.selectedSeasonId!).toPromise()
          .then(roster => {
            if (roster && Array.isArray(roster)) {
              roster.forEach(player => {
                if (player._id) {
                  this.playerClubMap[player._id] = club.name;
                }
              });
            }
          })
          .catch(error => {
            console.error(`Error loading roster for ${club.name}:`, error);
          });
      }
      return Promise.resolve();
    });

    Promise.all(rosterPromises).then(() => {
      console.log('Player club map loaded:', this.playerClubMap);
    });
  }

  deletePlayer(playerId: string) {
    if (confirm('Are you sure you want to delete this player?')) {
      console.log('Delete player:', playerId);
      this.store.dispatch(deletePlayer({ playerId }));
    }
  }

  // Search functionality
  onSearchChange() {
    this.currentPage = 1; // Reset to first page when searching
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1; // Reset to first page when clearing search
  }

  getFilteredPlayers(): any[] {
    let filtered = [...this.players];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(player => {
        const gamertag = (player.gamertag || '').toLowerCase();
        const psnId = (player.psnId || '').toLowerCase();
        const xboxGamertag = (player.xboxGamertag || '').toLowerCase();
        
        return gamertag.includes(searchLower) || 
               psnId.includes(searchLower) || 
               xboxGamertag.includes(searchLower);
      });
    }
    
    // Apply sorting
    if (this.sortBy === 'name') {
      filtered.sort((a, b) => {
        const nameA = a.gamertag || '';
        const nameB = b.gamertag || '';
        return this.sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    } else if (this.sortBy === 'season') {
      filtered.sort((a, b) => {
        const clubA = this.getPlayerClubForSeason(a) || '';
        const clubB = this.getPlayerClubForSeason(b) || '';
        
        return this.sortOrder === 'asc' 
          ? clubA.localeCompare(clubB)
          : clubB.localeCompare(clubA);
      });
    }
    
    return filtered;
  }

  // Pagination functionality
  getPaginatedPlayers(): any[] {
    const filtered = this.getFilteredPlayers();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.getFilteredPlayers().length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  getEndIndex(): number {
    const filtered = this.getFilteredPlayers();
    return Math.min(this.getStartIndex() + this.itemsPerPage, filtered.length);
  }
}
