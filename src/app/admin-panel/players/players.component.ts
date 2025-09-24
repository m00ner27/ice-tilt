import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { selectPlayersState } from '../../store/players.selectors';
import { loadFreeAgents, createPlayer, deletePlayer } from '../../store/players.actions';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ApiService } from '../../store/services/api.service';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule],
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
        console.log('Loaded clubs:', clubs.length);
        console.log('Sample club structure:', clubs[0]);
        console.log('Sample club seasons:', clubs[0].seasons);
        if (clubs[0].seasons && clubs[0].seasons.length > 0) {
          console.log('First season structure:', clubs[0].seasons[0]);
          if (clubs[0].seasons[0].roster) {
            console.log('First season roster:', clubs[0].seasons[0].roster);
          }
        }
        this.clubs = clubs;
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
      }
    });
  }

  loadSeasons() {
    this.apiService.getSeasons().subscribe({
      next: (seasons) => {
        this.seasons = seasons;
        // Auto-select the first season if available
        if (seasons.length > 0) {
          this.selectedSeasonId = seasons[0]._id;
          // Load club rosters after a short delay to ensure clubs are loaded
          setTimeout(() => {
            this.loadClubRosters();
          }, 1000);
        }
      },
      error: (error) => {
        console.error('Error loading seasons:', error);
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
    let sorted = [...this.players];
    
    if (this.sortBy === 'name') {
      sorted.sort((a, b) => {
        const nameA = a.gamertag || '';
        const nameB = b.gamertag || '';
        return this.sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    } else if (this.sortBy === 'season') {
      sorted.sort((a, b) => {
        const clubA = this.getPlayerClubForSeason(a) || '';
        const clubB = this.getPlayerClubForSeason(b) || '';
        
        return this.sortOrder === 'asc' 
          ? clubA.localeCompare(clubB)
          : clubB.localeCompare(clubA);
      });
    }
    
    return sorted;
  }

  setSortBy(sortBy: 'name' | 'season') {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
  }

  onSeasonChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedSeasonId = target.value || null;
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
}
