import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
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
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {
    this.gameForm = this.fb.group({
      season: ['', Validators.required],
      division: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      isPlayoff: [false],
      playoffBracketId: [''],
      playoffSeriesId: [''],
      playoffRoundId: [''],
      matchups: this.fb.array([this.createMatchupGroup()], [this.atLeastOneMatchup])
    });
  }

  get matchups(): FormArray {
    return this.gameForm.get('matchups') as FormArray;
  }

  createMatchupGroup(): FormGroup {
    return this.fb.group({
      homeTeam: ['', Validators.required],
      awayTeam: ['', Validators.required]
    }, { validators: this.differentTeamsValidator });
  }

  atLeastOneMatchup: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const formArray = control as FormArray;
    return formArray.length > 0 ? null : { atLeastOne: true };
  }

  differentTeamsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const home = group.get('homeTeam')?.value;
    const away = group.get('awayTeam')?.value;
    return home && away && home === away ? { sameTeam: true } : null;
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
    this.gameForm.patchValue({ division: '' });
    // Clear all matchups
    while (this.matchups.length > 0) {
      this.matchups.removeAt(0);
    }
    this.matchups.push(this.createMatchupGroup());
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
    // Clear all matchups when division changes
    while (this.matchups.length > 0) {
      this.matchups.removeAt(0);
    }
    this.matchups.push(this.createMatchupGroup());
  }

  addMatchup() {
    this.matchups.push(this.createMatchupGroup());
  }

  removeMatchup(index: number) {
    if (this.matchups.length > 1) {
      this.matchups.removeAt(index);
    }
  }

  hasDuplicateMatchup(index: number): boolean {
    const currentMatchup = this.matchups.at(index);
    const homeTeam = currentMatchup.get('homeTeam')?.value;
    const awayTeam = currentMatchup.get('awayTeam')?.value;

    if (!homeTeam || !awayTeam) {
      return false;
    }

    // Check if this exact matchup exists elsewhere
    for (let i = 0; i < this.matchups.length; i++) {
      if (i !== index) {
        const otherMatchup = this.matchups.at(i);
        const otherHome = otherMatchup.get('homeTeam')?.value;
        const otherAway = otherMatchup.get('awayTeam')?.value;

        // Check for exact duplicate (same home and away)
        if (otherHome === homeTeam && otherAway === awayTeam) {
          return true;
        }

        // Check for reverse duplicate (same teams, swapped)
        if (otherHome === awayTeam && otherAway === homeTeam) {
          return true;
        }
      }
    }

    return false;
  }

  submitGames() {
    // Mark all form controls as touched to show validation errors
    this.gameForm.markAllAsTouched();
    
    // Validate basic form fields
    if (!this.gameForm.get('season')?.value || !this.gameForm.get('division')?.value || 
        !this.gameForm.get('date')?.value || !this.gameForm.get('time')?.value) {
      alert('Please fill in all required fields (Season, Division, Date, Time).');
      return;
    }

    // Check if we have at least one matchup
    if (this.matchups.length === 0) {
      alert('Please add at least one matchup.');
      return;
    }

    // Validate that at least one matchup has both teams selected
    let hasValidMatchup = false;
    for (let i = 0; i < this.matchups.length; i++) {
      const matchup = this.matchups.at(i);
      const homeTeam = matchup.get('homeTeam')?.value;
      const awayTeam = matchup.get('awayTeam')?.value;
      if (homeTeam && awayTeam && homeTeam !== awayTeam) {
        hasValidMatchup = true;
        break;
      }
    }

    if (!hasValidMatchup) {
      alert('Please select teams for at least one matchup.');
      return;
    }

    // Check playoff fields if playoff game is selected
    if (this.gameForm.get('isPlayoff')?.value) {
      if (!this.gameForm.get('playoffBracketId')?.value || !this.gameForm.get('playoffSeriesId')?.value) {
        alert('Please select a playoff bracket and series for playoff games.');
        return;
      }
    }

    // Proceed with submission
    if (this.matchups.length > 0) {
      this.submitting = true;
      const formData = this.gameForm.value;
      
      // Build array of game data from matchups
      const gamesData: any[] = [];
      const baseDate = new Date(`${formData.date}T${formData.time}`);
      
      // Track games by team combination to auto-space duplicates
      const gameTimeMap = new Map<string, { count: number; lastTime: Date }>();
      
      for (const matchup of formData.matchups) {
        if (matchup.homeTeam && matchup.awayTeam) {
          // Create a key for this team combination (normalized - always use smaller ID first)
          const teamKey = matchup.homeTeam < matchup.awayTeam 
            ? `${matchup.homeTeam}-${matchup.awayTeam}`
            : `${matchup.awayTeam}-${matchup.homeTeam}`;
          
          // Check if we've seen this team combination before
          const existing = gameTimeMap.get(teamKey);
          let gameDate: Date;
          
          if (existing) {
            // Space this game 30 minutes after the last one
            gameDate = new Date(existing.lastTime.getTime() + 30 * 60 * 1000);
            existing.count++;
            existing.lastTime = gameDate;
          } else {
            // First game with these teams - use base time
            gameDate = new Date(baseDate);
            gameTimeMap.set(teamKey, { count: 1, lastTime: gameDate });
          }
          
          const gameData: any = {
            seasonId: formData.season,
            divisionId: formData.division,
            homeClubId: matchup.homeTeam,
            awayClubId: matchup.awayTeam,
            date: gameDate,
            status: 'scheduled' // Set default status
          };

          // Add playoff fields if this is a playoff game
          if (formData.isPlayoff) {
            gameData.isPlayoff = true;
            gameData.playoffBracketId = formData.playoffBracketId;
            gameData.playoffSeriesId = formData.playoffSeriesId;
            gameData.playoffRoundId = formData.playoffRoundId;
          }

          gamesData.push(gameData);
        }
      }

      if (gamesData.length === 0) {
        alert('Please add at least one valid matchup.');
        this.submitting = false;
        return;
      }
      
      console.log('Sending bulk game data:', gamesData);
      console.log('Number of games to create:', gamesData.length);
      
      this.api.addGamesBulk(gamesData).subscribe({
        next: (response) => {
          console.log('Games added successfully:', response);
          this.submitting = false;
          
          const successCount = response.success || 0;
          const failureCount = response.failed || 0;
          const total = response.total || gamesData.length;

          if (failureCount === 0) {
            // All games created successfully
            if (formData.isPlayoff && formData.playoffBracketId && formData.playoffSeriesId) {
              alert(`Successfully created ${successCount} playoff game(s)!`);
              const seriesId = String(formData.playoffSeriesId).trim();
              const bracketId = String(formData.playoffBracketId).trim();
              
              if (seriesId && bracketId && seriesId !== 'undefined' && bracketId !== 'undefined') {
                this.router.navigate(['/playoffs', 'series', seriesId], {
                  queryParams: { bracketId: bracketId }
                }).catch(() => {
                  this.router.navigate(['/playoffs']);
                });
              } else {
                this.router.navigate(['/playoffs']);
              }
            } else {
              alert(`Successfully created ${successCount} game(s)!`);
              this.router.navigate(['/schedule']);
            }
          } else {
            // Some games failed
            let errorMessage = `Created ${successCount} of ${total} game(s). ${failureCount} failed.\n\n`;
            
            if (response.results) {
              const failedGames = response.results.filter((r: any) => !r.success);
              failedGames.forEach((failed: any, index: number) => {
                errorMessage += `Game ${failed.index + 1}: ${failed.error}\n`;
              });
            }
            
            alert(errorMessage);
            
            // Still navigate on partial success
            if (successCount > 0) {
              if (formData.isPlayoff && formData.playoffBracketId && formData.playoffSeriesId) {
                const seriesId = String(formData.playoffSeriesId).trim();
                const bracketId = String(formData.playoffBracketId).trim();
                if (seriesId && bracketId && seriesId !== 'undefined' && bracketId !== 'undefined') {
                  this.router.navigate(['/playoffs', 'series', seriesId], {
                    queryParams: { bracketId: bracketId }
                  }).catch(() => {
                    this.router.navigate(['/playoffs']);
                  });
                } else {
                  this.router.navigate(['/playoffs']);
                }
              } else {
                this.router.navigate(['/schedule']);
              }
            }
          }
        },
        error: (error) => {
          console.error('Error adding games:', error);
          console.error('Error details:', error.error);
          console.error('Error status:', error.status);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          this.submitting = false;
          
          let errorMessage = 'Unknown error';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.error) {
            errorMessage = JSON.stringify(error.error);
          }
          
          alert('Error creating games: ' + errorMessage);
        }
      });
    }
  }
}
