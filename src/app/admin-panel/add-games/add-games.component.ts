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
  playoffBrackets: any[] = [];
  playoffSeries: any[] = [];
  isPlayoffGame = false;

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
      time: ['', Validators.required],
      isPlayoff: [false],
      playoffBracketId: [''],
      playoffSeriesId: [''],
      playoffRoundId: ['']
    });
  }

  ngOnInit() {
    this.loadAllData();
    this.loadPlayoffBrackets();
    
    // Watch for playoff checkbox changes
    this.gameForm.get('isPlayoff')?.valueChanges.subscribe(isPlayoff => {
      this.isPlayoffGame = isPlayoff;
      if (isPlayoff) {
        this.gameForm.get('playoffBracketId')?.setValidators(Validators.required);
        this.gameForm.get('playoffSeriesId')?.setValidators(Validators.required);
        this.gameForm.get('playoffRoundId')?.setValidators(Validators.required);
      } else {
        this.gameForm.get('playoffBracketId')?.clearValidators();
        this.gameForm.get('playoffSeriesId')?.clearValidators();
        this.gameForm.get('playoffRoundId')?.clearValidators();
        this.gameForm.get('playoffBracketId')?.setValue('');
        this.gameForm.get('playoffSeriesId')?.setValue('');
        this.gameForm.get('playoffRoundId')?.setValue('');
      }
      this.gameForm.get('playoffBracketId')?.updateValueAndValidity();
      this.gameForm.get('playoffSeriesId')?.updateValueAndValidity();
      this.gameForm.get('playoffRoundId')?.updateValueAndValidity();
    });
    
    // Watch for bracket changes to load series
    this.gameForm.get('playoffBracketId')?.valueChanges.subscribe(bracketId => {
      if (bracketId) {
        this.loadPlayoffSeries(bracketId);
      } else {
        this.playoffSeries = [];
      }
    });
  }

  loadPlayoffBrackets() {
    this.api.getPlayoffBrackets().subscribe({
      next: (brackets) => {
        this.playoffBrackets = brackets.filter((b: any) => b.status === 'active' || b.status === 'setup');
      },
      error: (error) => {
        console.error('Error loading playoff brackets:', error);
      }
    });
  }

  loadPlayoffSeries(bracketId: string) {
    this.api.getPlayoffBracketSeries(bracketId).subscribe({
      next: (series) => {
        this.playoffSeries = series;
      },
      error: (error) => {
        console.error('Error loading playoff series:', error);
        this.playoffSeries = [];
      }
    });
  }

  onPlayoffBracketChange() {
    const bracketId = this.gameForm.get('playoffBracketId')?.value;
    if (bracketId) {
      this.loadPlayoffSeries(bracketId);
      // Get bracket to populate round info
      this.api.getPlayoffBracket(bracketId).subscribe({
        next: (bracket) => {
          // Round ID will be set when series is selected
        }
      });
    }
  }

  onPlayoffSeriesChange() {
    const seriesId = this.gameForm.get('playoffSeriesId')?.value;
    const bracketId = this.gameForm.get('playoffBracketId')?.value;
    if (seriesId && bracketId) {
      this.api.getPlayoffSeries(seriesId, bracketId).subscribe({
        next: (series) => {
          // Set round ID from series
          this.gameForm.get('playoffRoundId')?.setValue(series.roundId || `round-${series.roundOrder}`);
        }
      });
    }
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
      this.filteredDivisions = this.divisions.filter(div => div.seasonId === selectedSeasonId).sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
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
      const gameData: any = {
        seasonId: formData.season,
        divisionId: formData.division,
        homeClubId: formData.team1,
        awayClubId: formData.team2,
        date: new Date(`${formData.date}T${formData.time}`), // Combine date and time
        status: 'scheduled' // Set default status
      };

      // Add playoff fields if this is a playoff game
      if (formData.isPlayoff) {
        gameData.isPlayoff = true;
        gameData.playoffBracketId = formData.playoffBracketId;
        gameData.playoffSeriesId = formData.playoffSeriesId;
        gameData.playoffRoundId = formData.playoffRoundId;
      }
      
      console.log('Sending game data:', gameData);
      
      this.api.addGame(gameData).subscribe({
        next: (game) => {
          console.log('Game added successfully:', game);
          console.log('Game ID:', game._id || game.id);
          
          if (formData.isPlayoff && formData.playoffBracketId && formData.playoffSeriesId) {
            // For playoff games, navigate to the series page
            console.log('Game created - Playoff Series ID:', formData.playoffSeriesId);
            console.log('Game created - Bracket ID:', formData.playoffBracketId);
            alert('Playoff game created successfully and added to the series!');
            // Ensure we have valid IDs before navigating - use string conversion to ensure proper format
            const seriesId = String(formData.playoffSeriesId).trim();
            const bracketId = String(formData.playoffBracketId).trim();
            
            if (seriesId && bracketId && seriesId !== 'undefined' && bracketId !== 'undefined') {
              console.log('Navigating to /playoffs/series/' + seriesId + '?bracketId=' + bracketId);
              this.router.navigate(['/playoffs', 'series', seriesId], {
                queryParams: { bracketId: bracketId }
              }).catch(err => {
                console.error('Navigation error:', err);
                console.error('Failed to navigate to series, falling back to bracket page');
                // Fallback to bracket page if series navigation fails
                this.router.navigate(['/playoffs']);
              });
            } else {
              console.warn('Invalid IDs - Series:', seriesId, 'Bracket:', bracketId);
              // Fallback to bracket page if IDs are missing or invalid
              this.router.navigate(['/playoffs']);
            }
          } else {
            // For regular games, go to schedule
            alert('Game created successfully!');
            this.router.navigate(['/schedule']);
          }
        },
        error: (error) => {
          console.error('Error adding game:', error);
          console.error('Error details:', error.error);
          console.error('Status:', error.status);
          alert('Error creating game: ' + (error.error?.message || error.message || 'Unknown error'));
        }
      });
    }
  }
}
