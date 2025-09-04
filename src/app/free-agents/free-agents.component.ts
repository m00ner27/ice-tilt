import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { Player } from '../store/models/models/player.interface';

// Import selectors
import * as UsersSelectors from '../store/users.selectors';

@Component({
  selector: 'app-free-agents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './free-agents.component.html',
  styleUrls: ['./free-agents.component.css']
})
export class FreeAgentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observable selectors
  freeAgents$: Observable<any[]>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  
  // Local state for filtering
  filteredAgents: Player[] = [];
  positionFilter: string = 'All';
  searchTerm: string = '';

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService
  ) {
    // Initialize selectors
    this.freeAgents$ = this.store.select(UsersSelectors.selectFreeAgents);
    this.loading$ = this.store.select(UsersSelectors.selectUsersLoading);
    this.error$ = this.store.select(UsersSelectors.selectUsersError);
  }

  ngOnInit() {
    // Load free agents using NgRx
    this.ngrxApiService.loadFreeAgents();
    
    // Subscribe to free agents changes for filtering
    this.freeAgents$.pipe(takeUntil(this.destroy$)).subscribe(agents => {
      this.mapAndFilterAgents(agents);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFreeAgents() {
    this.ngrxApiService.loadFreeAgents();
  }

  mapAndFilterAgents(agents: any[]) {
    // Map backend structure to Player interface
    const mappedAgents: Player[] = agents.map((agent: any) => {
      const profile = agent.playerProfile || {};
      return {
        id: agent._id,
        discordUsername: agent.discordUsername,
        position: profile.position || 'C',
        status: profile.status || 'Free Agent',
        number: profile.number || '',
        psnId: agent.platform === 'PS5' ? agent.gamertag : '',
        xboxGamertag: agent.platform === 'Xbox' ? agent.gamertag : '',
        gamertag: agent.gamertag || '',
        stats: agent.stats || {},
        handedness: profile.handedness || 'Left',
        country: profile.country || '',
        currentClubId: agent.currentClubId || '',
        currentClubName: agent.currentClubName || '',
        secondaryPositions: profile.secondaryPositions || [],
      };
    });
    
    this.applyFilters(mappedAgents);
  }

  applyFilters(agents: Player[]) {
    this.filteredAgents = agents.filter(player => {
      const matchesPosition = this.positionFilter === 'All' || player.position === this.positionFilter;
      const matchesSearch = (player.discordUsername?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                          (player.psnId?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                          (player.xboxGamertag?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false);
      
      return matchesPosition && matchesSearch;
    });
  }

  onPositionFilterChange(position: string) {
    this.positionFilter = position;
    this.freeAgents$.pipe(takeUntil(this.destroy$)).subscribe(agents => {
      this.mapAndFilterAgents(agents);
    });
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.freeAgents$.pipe(takeUntil(this.destroy$)).subscribe(agents => {
      this.mapAndFilterAgents(agents);
    });
  }

  refreshData() {
    this.loadFreeAgents();
  }
}