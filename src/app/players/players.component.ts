import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { PositionPillComponent } from '../components/position-pill/position-pill.component';

// Import selectors
import * as PlayersSelectors from '../store/players.selectors';
import { Player } from '../store/players.actions';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PositionPillComponent],
  templateUrl: './players.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observable selectors
  players$: Observable<Player[]>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  
  // Local state for filtering
  filteredPlayers: Player[] = [];
  searchText: string = '';
  positionFilter: string = 'All';
  platformFilter: string = 'All';
  
  // Position options
  positions = ['All', 'C', 'LW', 'RW', 'LD', 'RD', 'G'];
  
  // Platform options
  platforms = ['All', 'PS5', 'Xbox'];

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize selectors
    this.players$ = this.store.select(PlayersSelectors.selectAllAdminPlayers);
    this.loading$ = this.store.select(PlayersSelectors.selectAllAdminPlayersLoading);
    this.error$ = this.store.select(PlayersSelectors.selectAllAdminPlayersError);
  }

  ngOnInit() {
    // Load players using NgRx
    this.ngrxApiService.loadAllPlayers();
    
    // Subscribe to players changes for filtering
    this.players$.pipe(takeUntil(this.destroy$)).subscribe(players => {
      this.sortAndFilterPlayers(players);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlayers() {
    this.ngrxApiService.loadAllPlayers();
  }

  sortAndFilterPlayers(players: Player[]) {
    // Sort players alphabetically by gamertag
    const sortedPlayers = [...players].sort((a, b) => 
      a.gamertag.toLowerCase().localeCompare(b.gamertag.toLowerCase())
    );
    
    // Apply filters
    let filtered = sortedPlayers;
    
    // Search filter
    if (this.searchText) {
      const searchTerm = this.searchText.toLowerCase();
      filtered = filtered.filter(player => 
        player.gamertag.toLowerCase().includes(searchTerm) ||
        (player.discordUsername && player.discordUsername.toLowerCase().includes(searchTerm))
      );
    }
    
    // Position filter
    if (this.positionFilter !== 'All') {
      filtered = filtered.filter(player => {
        const playerPosition = player.position || player.playerProfile?.position || '';
        return playerPosition === this.positionFilter;
      });
    }
    
    // Platform filter
    if (this.platformFilter !== 'All') {
      filtered = filtered.filter(player => 
        player.platform === this.platformFilter
      );
    }
    
    this.filteredPlayers = filtered;
  }

  filterPlayers() {
    // Get current players from store and apply filter
    this.players$.pipe(takeUntil(this.destroy$)).subscribe(players => {
      this.sortAndFilterPlayers(players);
      this.cdr.markForCheck();
    });
  }

  onPositionFilterChange(position: string) {
    this.positionFilter = position;
    this.filterPlayers();
  }

  onPlatformFilterChange(platform: string) {
    this.platformFilter = platform;
    this.filterPlayers();
  }

  getPlayerRoute(player: Player): string[] {
    // Use the player's _id to navigate to their profile
    // The player profile component expects an ID parameter
    return ['/players', player._id];
  }

  getPositionDisplay(position: string | undefined): string {
    if (!position) return 'N/A';
    return position;
  }

  getPlatformDisplay(platform: string | undefined): string {
    if (!platform) return 'N/A';
    return platform;
  }

  getStatusClasses(status: string | undefined): { [key: string]: boolean } {
    const statusValue = status || '';
    return {
      'bg-green-500/20': statusValue === 'Signed',
      'text-green-400': statusValue === 'Signed',
      'bg-yellow-500/20': statusValue === 'Free Agent',
      'text-yellow-400': statusValue === 'Free Agent',
      'bg-blue-500/20': statusValue === 'Pending',
      'text-blue-400': statusValue === 'Pending'
    };
  }
}

