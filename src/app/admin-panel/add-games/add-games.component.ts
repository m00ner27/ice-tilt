import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../store/services/api.service';

interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Division {
  _id: string;
  name: string;
  seasonId: string;
  logoUrl: string;
  manager: string;
  seasons: any[];
}

interface Club {
  _id: string;
  name: string;
  logoUrl: string;
  seasons: any[];
}

@Component({
  selector: 'app-add-games',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-games.component.html'
})
export class AddGamesComponent implements OnInit {
  seasons: Season[] = [];
  divisions: Division[] = [];
  clubs: Club[] = [];
  filteredDivisions: Division[] = [];
  filteredClubs: Club[] = [];
  gameForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {
    this.gameForm = this.fb.group({
      season: ['', Validators.required],
      division: ['', Validators.required],
      team1: ['', Validators.required],
      team2: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadSeasons();
    this.loadDivisions();
    this.loadClubs();
  }

  loadSeasons() {
    this.api.getSeasons().subscribe({
      next: (seasons) => {
        this.seasons = seasons;
      },
      error: (error) => {
        console.error('Error loading seasons:', error);
      }
    });
  }

  loadDivisions() {
    this.api.getDivisions().subscribe({
      next: (divisions) => {
        this.divisions = divisions;
      },
      error: (error) => {
        console.error('Error loading divisions:', error);
      }
    });
  }

  loadClubs() {
    this.api.getClubs().subscribe({
      next: (clubs) => {
        this.clubs = clubs;
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
      }
    });
  }

  onSeasonChange() {
    const selectedSeasonId = this.gameForm.get('season')?.value;
    if (selectedSeasonId) {
      this.filteredDivisions = this.divisions.filter(div => div.seasonId === selectedSeasonId);
    } else {
      this.filteredDivisions = [];
    }
    this.gameForm.patchValue({ division: '' });
  }

  onDivisionChange() {
    const selectedDivisionId = this.gameForm.get('division')?.value;
    if (selectedDivisionId) {
      // Filter clubs by division (this would need to be implemented based on your data structure)
      this.filteredClubs = this.clubs;
    } else {
      this.filteredClubs = [];
    }
    this.gameForm.patchValue({ team1: '', team2: '' });
  }

  submitGame() {
    if (this.gameForm.valid) {
      const formData = this.gameForm.value;
      
      // Transform the form data to match the API expectations
      const gameData = {
        seasonId: formData.season,
        divisionId: formData.division,
        homeClubId: formData.team1,
        awayClubId: formData.team2,
        date: new Date(`${formData.date}T${formData.time}`), // Combine date and time
        status: 'scheduled' // Set default status
      };
      
      console.log('Sending game data:', gameData);
      
      this.api.addGame(gameData).subscribe({
        next: (game) => {
          console.log('Game added successfully:', game);
          console.log('Game ID:', game._id || game.id);
          
          // Instead of navigating directly, go to schedule to see if the game appears
          this.router.navigate(['/schedule']);
        },
        error: (error) => {
          console.error('Error adding game:', error);
          console.error('Error details:', error.error);
          console.error('Status:', error.status);
        }
      });
    }
  }
}
