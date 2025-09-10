import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';

// Import selectors - we'll need to create these for real data
// For now, we'll use a simple approach with local state

@Component({
  selector: 'app-real-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './real-data.component.html'
})
export class RealDataComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Local state for this real data component
  // Skater data
  skaterData: any[] = [];
  skaterLoading: boolean = false;
  skaterError: string = '';
  newSkater = {
    name: '',
    team: '',
    position: '',
    stats: {
      goals: 0,
      assists: 0
    }
  };

  // Game data
  gameData: any[] = [];
  gameLoading: boolean = false;
  gameError: string = '';
  newGame = {
    gameId: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    homeTeam: '',
    awayTeam: '',
    score: {
      home: 0,
      away: 0
    }
  };

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService
  ) { }

  ngOnInit() {
    // Load data when component initializes
    this.loadSkaterData();
    this.loadGameData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSkaterData() {
    this.skaterLoading = true;
    this.skaterError = '';
    
    // Note: This would need to be implemented in the NgRx API service
    // For now, we'll keep the direct API call approach for testing
    this.skaterLoading = false;
    this.skaterError = 'Skater data loading - NgRx integration pending';
  }

  addSkater() {
    if (!this.newSkater.name || !this.newSkater.team || !this.newSkater.position) {
      this.skaterError = 'Name, team, and position are required';
      return;
    }
    
    this.skaterLoading = true;
    this.skaterError = '';
    
    // Note: This would need to be implemented in the NgRx API service
    // For now, we'll keep the direct API call approach for testing
    this.skaterLoading = false;
    this.skaterError = 'Skater data adding - NgRx integration pending';
    
    // Reset the form
    this.newSkater = {
      name: '',
      team: '',
      position: '',
      stats: {
        goals: 0,
        assists: 0
      }
    };
  }

  loadGameData() {
    this.gameLoading = true;
    this.gameError = '';
    
    // Note: This would need to be implemented in the NgRx API service
    // For now, we'll keep the direct API call approach for testing
    this.gameLoading = false;
    this.gameError = 'Game data loading - NgRx integration pending';
  }

  addGame() {
    if (!this.newGame.gameId || !this.newGame.homeTeam || !this.newGame.awayTeam) {
      this.gameError = 'Game ID, home team, and away team are required';
      return;
    }
    
    this.gameLoading = true;
    this.gameError = '';
    
    // Note: This would need to be implemented in the NgRx API service
    // For now, we'll keep the direct API call approach for testing
    this.gameLoading = false;
    this.gameError = 'Game data adding - NgRx integration pending';
    
    // Reset the form
    this.newGame = {
      gameId: '',
      date: new Date().toISOString().split('T')[0],
      homeTeam: '',
      awayTeam: '',
      score: {
        home: 0,
        away: 0
      }
    };
  }
}