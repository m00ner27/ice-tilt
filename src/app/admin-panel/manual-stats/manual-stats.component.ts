import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
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
    private router: Router,
    private http: HttpClient
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

  // Player arrays for dynamic form management
  homeSkaters: any[] = [];
  awaySkaters: any[] = [];
  homeGoalies: any[] = [];
  awayGoalies: any[] = [];

  ngOnInit() {
    // Initialize observables
    this.games$ = this.store.select(selectAllMatches);
    this.isSubmitting$ = this.store.select(selectStatsLoading);
    this.statsError$ = this.store.select(selectStatsError);
    
    // Load games
    this.store.dispatch(MatchesActions.loadMatches());
    
    // Check if there's a game ID in the route parameters
    this.route.params.subscribe(params => {
      if (params['gameId']) {
        console.log('Loading game from route parameter:', params['gameId']);
        // Try to load the game directly from API first for most accurate data
        this.loadGameDirectly(params['gameId']);
      }
    });
  }

  loadGameDirectly(gameId: string) {
    console.log('Loading game directly from API:', gameId);
    
    // Fetch the game data directly from the API
    this.http.get(`${environment.apiUrl}/api/games/${gameId}`).subscribe({
      next: (game: any) => {
        console.log('Game loaded from API:', game);
        console.log('Game structure:', {
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeClubId: game.homeClubId,
          awayClubId: game.awayClubId,
          division: game.division,
          divisionId: game.divisionId
        });
        
        // Map the game data similar to how admin schedule does it
        const mappedGame = {
          ...game,
          homeTeam: game.homeTeam || (game.homeClubId ? { name: game.homeClubId.name || game.homeClubId } : { name: 'TBD' }),
          awayTeam: game.awayTeam || (game.awayClubId ? { name: game.awayClubId.name || game.awayClubId } : { name: 'TBD' }),
          division: game.division || (game.divisionId ? { name: game.divisionId.name || game.divisionId } : { name: 'N/A' })
        };
        
        console.log('Mapped game data:', mappedGame);
        
        this.selectedGame = mappedGame;
        this.selectedGameData = mappedGame;
        this.statsForm.patchValue({ gameId: gameId });
        this.initializePlayerArrays();
        console.log('Game loaded and player arrays initialized');
      },
      error: (error) => {
        console.error('Error loading game:', error);
        // Fallback to placeholder if API fails
        const placeholderGame = {
          _id: gameId,
          homeTeam: { name: 'Home Team' },
          awayTeam: { name: 'Away Team' },
          date: new Date(),
          division: { name: 'N/A' }
        };
        
        this.selectedGame = placeholderGame;
        this.selectedGameData = placeholderGame;
        this.statsForm.patchValue({ gameId: gameId });
        this.initializePlayerArrays();
        console.log('Placeholder game loaded as fallback');
      }
    });
  }

  onGameChange() {
    console.log('Game changed:', this.selectedGame);
    if (this.selectedGame) {
      this.selectedGameData = this.selectedGame;
      this.statsForm.patchValue({ gameId: this.selectedGame._id });
      // Initialize player arrays when game is selected
      this.initializePlayerArrays();
      console.log('Selected game data:', this.selectedGameData);
      console.log('Player arrays initialized:', {
        homeSkaters: this.homeSkaters.length,
        awaySkaters: this.awaySkaters.length,
        homeGoalies: this.homeGoalies.length,
        awayGoalies: this.awayGoalies.length
      });
    } else {
      this.selectedGameData = null;
      this.clearPlayerArrays();
    }
  }

  initializePlayerArrays() {
    // Initialize with empty player objects
    this.homeSkaters = [{ gamertag: '', position: 'C', goals: 0, assists: 0, shots: 0, hits: 0, takeaways: 0, giveaways: 0, plusMinus: 0, penaltyMinutes: 0, blockedShots: 0, faceoffsWon: 0, faceoffsLost: 0, passAttempts: 0, passesCompleted: 0, interceptions: 0, timeOnIceMinutes: 0, timeOnIceSeconds: 0 }];
    this.awaySkaters = [{ gamertag: '', position: 'C', goals: 0, assists: 0, shots: 0, hits: 0, takeaways: 0, giveaways: 0, plusMinus: 0, penaltyMinutes: 0, blockedShots: 0, faceoffsWon: 0, faceoffsLost: 0, passAttempts: 0, passesCompleted: 0, interceptions: 0, timeOnIceMinutes: 0, timeOnIceSeconds: 0 }];
    this.homeGoalies = [{ gamertag: '', position: 'G', saves: 0, shotsAgainst: 0, goalsAgainst: 0, shutoutPeriods: 0, timeOnIceMinutes: 0, timeOnIceSeconds: 0 }];
    this.awayGoalies = [{ gamertag: '', position: 'G', saves: 0, shotsAgainst: 0, goalsAgainst: 0, shutoutPeriods: 0, timeOnIceMinutes: 0, timeOnIceSeconds: 0 }];
  }

  clearPlayerArrays() {
    this.homeSkaters = [];
    this.awaySkaters = [];
    this.homeGoalies = [];
    this.awayGoalies = [];
  }

  addPlayer(team: 'home' | 'away', type: 'skater' | 'goalie') {
    if (type === 'skater') {
      const newPlayer = { gamertag: '', position: 'C', goals: 0, assists: 0, shots: 0, hits: 0, takeaways: 0, giveaways: 0, plusMinus: 0, penaltyMinutes: 0, blockedShots: 0, faceoffsWon: 0, faceoffsLost: 0, passAttempts: 0, passesCompleted: 0, interceptions: 0, timeOnIceMinutes: 0, timeOnIceSeconds: 0 };
      if (team === 'home') {
        this.homeSkaters.push(newPlayer);
      } else {
        this.awaySkaters.push(newPlayer);
      }
    } else {
      const newGoalie = { gamertag: '', position: 'G', saves: 0, shotsAgainst: 0, goalsAgainst: 0, shutoutPeriods: 0, timeOnIceMinutes: 0, timeOnIceSeconds: 0 };
      if (team === 'home') {
        this.homeGoalies.push(newGoalie);
      } else {
        this.awayGoalies.push(newGoalie);
      }
    }
  }

  removePlayer(team: 'home' | 'away', type: 'skater' | 'goalie', index: number) {
    if (type === 'skater') {
      if (team === 'home') {
        this.homeSkaters.splice(index, 1);
      } else {
        this.awaySkaters.splice(index, 1);
      }
    } else {
      if (team === 'home') {
        this.homeGoalies.splice(index, 1);
      } else {
        this.awayGoalies.splice(index, 1);
      }
    }
  }

  submitStats() {
    if (this.statsForm.valid && this.selectedGame) {
      const statsData = {
        gameId: this.selectedGame._id,
        manualStats: {
          homeSkaters: this.homeSkaters.filter(p => p.gamertag.trim() !== ''),
          awaySkaters: this.awaySkaters.filter(p => p.gamertag.trim() !== ''),
          homeGoalies: this.homeGoalies.filter(p => p.gamertag.trim() !== ''),
          awayGoalies: this.awayGoalies.filter(p => p.gamertag.trim() !== '')
        },
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
