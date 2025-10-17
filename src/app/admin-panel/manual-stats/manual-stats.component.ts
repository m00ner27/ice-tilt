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
  templateUrl: './manual-stats.component.html',
  styleUrls: ['./manual-stats.component.css']
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
      status: ['scheduled', Validators.required],
      overtime: ['none', Validators.required]
    });
  }

  // Player arrays for dynamic form management - fixed to 6 skaters per team
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
    // Initialize with exactly 6 skaters per team and 1 goalie per team
    this.homeSkaters = Array(6).fill(null).map(() => ({
      gamertag: '', 
      position: 'C', 
      goals: 0, 
      assists: 0, 
      shots: 0, 
      hits: 0, 
      takeaways: 0, 
      giveaways: 0, 
      plusMinus: 0, 
      penaltyMinutes: 0, 
      blockedShots: 0, 
      faceoffsWon: 0, 
      faceoffsLost: 0, 
      passAttempts: 0, 
      passesCompleted: 0, 
      interceptions: 0, 
      timeOnIceMinutes: 0, 
      timeOnIceSeconds: 0
    }));
    
    this.awaySkaters = Array(6).fill(null).map(() => ({
      gamertag: '', 
      position: 'C', 
      goals: 0, 
      assists: 0, 
      shots: 0, 
      hits: 0, 
      takeaways: 0, 
      giveaways: 0, 
      plusMinus: 0, 
      penaltyMinutes: 0, 
      blockedShots: 0, 
      faceoffsWon: 0, 
      faceoffsLost: 0, 
      passAttempts: 0, 
      passesCompleted: 0, 
      interceptions: 0, 
      timeOnIceMinutes: 0, 
      timeOnIceSeconds: 0
    }));
    
    this.homeGoalies = [{
      gamertag: '', 
      position: 'G', 
      saves: 0, 
      shotsAgainst: 0, 
      goalsAgainst: 0, 
      shutoutPeriods: 0, 
      timeOnIceMinutes: 0, 
      timeOnIceSeconds: 0
    }];
    
    this.awayGoalies = [{
      gamertag: '', 
      position: 'G', 
      saves: 0, 
      shotsAgainst: 0, 
      goalsAgainst: 0, 
      shutoutPeriods: 0, 
      timeOnIceMinutes: 0, 
      timeOnIceSeconds: 0
    }];
  }

  clearPlayerArrays() {
    this.homeSkaters = [];
    this.awaySkaters = [];
    this.homeGoalies = [];
    this.awayGoalies = [];
  }

  // Calculate total goals for a team
  getTotalGoals(team: 'home' | 'away'): number {
    const skaters = team === 'home' ? this.homeSkaters : this.awaySkaters;
    return skaters.reduce((total, player) => total + (Number(player.goals) || 0), 0);
  }

  // Calculate winner based on total goals
  getWinner(): string {
    const homeGoals = this.getTotalGoals('home');
    const awayGoals = this.getTotalGoals('away');
    
    if (homeGoals > awayGoals) {
      return `${this.selectedGameData?.homeTeam?.name || 'Home Team'} Wins!`;
    } else if (awayGoals > homeGoals) {
      return `${this.selectedGameData?.awayTeam?.name || 'Away Team'} Wins!`;
    } else {
      return 'Tie Game';
    }
  }

  // Get winner CSS class for styling
  getWinnerClass(): string {
    const homeGoals = this.getTotalGoals('home');
    const awayGoals = this.getTotalGoals('away');
    
    if (homeGoals > awayGoals) {
      return 'text-green-400';
    } else if (awayGoals > homeGoals) {
      return 'text-blue-400';
    } else {
      return 'text-yellow-400';
    }
  }

  // Calculate save percentage for goalies
  calculateSavePercentage(goalie: any): number {
    const saves = Number(goalie.saves) || 0;
    const shotsAgainst = Number(goalie.shotsAgainst) || 0;
    
    if (shotsAgainst === 0) return 0;
    return Math.round((saves / shotsAgainst) * 100);
  }

  // Calculate goals against average for goalies
  calculateGAA(goalie: any): number {
    const goalsAgainst = Number(goalie.goalsAgainst) || 0;
    const timeOnIceMinutes = Number(goalie.timeOnIceMinutes) || 0;
    const timeOnIceSeconds = Number(goalie.timeOnIceSeconds) || 0;
    const totalMinutes = timeOnIceMinutes + (timeOnIceSeconds / 60);
    
    if (totalMinutes === 0) return 0;
    return Math.round((goalsAgainst / totalMinutes) * 60 * 100) / 100;
  }

  submitStats() {
    if (this.statsForm.valid && this.selectedGame) {
      // Calculate final scores
      const homeGoals = this.getTotalGoals('home');
      const awayGoals = this.getTotalGoals('away');
      
      const statsData = {
        gameId: this.selectedGame._id,
        homeScore: homeGoals,
        awayScore: awayGoals,
        manualStats: {
          homeSkaters: this.homeSkaters.filter(p => p.gamertag.trim() !== ''),
          awaySkaters: this.awaySkaters.filter(p => p.gamertag.trim() !== ''),
          homeGoalies: this.homeGoalies.filter(p => p.gamertag.trim() !== ''),
          awayGoalies: this.awayGoalies.filter(p => p.gamertag.trim() !== '')
        },
        ...this.statsForm.value
      };

      console.log('Submitting stats with calculated scores:', {
        homeGoals,
        awayGoals,
        winner: homeGoals > awayGoals ? 'home' : awayGoals > homeGoals ? 'away' : 'tie'
      });

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