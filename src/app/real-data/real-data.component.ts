import { Component, OnInit } from '@angular/core';
import { ApiService } from '../store/services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-real-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h2>Ice Tilt Data Integration Test</h2>
      
      <!-- Skater Data Section -->
      <div class="card mb-4">
        <div class="card-header">Skater Data</div>
        <div class="card-body">
          <button (click)="loadSkaterData()" class="btn btn-primary mb-3">Load Skater Data</button>
          
          <div *ngIf="skaterLoading" class="text-center">
            <p>Loading data...</p>
          </div>
          
          <div *ngIf="skaterError" class="alert alert-danger">
            {{ skaterError }}
          </div>
          
          <div *ngIf="!skaterLoading && (!skaterData || skaterData.length === 0) && !skaterError" class="alert alert-info">
            No skater data found. Let's add some!
          </div>
          
          <table *ngIf="!skaterLoading && skaterData && skaterData.length > 0" class="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Team</th>
                <th>Position</th>
                <th>Goals</th>
                <th>Assists</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let skater of skaterData">
                <td>{{ skater.name }}</td>
                <td>{{ skater.team }}</td>
                <td>{{ skater.position }}</td>
                <td>{{ skater.stats?.goals }}</td>
                <td>{{ skater.stats?.assists }}</td>
              </tr>
            </tbody>
          </table>
          
          <hr>
          
          <h4>Add New Skater</h4>
          <form (ngSubmit)="addSkater()">
            <div class="row">
              <div class="col-md-4 mb-2">
                <label for="name">Name</label>
                <input type="text" class="form-control" id="name" [(ngModel)]="newSkater.name" name="name">
              </div>
              <div class="col-md-4 mb-2">
                <label for="team">Team</label>
                <input type="text" class="form-control" id="team" [(ngModel)]="newSkater.team" name="team">
              </div>
              <div class="col-md-4 mb-2">
                <label for="position">Position</label>
                <input type="text" class="form-control" id="position" [(ngModel)]="newSkater.position" name="position">
              </div>
            </div>
            <div class="row">
              <div class="col-md-4 mb-2">
                <label for="goals">Goals</label>
                <input type="number" class="form-control" id="goals" [(ngModel)]="newSkater.stats.goals" name="goals">
              </div>
              <div class="col-md-4 mb-2">
                <label for="assists">Assists</label>
                <input type="number" class="form-control" id="assists" [(ngModel)]="newSkater.stats.assists" name="assists">
              </div>
            </div>
            <button type="submit" class="btn btn-success">Add Skater</button>
          </form>
        </div>
      </div>
      
      <!-- Game Data Section -->
      <div class="card">
        <div class="card-header">Game Data</div>
        <div class="card-body">
          <button (click)="loadGameData()" class="btn btn-primary mb-3">Load Game Data</button>
          
          <div *ngIf="gameLoading" class="text-center">
            <p>Loading data...</p>
          </div>
          
          <div *ngIf="gameError" class="alert alert-danger">
            {{ gameError }}
          </div>
          
          <div *ngIf="!gameLoading && (!gameData || gameData.length === 0) && !gameError" class="alert alert-info">
            No game data found. Let's add some!
          </div>
          
          <table *ngIf="!gameLoading && gameData && gameData.length > 0" class="table table-striped">
            <thead>
              <tr>
                <th>Game ID</th>
                <th>Date</th>
                <th>Home Team</th>
                <th>Away Team</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let game of gameData">
                <td>{{ game.gameId }}</td>
                <td>{{ game.date | date }}</td>
                <td>{{ game.homeTeam }}</td>
                <td>{{ game.awayTeam }}</td>
                <td>{{ game.score?.home }} - {{ game.score?.away }}</td>
              </tr>
            </tbody>
          </table>
          
          <hr>
          
          <h4>Add New Game</h4>
          <form (ngSubmit)="addGame()">
            <div class="row">
              <div class="col-md-4 mb-2">
                <label for="gameId">Game ID</label>
                <input type="text" class="form-control" id="gameId" [(ngModel)]="newGame.gameId" name="gameId">
              </div>
              <div class="col-md-4 mb-2">
                <label for="date">Date</label>
                <input type="date" class="form-control" id="date" [(ngModel)]="newGame.date" name="date">
              </div>
            </div>
            <div class="row">
              <div class="col-md-4 mb-2">
                <label for="homeTeam">Home Team</label>
                <input type="text" class="form-control" id="homeTeam" [(ngModel)]="newGame.homeTeam" name="homeTeam">
              </div>
              <div class="col-md-4 mb-2">
                <label for="awayTeam">Away Team</label>
                <input type="text" class="form-control" id="awayTeam" [(ngModel)]="newGame.awayTeam" name="awayTeam">
              </div>
            </div>
            <div class="row">
              <div class="col-md-4 mb-2">
                <label for="homeScore">Home Score</label>
                <input type="number" class="form-control" id="homeScore" [(ngModel)]="newGame.score.home" name="homeScore">
              </div>
              <div class="col-md-4 mb-2">
                <label for="awayScore">Away Score</label>
                <input type="number" class="form-control" id="awayScore" [(ngModel)]="newGame.score.away" name="awayScore">
              </div>
            </div>
            <button type="submit" class="btn btn-success">Add Game</button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RealDataComponent implements OnInit {
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

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    // Load data when component initializes
    this.loadSkaterData();
    this.loadGameData();
  }

  // Skater data methods
  loadSkaterData() {
    this.skaterLoading = true;
    this.skaterError = '';
    
    this.apiService.getSkaterData().subscribe({
      next: (data) => {
        this.skaterData = data;
        this.skaterLoading = false;
      },
      error: (error) => {
        this.skaterError = `Failed to load skater data: ${error.message}`;
        this.skaterLoading = false;
        console.error('Error loading skater data:', error);
      }
    });
  }

  addSkater() {
    if (!this.newSkater.name) {
      this.skaterError = 'Name is required';
      return;
    }
    
    this.skaterLoading = true;
    this.skaterError = '';
    
    this.apiService.addSkaterData(this.newSkater).subscribe({
      next: (response) => {
        this.skaterLoading = false;
        // Add the new skater to our list
        this.skaterData.push(response);
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
      },
      error: (error) => {
        this.skaterLoading = false;
        this.skaterError = `Failed to add skater: ${error.message}`;
        console.error('Error adding skater data:', error);
      }
    });
  }

  // Game data methods
  loadGameData() {
    this.gameLoading = true;
    this.gameError = '';
    
    this.apiService.getGameData().subscribe({
      next: (data) => {
        this.gameData = data;
        this.gameLoading = false;
      },
      error: (error) => {
        this.gameError = `Failed to load game data: ${error.message}`;
        this.gameLoading = false;
        console.error('Error loading game data:', error);
      }
    });
  }

  addGame() {
    if (!this.newGame.gameId || !this.newGame.homeTeam || !this.newGame.awayTeam) {
      this.gameError = 'Game ID, Home Team, and Away Team are required';
      return;
    }
    
    this.gameLoading = true;
    this.gameError = '';
    
    this.apiService.addGameData(this.newGame).subscribe({
      next: (response) => {
        this.gameLoading = false;
        // Add the new game to our list
        this.gameData.push(response);
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
      },
      error: (error) => {
        this.gameLoading = false;
        this.gameError = `Failed to add game: ${error.message}`;
        console.error('Error adding game data:', error);
      }
    });
  }
} 