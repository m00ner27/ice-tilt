import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as MatchesActions from '../../store/matches.actions';
import { selectAllMatches, selectStatsLoading, selectStatsError } from '../../store/matches.selectors';

@Component({
  selector: 'app-manual-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './manual-stats.component.html'
})
export class ManualStatsComponent implements OnInit {
  games$!: Observable<any[]>;
  selectedGame: any = null;
  selectedGameData: any = null;
  statsForm: FormGroup;
  isSubmitting$!: Observable<boolean>;
  statsError$!: Observable<any>;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.statsForm = this.fb.group({
      gameId: ['', Validators.required],
      homeGoals: [0, [Validators.required, Validators.min(0)]],
      homeShots: [0, [Validators.required, Validators.min(0)]],
      homeHits: [0, [Validators.required, Validators.min(0)]],
      homePIM: [0, [Validators.required, Validators.min(0)]],
      homePPG: [0, [Validators.required, Validators.min(0)]],
      homePPO: [0, [Validators.required, Validators.min(0)]],
      homeFaceoffs: [0, [Validators.required, Validators.min(0)]],
      homeBlockedShots: [0, [Validators.required, Validators.min(0)]],
      awayGoals: [0, [Validators.required, Validators.min(0)]],
      awayShots: [0, [Validators.required, Validators.min(0)]],
      awayHits: [0, [Validators.required, Validators.min(0)]],
      awayPIM: [0, [Validators.required, Validators.min(0)]],
      awayPPG: [0, [Validators.required, Validators.min(0)]],
      awayPPO: [0, [Validators.required, Validators.min(0)]],
      awayFaceoffs: [0, [Validators.required, Validators.min(0)]],
      awayBlockedShots: [0, [Validators.required, Validators.min(0)]],
      status: ['scheduled', Validators.required],
      overtime: ['none', Validators.required]
    });
  }

  ngOnInit() {
    // Initialize observables
    this.games$ = this.store.select(selectAllMatches);
    this.isSubmitting$ = this.store.select(selectStatsLoading);
    this.statsError$ = this.store.select(selectStatsError);
    
    // Load games
    this.store.dispatch(MatchesActions.loadMatches());
  }

  onGameChange() {
    const gameId = this.statsForm.get('gameId')?.value;
    if (gameId) {
      // Subscribe to games to find the selected game
      this.games$.subscribe(games => {
        this.selectedGame = games.find(g => g._id === gameId);
        this.selectedGameData = this.selectedGame;
      });
    } else {
      this.selectedGame = null;
      this.selectedGameData = null;
    }
  }

  submitStats() {
    if (this.statsForm.valid && this.selectedGame) {
      const statsData = {
        gameId: this.selectedGame._id,
        ...this.statsForm.value
      };

      // Dispatch NgRx action to save manual game stats
      this.store.dispatch(MatchesActions.saveManualGameStats({ gameStats: statsData }));
      
      // Navigate back to schedule after successful submission
      // Note: In a real app, you'd listen to the success action in an effect
      setTimeout(() => {
        this.router.navigate(['/admin/schedule']);
      }, 1000);
    }
  }

  cancel() {
    this.router.navigate(['/admin/schedule']);
  }
}
