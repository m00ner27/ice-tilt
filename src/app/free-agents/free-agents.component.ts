import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { FreeAgent } from '../state/free-agents/free-agents.model';
import * as FreeAgentsActions from '../state/free-agents/free-agents.actions';
import * as FreeAgentsSelectors from '../state/free-agents/free-agents.selectors';
import { FreeAgentsState } from '../state/free-agents/free-agents.reducer';

@Component({
  selector: 'app-free-agents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './free-agents.component.html',
  styleUrls: ['./free-agents.component.css']
})
export class FreeAgentsComponent implements OnInit {
  freeAgents$: Observable<FreeAgent[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  currentSeason = 'current';

  constructor(private store: Store<{ freeAgents: FreeAgentsState }>) {
    this.freeAgents$ = this.store.select(FreeAgentsSelectors.selectAvailableFreeAgents)
      .pipe(
        tap(agents => console.log('Free Agents:', agents))
      );
    this.loading$ = this.store.select(FreeAgentsSelectors.selectFreeAgentsLoading)
      .pipe(
        tap(loading => console.log('Loading:', loading))
      );
    this.error$ = this.store.select(FreeAgentsSelectors.selectFreeAgentsError)
      .pipe(
        tap(error => error && console.error('Error:', error))
      );
  }

  ngOnInit() {
    console.log('Dispatching loadFreeAgents action');
    this.store.dispatch(FreeAgentsActions.loadFreeAgents({ seasonId: this.currentSeason }));
  }

  onSignPlayer(playerId: string, teamId: string) {
    console.log('Signing player:', playerId, 'to team:', teamId);
    this.store.dispatch(FreeAgentsActions.signFreeAgent({ playerId, teamId }));
  }
}
