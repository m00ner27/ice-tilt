import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { selectPlayersState } from '../../store/players.selectors';
import { loadFreeAgents, createPlayer, deletePlayer } from '../../store/players.actions';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../store/services/api.service';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './players.component.html'
})
export class PlayersComponent implements OnInit, OnDestroy {
  players: any[] = [];
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private apiService: ApiService
  ) {
    // Listen to players state changes
    this.store.select(selectPlayersState)
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.players = state.freeAgents || [];
        this.loading = state.adminLoading || false;
        this.error = state.adminError || null;
      });
  }

  ngOnInit() {
    this.loadPlayers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlayers() {
    this.store.dispatch(loadFreeAgents());
  }

  deletePlayer(playerId: string) {
    if (confirm('Are you sure you want to delete this player?')) {
      console.log('Delete player:', playerId);
      this.store.dispatch(deletePlayer({ playerId }));
    }
  }
}
