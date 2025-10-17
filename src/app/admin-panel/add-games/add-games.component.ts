import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
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
  order?: number;
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
  dataLoaded = false;

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
    this.loadAllData();
  }

  loadAllData() {
    // Load all data in parallel and wait for all to complete
    forkJoin({
      seasons: this.api.getSeasons(),
      divisions: this.api.getDivisions(),
      clubs: this.api.getClubs()
    }).subscribe({
      next: (data) => {
        console.log('All data loaded:', data);
        this.seasons = [...(data.seasons || [])];
        this.divisions = [...(data.divisions || [])].sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
        this.clubs = [...(data.clubs || [])].sort((a, b) => a.name.localeCompare(b.name));
        this.dataLoaded = true;
        console.log('Data loading complete. Seasons:', this.seasons.length, 'Divisions:', this.divisions.length, 'Clubs:', this.clubs.length);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.dataLoaded = true; // Still set to true to allow form interaction
      }
    });
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
        // Create a new array to avoid read-only property errors
        this.divisions = [...(divisions || [])].sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
      },
      error: (error) => {
        console.error('Error loading divisions:', error);
        this.divisions = [];
      }
    });
  }

  loadClubs() {
    this.api.getClubs().subscribe({
      next: (clubs) => {
        // Create a new array to avoid read-only property errors
        this.clubs = [...(clubs || [])].sort((a, b) => a.name.localeCompare(b.name));
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
        this.clubs = [];
      }
    });
  }

  onSeasonChange() {
    if (!this.dataLoaded) {
      console.log('Data not loaded yet, ignoring season change');
      return;
    }
    
    const selectedSeasonId = this.gameForm.get('season')?.value;
    console.log('Season changed to:', selectedSeasonId);
    console.log('Available divisions:', this.divisions.length);
    
    if (selectedSeasonId && this.divisions.length > 0) {
      this.filteredDivisions = this.divisions.filter(div => div.seasonId === selectedSeasonId).sort((a, b) => a.name.localeCompare(b.name));
      console.log('Filtered divisions:', this.filteredDivisions.length);
    } else {
      this.filteredDivisions = [];
      console.log('No divisions available or no season selected');
    }
    // Clear division and teams when season changes
    this.filteredClubs = [];
    this.gameForm.patchValue({ division: '', team1: '', team2: '' });
  }

  onDivisionChange() {
    if (!this.dataLoaded) {
      console.log('Data not loaded yet, ignoring division change');
      return;
    }
    
    const selectedSeasonId = this.gameForm.get('season')?.value;
    const selectedDivisionId = this.gameForm.get('division')?.value;
    
    console.log('Division changed to:', selectedDivisionId);
    console.log('Available clubs:', this.clubs.length);
    
    if (selectedSeasonId && selectedDivisionId && this.clubs.length > 0) {
      // Filter clubs that are in the selected season and division
      this.filteredClubs = this.clubs.filter(club => {
        return club.seasons && club.seasons.some((season: any) => {
          // Check if club is in the selected season
          const isInSeason = (typeof season.seasonId === 'object' && season.seasonId._id === selectedSeasonId) ||
                            (typeof season.seasonId === 'string' && season.seasonId === selectedSeasonId);
          
          if (!isInSeason) return false;
          
          // Check if club is in the selected division
          return season.divisionIds && season.divisionIds.some((divisionId: any) => {
            return (typeof divisionId === 'object' && divisionId._id === selectedDivisionId) ||
                   (typeof divisionId === 'string' && divisionId === selectedDivisionId);
          });
        });
      }).sort((a, b) => a.name.localeCompare(b.name));
      console.log('Filtered clubs:', this.filteredClubs.length);
    } else {
      this.filteredClubs = [];
      console.log('No clubs available or missing season/division selection');
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
