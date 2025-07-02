import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { forkJoin } from 'rxjs';

interface Season {
  _id: string;
  name: string;
}

interface Division {
  _id: string;
  name: string;
  seasonId: string;
}

interface Club {
  _id: string;
  name: string;
  logoUrl: string;
  manager: string;
  seasons: any[];
}

@Component({
  selector: 'app-add-games',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="add-games-page">
      <h2>Add Game</h2>
      <form [formGroup]="gameForm" (ngSubmit)="submitGame()" class="add-game-form">
        <div class="form-row">
          <label>Season</label>
          <select formControlName="season" (change)="onSeasonChange()">
            <option value="" disabled selected>Select Season</option>
            <option *ngFor="let season of seasons" [value]="season._id">{{ season.name }}</option>
          </select>
        </div>
        <div class="form-row">
          <label>Division</label>
          <select formControlName="division" (change)="onDivisionChange()">
            <option value="" disabled selected>Select Division</option>
            <option *ngFor="let division of filteredDivisions" [value]="division._id">{{ division.name }}</option>
          </select>
        </div>
        <div class="form-row">
          <label>Team 1</label>
          <select formControlName="team1">
            <option value="" disabled selected>Select Team 1</option>
            <option *ngFor="let club of filteredClubs" [value]="club._id">{{ club.name }}</option>
          </select>
        </div>
        <div class="form-row">
          <label>Team 2</label>
          <select formControlName="team2">
            <option value="" disabled selected>Select Team 2</option>
            <option *ngFor="let club of filteredClubs" [value]="club._id">{{ club.name }}</option>
          </select>
        </div>
        <div class="form-row">
          <label>Date</label>
          <input type="date" formControlName="date">
        </div>
        <div class="form-row">
          <label>Time</label>
          <input type="time" formControlName="time">
        </div>
        <div class="form-actions">
          <button type="submit" [disabled]="!gameForm.valid">Add Game</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .add-games-page {
      max-width: 500px;
      margin: 40px auto;
      background: #23293a;
      border-radius: 12px;
      padding: 32px 28px 28px 28px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
    }
    h2 {
      color: #90caf9;
      margin-bottom: 24px;
      text-align: center;
    }
    .add-game-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .form-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    label {
      color: #90caf9;
      font-weight: 600;
    }
    select, input[type="date"], input[type="time"] {
      background: #2c3446;
      color: #fff;
      border: 1px solid #394867;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 1rem;
    }
    button[type="submit"] {
      background: #1976d2;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 10px 0;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 12px;
    }
    button[type="submit"]:hover {
      background: #1565c0;
    }
  `]
})
export class AddGamesComponent implements OnInit {
  seasons: Season[] = [];
  divisions: Division[] = [];
  clubs: Club[] = [];

  filteredDivisions: Division[] = [];
  filteredClubs: Club[] = [];

  gameForm: FormGroup;

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.gameForm = this.fb.group({
      season: ['', Validators.required],
      division: ['', Validators.required],
      team1: ['', Validators.required],
      team2: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.api.getSeasons().subscribe(seasons => this.seasons = seasons);
    this.api.getDivisions().subscribe(divisions => this.divisions = divisions);
    this.api.getClubs().subscribe(clubs => this.clubs = clubs);

    this.gameForm.get('season')?.valueChanges.subscribe(() => this.onSeasonChange());
    this.gameForm.get('division')?.valueChanges.subscribe(() => this.onDivisionChange());
  }

  onSeasonChange() {
    const seasonId = this.gameForm.get('season')?.value;
    this.filteredDivisions = this.divisions.filter(d => d.seasonId === seasonId);
    this.gameForm.get('division')?.setValue('');
    this.filteredClubs = [];
    this.gameForm.get('team1')?.setValue('');
    this.gameForm.get('team2')?.setValue('');
  }

  onDivisionChange() {
    const seasonId = this.gameForm.get('season')?.value;
    const divisionId = this.gameForm.get('division')?.value;
    // Filter clubs that are in the selected season and division
    this.filteredClubs = this.clubs.filter(club =>
      club.seasons.some((s: any) => s.seasonId === seasonId && s.divisionIds.includes(divisionId))
    );
    this.gameForm.get('team1')?.setValue('');
    this.gameForm.get('team2')?.setValue('');
  }

  submitGame() {
    if (this.gameForm.valid) {
      const form = this.gameForm.value;
      const payload = {
        seasonId: form.season,
        divisionId: form.division,
        homeClubId: form.team1,
        awayClubId: form.team2,
        date: form.date,
        time: form.time
      };
      this.api.addGame(payload).subscribe({
        next: () => {
          alert('Game created successfully!');
          this.gameForm.reset();
          this.filteredDivisions = [];
          this.filteredClubs = [];
        },
        error: (err) => {
          alert('Failed to create game: ' + (err?.error?.message || err.message || 'Unknown error'));
        }
      });
    }
  }
}
