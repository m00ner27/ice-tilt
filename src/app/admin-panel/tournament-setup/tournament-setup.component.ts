import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { forkJoin } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { ApiService } from '../../store/services/api.service';
import { ImageUrlService } from '../../shared/services/image-url.service';
import * as TournamentsActions from '../../store/tournaments/tournaments.actions';
import * as TournamentsSelectors from '../../store/tournaments/tournaments.selectors';

interface Tournament {
  _id: string;
  name: string;
}

interface Club {
  _id: string;
  name: string;
  logoUrl?: string;
  tournaments?: any[];
}

interface Seeding {
  clubId: string;
  seed: number;
}

interface RoundConfig {
  name: string;
  bestOf: number;
  order: number;
}

@Component({
  selector: 'app-tournament-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tournament-setup.component.html',
  styleUrl: './tournament-setup.component.css'
})
export class TournamentSetupComponent implements OnInit, OnDestroy {
  tournaments: Tournament[] = [];
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  
  bracketForm: FormGroup;
  currentStep = 1;
  totalSteps = 4;
  dataLoaded = false;
  previewBracket: any = null;
  existingBracket: any = null;
  
  // Bracket list view
  viewMode: 'list' | 'create' | 'edit' = 'list';
  brackets: any[] = [];
  bracketsLoading = false;
  
  // Matchup editor
  editingBracket: any = null;
  editingRoundOrder: number | null = null;
  matchupEditorOpen = false;
  availableTeams: any[] = [];
  availableWinners: any[] = [];
  availableLosers: any[] = [];
  currentMatchups: any[] = [];
  winnersMatchups: any[] = [];
  losersMatchups: any[] = [];
  
  // Logo upload
  logoPreview: string | null = null;
  uploadingLogo: boolean = false;
  
  // Event listener for admin updates
  private adminUpdateListener?: () => void;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private store: Store<AppState>,
    private imageUrlService: ImageUrlService
  ) {
      this.bracketForm = this.fb.group({
      name: ['', Validators.required],
      tournamentId: ['', Validators.required],
      logoUrl: [''],
      format: ['single-elimination', Validators.required],
      manualMatchups: [false],
      numTeams: [4, [Validators.required, Validators.min(2)]],
      seedings: this.fb.array([]),
      rounds: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadAllData();
    this.initializeRounds();
    this.loadBrackets();
    
    // Subscribe to brackets from store
    this.store.select(TournamentsSelectors.selectAllTournamentBrackets).subscribe(brackets => {
      this.brackets = brackets || [];
    });
    
    // Listen for admin data updates to refresh clubs list
    window.addEventListener('storage', (event) => {
      if (event.key === 'admin-data-updated') {
        this.loadAllData();
      }
    });
    
    // Also listen for custom events (for same-window updates)
    this.adminUpdateListener = () => {
      this.loadAllData();
    };
    window.addEventListener('admin-data-updated', this.adminUpdateListener as EventListener);
  }
  
  ngOnDestroy() {
    if (this.adminUpdateListener) {
      window.removeEventListener('admin-data-updated', this.adminUpdateListener as EventListener);
    }
  }

  loadAllData() {
    forkJoin({
      tournaments: this.api.getTournaments(),
      clubs: this.api.getClubs()
    }).subscribe({
      next: (data) => {
        this.tournaments = data.tournaments || [];
        this.clubs = (data.clubs || []).sort((a, b) => a.name.localeCompare(b.name));
        this.dataLoaded = true;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.dataLoaded = true;
      }
    });
  }

  onTournamentChange() {
    const tournamentId = this.bracketForm.get('tournamentId')?.value;
    if (tournamentId) {
      // Refresh clubs list first to ensure we have latest data
      this.api.getClubs().subscribe({
        next: (allClubs) => {
          this.clubs = (allClubs || []).sort((a, b) => a.name.localeCompare(b.name));
          // Then filter clubs for this tournament
          this.filterClubsForTournament(tournamentId);
        },
        error: (error) => {
          console.error('Error refreshing clubs:', error);
          // Still try to filter with existing clubs
          this.filterClubsForTournament(tournamentId);
        }
      });
    } else {
      this.filteredClubs = [];
    }
  }

  filterClubsForTournament(tournamentId: string) {
    this.filteredClubs = this.clubs.filter(club => {
      return club.tournaments && club.tournaments.some((tournament: any) => {
        const isInTournament = (typeof tournament.tournamentId === 'object' && tournament.tournamentId._id === tournamentId) ||
                              (typeof tournament.tournamentId === 'string' && tournament.tournamentId === tournamentId);
        return isInTournament;
      });
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  onFormatChange() {
    const format = this.bracketForm.get('format')?.value;
    if (format === 'placement-bracket') {
      // Placement bracket supports 4 or 8 teams (or other even numbers)
      const currentNumTeams = this.bracketForm.get('numTeams')?.value || 4;
      // If current value is not valid for placement bracket, default to 4
      if (currentNumTeams < 4 || currentNumTeams % 2 !== 0) {
        this.bracketForm.patchValue({ numTeams: 4 });
      }
      this.onNumTeamsChange();
    }
  }

  onNumTeamsChange() {
    const numTeams = this.bracketForm.get('numTeams')?.value || 8;
    const format = this.bracketForm.get('format')?.value;
    
    // Validate placement bracket requires even number of teams (minimum 4)
    if (format === 'placement-bracket') {
      if (numTeams < 4 || numTeams % 2 !== 0) {
        alert('Placement bracket format requires an even number of teams (minimum 4, e.g., 4 or 8 teams)');
        // Set to closest valid value
        const validValue = numTeams < 4 ? 4 : (numTeams % 2 === 0 ? numTeams : numTeams - 1);
        this.bracketForm.patchValue({ numTeams: validValue });
        return;
      }
    }
    
    const seedingsArray = this.bracketForm.get('seedings') as FormArray;
    
    // Adjust seedings array size
    while (seedingsArray.length < numTeams) {
      seedingsArray.push(this.fb.group({
        clubId: ['', Validators.required],
        seed: [seedingsArray.length + 1, [Validators.required, Validators.min(1)]]
      }));
    }
    while (seedingsArray.length > numTeams) {
      seedingsArray.removeAt(seedingsArray.length - 1);
    }
    
    // Update seed numbers
    seedingsArray.controls.forEach((control, index) => {
      control.patchValue({ seed: index + 1 }, { emitEvent: false });
    });
    
    // Recalculate rounds
    this.initializeRounds();
  }

  initializeRounds() {
    const numTeams = this.bracketForm.get('numTeams')?.value || 4;
    const format = this.bracketForm.get('format')?.value;
    const roundsArray = this.bracketForm.get('rounds') as FormArray;
    
    // Clear existing rounds
    while (roundsArray.length > 0) {
      roundsArray.removeAt(0);
    }
    
    let numRounds: number;
    let roundNames: string[];
    
    if (format === 'placement-bracket') {
      // Placement bracket: 2 rounds for 4 teams, 3 rounds for 8+ teams
      if (numTeams === 4) {
        numRounds = 2;
        roundNames = ['Initial Matchups', 'Final Placement'];
      } else {
        numRounds = 3;
        roundNames = ['Initial Matchups', 'Winners/Losers Bracket', 'Final Placement'];
      }
    } else {
      // Single elimination: log2 of teams
      numRounds = Math.ceil(Math.log2(numTeams));
      roundNames = ['Finals', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32'];
    }
    
    // Create rounds
    for (let i = 0; i < numRounds; i++) {
      // For placement bracket, rounds are in order: 1, 2, 3 (not reversed)
      // For single elimination, rounds are reversed: Final (1), Semifinal (2), etc.
      const roundOrder = format === 'placement-bracket' ? (i + 1) : (numRounds - i);
      const roundName = format === 'placement-bracket' 
        ? roundNames[i] 
        : (roundNames[Math.min(i, roundNames.length - 1)] || `Round ${roundOrder}`);
      const defaultBestOf = roundOrder === 1 ? 7 : roundOrder === 2 ? 5 : 3;
      
      roundsArray.push(this.fb.group({
        name: [roundName, Validators.required],
        bestOf: [defaultBestOf, [Validators.required, Validators.min(1), Validators.max(7)]],
        order: [roundOrder, Validators.required]
      }));
    }
  }

  get seedingsArray(): FormArray {
    return this.bracketForm.get('seedings') as FormArray;
  }

  get roundsArray(): FormArray {
    return this.bracketForm.get('rounds') as FormArray;
  }

  getRoundsAsFormGroups(): FormGroup[] {
    return this.roundsArray.controls as FormGroup[];
  }

  getSeedingsAsFormGroups(): FormGroup[] {
    return this.seedingsArray.controls as FormGroup[];
  }

  validateSeedings(): boolean {
    const seedings = this.seedingsArray.value;
    const numTeams = this.bracketForm.get('numTeams')?.value;
    
    // Check that all clubIds are filled in
    const clubIds = seedings.map((s: Seeding) => s.clubId).filter((id: string) => id);
    if (clubIds.length !== numTeams) {
      alert(`Please select all ${numTeams} teams!`);
      return false;
    }
    
    // Check for duplicate clubs within this bracket
    const uniqueClubIds = new Set(clubIds);
    if (uniqueClubIds.size !== clubIds.length) {
      alert('Each team can only appear once in the bracket!');
      return false;
    }
    
    // Check seeds
    const seeds = seedings.map((s: Seeding) => s.seed).filter((s: number) => s);
    const uniqueSeeds = new Set(seeds);
    
    if (seeds.length !== uniqueSeeds.size) {
      alert('Each seed number must be unique!');
      return false;
    }
    
    if (seeds.length !== numTeams) {
      alert(`Please assign all ${numTeams} seeds!`);
      return false;
    }
    
    const validSeeds = seeds.every((s: number) => s >= 1 && s <= numTeams);
    if (!validSeeds) {
      alert(`Seeds must be between 1 and ${numTeams}!`);
      return false;
    }
    
    return true;
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.bracketForm.get('name')?.valid || !this.bracketForm.get('tournamentId')?.valid || !this.bracketForm.get('numTeams')?.valid) {
        alert('Please fill in all required fields');
        return;
      }
      this.onNumTeamsChange();
    } else if (this.currentStep === 2) {
      if (!this.validateSeedings()) {
        return;
      }
    } else if (this.currentStep === 3) {
      if (!this.bracketForm.get('rounds')?.valid) {
        alert('Please configure all rounds');
        return;
      }
    }
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      if (this.currentStep === 4) {
        this.generatePreview();
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  generatePreview() {
    const formValue = this.bracketForm.value;
    const format = formValue.format || 'single-elimination';
    const numRounds = format === 'placement-bracket' 
      ? (formValue.numTeams === 4 ? 2 : 3)
      : Math.ceil(Math.log2(formValue.numTeams));
    
    this.previewBracket = {
      name: formValue.name,
      tournamentId: formValue.tournamentId,
      logoUrl: formValue.logoUrl,
      format: format,
      manualMatchups: formValue.manualMatchups || false,
      numTeams: formValue.numTeams,
      numRounds: numRounds,
      seedings: formValue.seedings.map((s: Seeding) => ({
        clubId: s.clubId,
        seed: s.seed,
        clubName: this.clubs.find(c => c._id === s.clubId)?.name || 'Unknown'
      })).sort((a: any, b: any) => a.seed - b.seed),
      rounds: formValue.rounds.sort((a: RoundConfig, b: RoundConfig) => a.order - b.order)
    };
  }

  saveBracket() {
    // Check form validity and provide specific error messages
    if (!this.bracketForm.valid) {
      // Check which fields are invalid
      const invalidFields: string[] = [];
      if (!this.bracketForm.get('name')?.valid) invalidFields.push('Bracket Name');
      if (!this.bracketForm.get('tournamentId')?.valid) invalidFields.push('Tournament');
      if (!this.bracketForm.get('format')?.valid) invalidFields.push('Format');
      if (!this.bracketForm.get('numTeams')?.valid) invalidFields.push('Number of Teams');
      
      // Check seedings
      const seedingsArray = this.seedingsArray;
      const invalidSeedings: number[] = [];
      seedingsArray.controls.forEach((control, index) => {
        if (!control.get('clubId')?.valid) {
          invalidSeedings.push(index + 1);
        }
        if (!control.get('seed')?.valid) {
          invalidSeedings.push(index + 1);
        }
      });
      
      // Check rounds
      const roundsArray = this.roundsArray;
      const invalidRounds: number[] = [];
      roundsArray.controls.forEach((control, index) => {
        if (!control.valid) {
          invalidRounds.push(index + 1);
        }
      });
      
      let errorMsg = 'Please fix the following errors:\n';
      if (invalidFields.length > 0) {
        errorMsg += `- Missing required fields: ${invalidFields.join(', ')}\n`;
      }
      if (invalidSeedings.length > 0) {
        errorMsg += `- Missing team selections at positions: ${[...new Set(invalidSeedings)].join(', ')}\n`;
      }
      if (invalidRounds.length > 0) {
        errorMsg += `- Invalid round configurations: ${invalidRounds.join(', ')}\n`;
      }
      
      alert(errorMsg.trim());
      return;
    }
    
    if (!this.validateSeedings()) {
      return; // validateSeedings already shows specific error messages
    }

    const formValue = this.bracketForm.value;
    const format = formValue.format || 'single-elimination';
    const numRounds = format === 'placement-bracket' 
      ? (formValue.numTeams === 4 ? 2 : 3)
      : Math.ceil(Math.log2(formValue.numTeams));
    
    const bracketData: Partial<TournamentsActions.TournamentBracket> = {
      name: formValue.name,
      tournamentId: formValue.tournamentId,
      logoUrl: formValue.logoUrl || undefined,
      format: format,
      manualMatchups: formValue.manualMatchups || false,
      numTeams: formValue.numTeams,
      numRounds: numRounds,
      seedings: formValue.seedings.map((s: Seeding) => ({
        clubId: s.clubId,
        seed: s.seed
      })),
      rounds: formValue.rounds.map((r: RoundConfig) => ({
        name: r.name,
        bestOf: r.bestOf,
        order: r.order
      })).sort((a: RoundConfig, b: RoundConfig) => a.order - b.order),
      status: 'setup' as 'setup' | 'active' | 'completed'
    };

    if (this.viewMode === 'edit' && this.existingBracket?._id) {
      // Update existing bracket
      this.store.dispatch(TournamentsActions.updateTournamentBracket({ 
        bracketId: this.existingBracket._id, 
        bracketData 
      }));
      
      const subscription = this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).subscribe(bracket => {
        if (bracket && bracket._id === this.existingBracket._id) {
          alert('Bracket updated successfully!');
          this.viewMode = 'list';
          this.loadBrackets();
          subscription.unsubscribe();
        }
      });
    } else {
      // Create new bracket
      this.store.dispatch(TournamentsActions.createTournamentBracket({ bracketData }));
      
      // Subscribe to the result
      const subscription = this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).subscribe(bracket => {
        if (bracket && bracket._id && !this.existingBracket) {
          this.existingBracket = bracket;
          subscription.unsubscribe();
        }
      });
    }
  }

  saveAndGenerateMatchups() {
    // Check form validity and provide specific error messages
    if (!this.bracketForm.valid) {
      // Check which fields are invalid
      const invalidFields: string[] = [];
      if (!this.bracketForm.get('name')?.valid) invalidFields.push('Bracket Name');
      if (!this.bracketForm.get('tournamentId')?.valid) invalidFields.push('Tournament');
      if (!this.bracketForm.get('format')?.valid) invalidFields.push('Format');
      if (!this.bracketForm.get('numTeams')?.valid) invalidFields.push('Number of Teams');
      
      // Check seedings
      const seedingsArray = this.seedingsArray;
      const invalidSeedings: number[] = [];
      seedingsArray.controls.forEach((control, index) => {
        if (!control.get('clubId')?.valid) {
          invalidSeedings.push(index + 1);
        }
        if (!control.get('seed')?.valid) {
          invalidSeedings.push(index + 1);
        }
      });
      
      // Check rounds
      const roundsArray = this.roundsArray;
      const invalidRounds: number[] = [];
      roundsArray.controls.forEach((control, index) => {
        if (!control.valid) {
          invalidRounds.push(index + 1);
        }
      });
      
      let errorMsg = 'Please fix the following errors:\n';
      if (invalidFields.length > 0) {
        errorMsg += `- Missing required fields: ${invalidFields.join(', ')}\n`;
      }
      if (invalidSeedings.length > 0) {
        errorMsg += `- Missing team selections at positions: ${[...new Set(invalidSeedings)].join(', ')}\n`;
      }
      if (invalidRounds.length > 0) {
        errorMsg += `- Invalid round configurations: ${invalidRounds.join(', ')}\n`;
      }
      
      alert(errorMsg.trim());
      return;
    }
    
    if (!this.validateSeedings()) {
      return; // validateSeedings already shows specific error messages
    }

    // First save the bracket
    const formValue = this.bracketForm.value;
    const format = formValue.format || 'single-elimination';
    const numRounds = format === 'placement-bracket' 
      ? (formValue.numTeams === 4 ? 2 : 3)
      : Math.ceil(Math.log2(formValue.numTeams));
    
    const bracketData: Partial<TournamentsActions.TournamentBracket> = {
      name: formValue.name,
      tournamentId: formValue.tournamentId,
      logoUrl: formValue.logoUrl || undefined,
      format: format,
      manualMatchups: formValue.manualMatchups || false,
      numTeams: formValue.numTeams,
      numRounds: numRounds,
      seedings: formValue.seedings.map((s: Seeding) => ({
        clubId: s.clubId,
        seed: s.seed
      })),
      rounds: formValue.rounds.map((r: RoundConfig) => ({
        name: r.name,
        bestOf: r.bestOf,
        order: r.order
      })).sort((a: RoundConfig, b: RoundConfig) => a.order - b.order),
      status: 'setup' as 'setup' | 'active' | 'completed'
    };

    if (this.viewMode === 'edit' && this.existingBracket?._id) {
      // Update existing bracket
      this.store.dispatch(TournamentsActions.updateTournamentBracket({ 
        bracketId: this.existingBracket._id, 
        bracketData 
      }));
      
      // Wait for update, then generate matchups
      const updateSubscription = this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).pipe(
        filter(bracket => bracket !== null && bracket._id === this.existingBracket._id),
        take(1)
      ).subscribe(bracket => {
        if (bracket && bracket._id) {
          this.existingBracket = bracket;
          const bracketId = bracket._id;
          
          // Generate matchups after update
          this.store.dispatch(TournamentsActions.generateTournamentMatchups({ bracketId }));
          
          // Wait for matchups to be generated or handle error
          const generateSubscription = this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).pipe(
            filter(updatedBracket => 
              updatedBracket !== null && 
              updatedBracket._id === bracketId && 
              updatedBracket.series && 
              updatedBracket.series.length > 0
            ),
            take(1)
          ).subscribe(updatedBracket => {
            alert('Bracket updated and matchups generated successfully!');
            this.viewMode = 'list';
            this.loadBrackets();
            generateSubscription.unsubscribe();
          });
          
          // Handle errors after a delay - use timeout to check if matchups weren't generated
          const errorCheckTimeout = setTimeout(() => {
            // Check if we still don't have series after 2 seconds
            this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).pipe(take(1)).subscribe(currentBracket => {
              if (currentBracket && currentBracket._id === bracket._id && (!currentBracket.series || currentBracket.series.length === 0)) {
                // Check for error
                this.store.select(TournamentsSelectors.selectTournamentsError).pipe(take(1)).subscribe(error => {
                  if (error) {
                    console.error('Error generating matchups:', error);
                    const errorMessage = error?.message || error?.error?.message || '';
                    if (errorMessage.includes('already generated')) {
                      alert('Bracket updated successfully! Matchups were already generated.');
                    } else {
                      alert('Bracket updated, but there was an error generating matchups. You can generate them manually.');
                    }
                    this.viewMode = 'list';
                    this.loadBrackets();
                  }
                });
              }
            });
          }, 2000);
          
          // Clear timeout if matchups are generated successfully
          generateSubscription.add(() => clearTimeout(errorCheckTimeout));
        }
        updateSubscription.unsubscribe();
      });
    } else {
      // Create new bracket
      this.store.dispatch(TournamentsActions.createTournamentBracket({ bracketData }));
      
      // Wait for creation, then generate matchups
      const createSubscription = this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).pipe(
        filter(bracket => bracket !== null && bracket._id !== undefined),
        take(1)
      ).subscribe(bracket => {
        if (bracket && bracket._id) {
          this.existingBracket = bracket;
          const bracketId = bracket._id;
          
          // Generate matchups after creation
          this.store.dispatch(TournamentsActions.generateTournamentMatchups({ bracketId }));
          
          // Wait for matchups to be generated
          const generateSubscription = this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).pipe(
            filter(updatedBracket => 
              updatedBracket !== null && 
              updatedBracket._id === bracketId && 
              updatedBracket.series && 
              updatedBracket.series.length > 0
            ),
            take(1)
          ).subscribe(updatedBracket => {
            alert('Bracket created and matchups generated successfully!');
            this.viewMode = 'list';
            this.loadBrackets();
            generateSubscription.unsubscribe();
          });
          
          // Handle errors from generate matchups - use a timeout to check if matchups weren't generated
          const errorCheckTimeout = setTimeout(() => {
            // Check if we still don't have series after 2 seconds
            this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).pipe(take(1)).subscribe(currentBracket => {
              if (currentBracket && currentBracket._id === bracketId && (!currentBracket.series || currentBracket.series.length === 0)) {
                // Check for error
                this.store.select(TournamentsSelectors.selectTournamentsError).pipe(take(1)).subscribe(error => {
                  if (error) {
                    console.error('Error generating matchups:', error);
                    const errorMessage = error?.message || error?.error?.message || '';
                    if (errorMessage.includes('already generated')) {
                      alert('Bracket created successfully! Matchups were already generated.');
                    } else {
                      alert('Bracket created, but there was an error generating matchups. You can generate them manually.');
                    }
                  } else {
                    // No error but no series - might still be loading
                    console.log('Matchups may still be generating...');
                  }
                });
              }
            });
          }, 2000);
          
          // Clear timeout if matchups are generated successfully
          generateSubscription.add(() => clearTimeout(errorCheckTimeout));
        }
        createSubscription.unsubscribe();
      });
    }
  }

  generateMatchups() {
    if (!this.existingBracket?._id) {
      alert('Please save the bracket first');
      return;
    }

    this.store.dispatch(TournamentsActions.generateTournamentMatchups({ bracketId: this.existingBracket._id }));
    
    const subscription = this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).subscribe(bracket => {
      if (bracket && bracket._id === this.existingBracket._id && bracket.series && bracket.series.length > 0) {
        alert('Matchups generated successfully!');
        this.viewMode = 'list';
        this.loadBrackets();
        subscription.unsubscribe();
      }
    });
  }

  getTournamentName(tournamentId: string): string {
    const tournament = this.tournaments.find(t => t._id === tournamentId);
    return tournament ? tournament.name : 'Unknown';
  }

  loadBrackets() {
    this.bracketsLoading = true;
    // Load all brackets (no status filter)
    this.store.dispatch(TournamentsActions.loadTournamentBrackets({}));
    this.bracketsLoading = false;
  }

  switchToCreateMode() {
    this.viewMode = 'create';
    this.currentStep = 1;
    this.bracketForm.reset();
    this.bracketForm.patchValue({ numTeams: 4 });
    this.onNumTeamsChange();
    this.existingBracket = null;
    this.previewBracket = null;
    this.logoPreview = null;
  }
  
  onLogoFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadingLogo = true;
      
      // Upload the file
      this.api.uploadFile(file).subscribe({
        next: (response: any) => {
          console.log('Logo uploaded:', response);
          const logoUrl = response.url || response.data?.url || response;
          this.bracketForm.patchValue({ logoUrl: logoUrl });
          this.logoPreview = this.imageUrlService.getImageUrl(logoUrl);
          this.uploadingLogo = false;
        },
        error: (error) => {
          console.error('Error uploading logo:', error);
          alert('Logo upload failed. Please try again.');
          this.uploadingLogo = false;
        }
      });
      
      // Show local preview while uploading
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
  
  getImageUrl(logoUrl?: string): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  viewBracket(bracketId: string) {
    this.router.navigate(['/tournaments', bracketId]);
  }

  editBracket(bracket: any) {
    this.viewMode = 'edit';
    this.existingBracket = bracket;
    this.currentStep = 1;
    
    // Load bracket details
    this.store.dispatch(TournamentsActions.loadTournamentBracket({ bracketId: bracket._id }));
    
    // Subscribe to get full bracket details
    this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).pipe(take(1)).subscribe(fullBracket => {
      if (fullBracket) {
        this.existingBracket = fullBracket;
        
        // Handle tournamentId - could be string or populated object
        const tournamentIdValue = typeof fullBracket.tournamentId === 'object' && fullBracket.tournamentId !== null
          ? (fullBracket.tournamentId as any)._id
          : fullBracket.tournamentId;
        
        this.bracketForm.patchValue({
          name: fullBracket.name,
          tournamentId: tournamentIdValue,
          logoUrl: fullBracket.logoUrl || '',
          format: fullBracket.format || 'single-elimination',
          manualMatchups: fullBracket.manualMatchups || false,
          numTeams: fullBracket.numTeams
        });
        
        // Set logo preview if logo exists
        if (fullBracket.logoUrl) {
          this.logoPreview = this.imageUrlService.getImageUrl(fullBracket.logoUrl);
        } else {
          this.logoPreview = null;
        }
        
        this.onTournamentChange();
        this.onNumTeamsChange();
        
        // Populate seedings
        const seedingsArray = this.seedingsArray;
        seedingsArray.clear();
        fullBracket.seedings.forEach((seeding: any) => {
          seedingsArray.push(this.fb.group({
            clubId: [seeding.clubId?._id || seeding.clubId, Validators.required],
            seed: [seeding.seed, [Validators.required, Validators.min(1)]]
          }));
        });
        
        // Populate rounds
        const roundsArray = this.roundsArray;
        roundsArray.clear();
        fullBracket.rounds.forEach((round: any) => {
          roundsArray.push(this.fb.group({
            name: [round.name, Validators.required],
            bestOf: [round.bestOf, [Validators.required, Validators.min(1), Validators.max(7)]],
            order: [round.order, Validators.required]
          }));
        });
        
        // Generate preview for step 4
        this.generatePreview();
      }
    });
  }

  deleteBracket(bracketId: string) {
    if (confirm('Are you sure you want to delete this bracket? This action cannot be undone.')) {
      this.store.dispatch(TournamentsActions.deleteTournamentBracket({ bracketId }));
      // Reload brackets after deletion
      setTimeout(() => this.loadBrackets(), 500);
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'completed': return 'bg-blue-600';
      case 'setup': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  }

  getClubName(clubId: any): string {
    const club = this.clubs.find(c => c._id === (clubId?._id || clubId));
    return club ? club.name : 'Unknown';
  }

  openMatchupEditor(bracket: any, roundOrder: number) {
    this.editingBracket = bracket;
    this.editingRoundOrder = roundOrder;
    
    // Load full bracket details
    this.store.dispatch(TournamentsActions.loadTournamentBracket({ bracketId: bracket._id }));
    
    this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).pipe(take(1)).subscribe(fullBracket => {
      if (fullBracket) {
        this.editingBracket = fullBracket;
        const isPlacementBracket = fullBracket.format === 'placement-bracket';
        
        // Get available teams (winners from previous round or all seedings for round 1)
        if (roundOrder === 1) {
          // Round 1 - use seedings
          this.availableTeams = fullBracket.seedings
            .map((s: any) => ({
              clubId: s.clubId?._id || s.clubId,
              seed: s.seed,
              clubName: this.getClubName(s.clubId?._id || s.clubId)
            }))
            .sort((a: any, b: any) => a.seed - b.seed);
        } else if (isPlacementBracket && (
          (fullBracket.numTeams === 4 && roundOrder === 2) || // Round 2 is final placement for 4 teams
          (fullBracket.numTeams > 4 && roundOrder === 3)     // Round 3 is final placement for 8+ teams
        )) {
          // Final placement round of placement bracket: All teams should be available for final placement
          // Use all seedings to ensure all teams are available, even if there were forfeits
          this.availableTeams = fullBracket.seedings
            .map((s: any) => ({
              clubId: s.clubId?._id || s.clubId,
              seed: s.seed,
              clubName: this.getClubName(s.clubId?._id || s.clubId)
            }))
            .sort((a: any, b: any) => a.seed - b.seed);
        } else {
          // Subsequent rounds - get teams from previous round
          const previousRound = roundOrder - 1;
          const previousRoundSeries = fullBracket.series.filter((s: any) => s.roundOrder === previousRound);
          
          // Helper function to get original seed from bracket seedings
          const getOriginalSeed = (clubId: any): number | null => {
            const clubIdStr = clubId?.toString();
            const seeding = fullBracket.seedings?.find((s: any) => {
              const seedingClubId = s.clubId?._id || s.clubId;
              return seedingClubId?.toString() === clubIdStr;
            });
            return seeding?.seed || null;
          };
          
          // Helper function to add team to available teams if not already present
          const addTeamIfNotPresent = (clubId: any) => {
            const clubIdStr = clubId?.toString();
            const existingTeam = this.availableTeams.find(t => t.clubId.toString() === clubIdStr);
            if (!existingTeam) {
              const originalSeed = getOriginalSeed(clubId);
              if (originalSeed !== null) {
                this.availableTeams.push({
                  clubId: clubId,
                  seed: originalSeed,
                  clubName: this.getClubName(clubId)
                });
              }
            }
          };
          
          this.availableTeams = [];
          previousRoundSeries.forEach((series: any) => {
            if (series.status === 'completed') {
              // For placement brackets, include both winner and loser
              // For single elimination, only include winner
              if (series.winnerClubId) {
                const winnerId = series.winnerClubId?._id || series.winnerClubId;
                addTeamIfNotPresent(winnerId);
              }
              
              // Include loser for placement brackets
              if (isPlacementBracket && series.homeClubId && series.awayClubId) {
                const winnerId = series.winnerClubId?._id || series.winnerClubId;
                const homeId = series.homeClubId?._id || series.homeClubId;
                const awayId = series.awayClubId?._id || series.awayClubId;
                
                // Determine loser (the team that didn't win)
                const loserId = winnerId?.toString() === homeId?.toString() ? awayId : homeId;
                if (loserId) {
                  addTeamIfNotPresent(loserId);
                }
              } else if (isPlacementBracket) {
                // Handle cases where one team might be missing (e.g., forfeit scenarios)
                // Still try to include both teams if they exist
                if (series.homeClubId) {
                  const homeId = series.homeClubId?._id || series.homeClubId;
                  addTeamIfNotPresent(homeId);
                }
                if (series.awayClubId) {
                  const awayId = series.awayClubId?._id || series.awayClubId;
                  addTeamIfNotPresent(awayId);
                }
              }
            } else if (series.status === 'bye' && series.homeClubId) {
              const byeId = series.homeClubId?._id || series.homeClubId;
              addTeamIfNotPresent(byeId);
            } else if (isPlacementBracket && series.status !== 'completed') {
              // For placement brackets, if series is not completed yet, still include both teams
              // This allows setting up round 2 before round 1 is complete
              if (series.homeClubId) {
                addTeamIfNotPresent(series.homeClubId?._id || series.homeClubId);
              }
              if (series.awayClubId) {
                addTeamIfNotPresent(series.awayClubId?._id || series.awayClubId);
              }
            }
          });
          
          // Sort by seed
          this.availableTeams.sort((a: any, b: any) => a.seed - b.seed);
          
          // For placement bracket round 2, separate winners and losers (only for 8+ teams)
          // For 4 teams, round 2 is final placement, not winners/losers bracket
          if (isPlacementBracket && roundOrder === 2 && fullBracket.numTeams > 4) {
            this.availableWinners = [];
            this.availableLosers = [];
            
            previousRoundSeries.forEach((series: any) => {
              if (series.status === 'completed' && series.winnerClubId && series.homeClubId && series.awayClubId) {
                const winnerId = series.winnerClubId?._id || series.winnerClubId;
                const homeId = series.homeClubId?._id || series.homeClubId;
                const awayId = series.awayClubId?._id || series.awayClubId;
                const loserId = winnerId?.toString() === homeId?.toString() ? awayId : homeId;
                
                // Add winner
                const winnerSeed = getOriginalSeed(winnerId);
                if (winnerSeed !== null) {
                  this.availableWinners.push({
                    clubId: winnerId,
                    seed: winnerSeed,
                    clubName: this.getClubName(winnerId)
                  });
                }
                
                // Add loser
                const loserSeed = getOriginalSeed(loserId);
                if (loserSeed !== null) {
                  this.availableLosers.push({
                    clubId: loserId,
                    seed: loserSeed,
                    clubName: this.getClubName(loserId)
                  });
                }
              } else if (series.status === 'bye' && series.homeClubId) {
                // Bye goes to winners bracket
                const byeId = series.homeClubId?._id || series.homeClubId;
                const byeSeed = getOriginalSeed(byeId);
                if (byeSeed !== null) {
                  this.availableWinners.push({
                    clubId: byeId,
                    seed: byeSeed,
                    clubName: this.getClubName(byeId)
                  });
                }
              } else if (series.status !== 'completed' && series.homeClubId && series.awayClubId) {
                // If not completed, add both teams to both brackets (for setup before round 1 completes)
                const homeId = series.homeClubId?._id || series.homeClubId;
                const awayId = series.awayClubId?._id || series.awayClubId;
                const homeSeed = getOriginalSeed(homeId);
                const awaySeed = getOriginalSeed(awayId);
                
                if (homeSeed !== null) {
                  this.availableWinners.push({
                    clubId: homeId,
                    seed: homeSeed,
                    clubName: this.getClubName(homeId)
                  });
                  this.availableLosers.push({
                    clubId: homeId,
                    seed: homeSeed,
                    clubName: this.getClubName(homeId)
                  });
                }
                if (awaySeed !== null) {
                  this.availableWinners.push({
                    clubId: awayId,
                    seed: awaySeed,
                    clubName: this.getClubName(awayId)
                  });
                  this.availableLosers.push({
                    clubId: awayId,
                    seed: awaySeed,
                    clubName: this.getClubName(awayId)
                  });
                }
              }
            });
            
            // Sort by seed
            this.availableWinners.sort((a: any, b: any) => a.seed - b.seed);
            this.availableLosers.sort((a: any, b: any) => a.seed - b.seed);
          } else {
            // Not placement bracket round 2, clear these
            this.availableWinners = [];
            this.availableLosers = [];
          }
        }
        
        // Get current matchups for this round
        const roundSeries = fullBracket.series.filter((s: any) => s.roundOrder === roundOrder);
        
        // For placement bracket round 2, separate winners and losers matchups (only for 8+ teams)
        // For 4 teams, round 2 is final placement, not winners/losers bracket
        if (isPlacementBracket && roundOrder === 2 && this.editingBracket?.numTeams > 4) {
          this.winnersMatchups = [];
          this.losersMatchups = [];
          
          roundSeries.forEach((series: any) => {
            const matchup = {
              _id: series._id,
              homeClubId: series.homeClubId?._id || series.homeClubId,
              awayClubId: series.awayClubId?._id || series.awayClubId,
              homeSeed: series.homeSeed,
              awaySeed: series.awaySeed,
              status: series.status,
              homeWins: series.homeWins || 0,
              awayWins: series.awayWins || 0,
              placementBracketType: series.placementBracketType || 'winners'
            };
            
            if (series.placementBracketType === 'losers') {
              this.losersMatchups.push(matchup);
            } else {
              // Only add to winners if it's explicitly winners or undefined (default to winners)
              // Limit based on number of teams
              const numTeams = this.editingBracket?.numTeams || 8;
              const maxWinnersMatchups = numTeams / 4;
              if (this.winnersMatchups.length < maxWinnersMatchups) {
                this.winnersMatchups.push(matchup);
              }
            }
          });
          
          // Ensure we have the correct number of matchups for winners and losers
          // For 4 teams: 1 winners, 1 losers
          // For 8 teams: 2 winners, 2 losers
          // Formula: numTeams / 4 for each bracket
          const numTeams = this.editingBracket?.numTeams || 8;
          const expectedWinnersMatchups = numTeams / 4;
          const expectedLosersMatchups = numTeams / 4;
          
          // Trim winners if too many
          if (this.winnersMatchups.length > expectedWinnersMatchups) {
            this.winnersMatchups = this.winnersMatchups.slice(0, expectedWinnersMatchups);
          }
          
          // Trim losers if too many
          if (this.losersMatchups.length > expectedLosersMatchups) {
            this.losersMatchups = this.losersMatchups.slice(0, expectedLosersMatchups);
          }
          
          // Add empty matchups if needed
          while (this.winnersMatchups.length < expectedWinnersMatchups) {
            this.winnersMatchups.push({
              homeClubId: '',
              awayClubId: '',
              homeSeed: null,
              awaySeed: null,
              status: 'pending',
              homeWins: 0,
              awayWins: 0,
              placementBracketType: 'winners'
            });
          }
          
          while (this.losersMatchups.length < expectedLosersMatchups) {
            this.losersMatchups.push({
              homeClubId: '',
              awayClubId: '',
              homeSeed: null,
              awaySeed: null,
              status: 'pending',
              homeWins: 0,
              awayWins: 0,
              placementBracketType: 'losers'
            });
          }
          
          // Combine for currentMatchups (for backwards compatibility)
          this.currentMatchups = [...this.winnersMatchups, ...this.losersMatchups];
        } else {
          // Not placement bracket round 2, use standard logic
          this.winnersMatchups = [];
          this.losersMatchups = [];
          this.currentMatchups = roundSeries.map((series: any) => ({
            _id: series._id,
            homeClubId: series.homeClubId?._id || series.homeClubId,
            awayClubId: series.awayClubId?._id || series.awayClubId,
            homeSeed: series.homeSeed,
            awaySeed: series.awaySeed,
            status: series.status,
            homeWins: series.homeWins || 0,
            awayWins: series.awayWins || 0,
            placementBracketType: series.placementBracketType
          }));
          
          // If no matchups exist, create empty ones
          if (this.currentMatchups.length === 0) {
            const numMatchups = Math.ceil(this.availableTeams.length / 2);
            for (let i = 0; i < numMatchups; i++) {
              this.currentMatchups.push({
                homeClubId: '',
                awayClubId: '',
                homeSeed: null,
                awaySeed: null,
                status: 'pending',
                homeWins: 0,
                awayWins: 0
              });
            }
          }
        }
        
        this.matchupEditorOpen = true;
      }
    });
  }

  closeMatchupEditor() {
    this.matchupEditorOpen = false;
    this.editingBracket = null;
    this.editingRoundOrder = null;
    this.availableTeams = [];
    this.availableWinners = [];
    this.availableLosers = [];
    this.currentMatchups = [];
    this.winnersMatchups = [];
    this.losersMatchups = [];
  }

  autoGenerateMatchups() {
    if (!this.editingBracket || this.editingRoundOrder === null) return;
    
    const isPlacementBracket = this.editingBracket.format === 'placement-bracket';
    const isRound2 = this.editingRoundOrder === 2;
    
    if (isPlacementBracket && isRound2) {
      // Generate winners and losers matchups separately
      const generateMatchupsForBracket = (teams: any[], bracketType: string) => {
        const matchups: any[] = [];
        const teamsCopy = [...teams];
        
        while (teamsCopy.length > 0) {
          if (teamsCopy.length === 1) {
            // Bye
            matchups.push({
              homeClubId: teamsCopy[0].clubId,
              homeSeed: teamsCopy[0].seed,
              status: 'bye',
              homeWins: 0,
              awayWins: 0,
              placementBracketType: bracketType
            });
            teamsCopy.shift();
          } else {
            // Matchup: highest vs lowest
            const home = teamsCopy.shift()!;
            const away = teamsCopy.pop()!;
            matchups.push({
              homeClubId: home.clubId,
              awayClubId: away.clubId,
              homeSeed: home.seed,
              awaySeed: away.seed,
              status: 'pending',
              homeWins: 0,
              awayWins: 0,
              placementBracketType: bracketType
            });
          }
        }
        
        return matchups;
      };
      
      this.winnersMatchups = generateMatchupsForBracket(this.availableWinners, 'winners');
      this.losersMatchups = generateMatchupsForBracket(this.availableLosers, 'losers');
      this.currentMatchups = [...this.winnersMatchups, ...this.losersMatchups];
    } else {
      // Standard bracket: highest vs lowest remaining seed
      const teams = [...this.availableTeams];
      const matchups: any[] = [];
      
      while (teams.length > 0) {
        if (teams.length === 1) {
          // Bye
          matchups.push({
            homeClubId: teams[0].clubId,
            homeSeed: teams[0].seed,
            status: 'bye',
            homeWins: 0,
            awayWins: 0
          });
          teams.shift();
        } else {
          // Matchup: highest vs lowest
          const home = teams.shift()!;
          const away = teams.pop()!;
          matchups.push({
            homeClubId: home.clubId,
            awayClubId: away.clubId,
            homeSeed: home.seed,
            awaySeed: away.seed,
            status: 'pending',
            homeWins: 0,
            awayWins: 0
          });
        }
      }
      
      this.currentMatchups = matchups;
    }
  }

  saveMatchups() {
    if (!this.editingBracket || this.editingRoundOrder === null) {
      alert('No bracket or round selected');
      return;
    }
    
    const isPlacementBracket = this.editingBracket.format === 'placement-bracket';
    const isRound2 = this.editingRoundOrder === 2;
    
    // For placement bracket round 2, use winners and losers matchups
    let matchupsToSave: any[] = [];
    if (isPlacementBracket && isRound2) {
      matchupsToSave = [...this.winnersMatchups, ...this.losersMatchups];
      
      // Validate winners bracket
      const winnersTeamIds: string[] = [];
      for (const matchup of this.winnersMatchups) {
        if (matchup.status === 'bye') {
          if (matchup.homeClubId) winnersTeamIds.push(matchup.homeClubId.toString());
        } else {
          if (matchup.homeClubId) winnersTeamIds.push(matchup.homeClubId.toString());
          if (matchup.awayClubId) winnersTeamIds.push(matchup.awayClubId.toString());
        }
      }
      
      // Validate losers bracket
      const losersTeamIds: string[] = [];
      for (const matchup of this.losersMatchups) {
        if (matchup.status === 'bye') {
          if (matchup.homeClubId) losersTeamIds.push(matchup.homeClubId.toString());
        } else {
          if (matchup.homeClubId) losersTeamIds.push(matchup.homeClubId.toString());
          if (matchup.awayClubId) losersTeamIds.push(matchup.awayClubId.toString());
        }
      }
      
      // Check for duplicates within each bracket
      const uniqueWinners = new Set(winnersTeamIds);
      const uniqueLosers = new Set(losersTeamIds);
      
      if (winnersTeamIds.length !== uniqueWinners.size) {
        alert('No team can appear twice in the winners bracket');
        return;
      }
      
      if (losersTeamIds.length !== uniqueLosers.size) {
        alert('No team can appear twice in the losers bracket');
        return;
      }
      
      // Check all available teams are included
      const availableWinnersIds = new Set(this.availableWinners.map(t => t.clubId.toString()));
      const availableLosersIds = new Set(this.availableLosers.map(t => t.clubId.toString()));
      const assignedWinnersIds = new Set(winnersTeamIds);
      const assignedLosersIds = new Set(losersTeamIds);
      
      const missingWinners = Array.from(availableWinnersIds).filter(id => !assignedWinnersIds.has(id));
      const missingLosers = Array.from(availableLosersIds).filter(id => !assignedLosersIds.has(id));
      
      if (missingWinners.length > 0) {
        alert(`All winners must be assigned. Missing ${missingWinners.length} team(s).`);
        return;
      }
      
      if (missingLosers.length > 0) {
        alert(`All losers must be assigned. Missing ${missingLosers.length} team(s).`);
        return;
      }
    } else {
      // Standard validation
      matchupsToSave = this.currentMatchups;
      
      const allTeamIds: string[] = [];
      for (const matchup of matchupsToSave) {
        if (matchup.status === 'bye') {
          if (matchup.homeClubId) {
            allTeamIds.push(matchup.homeClubId.toString());
          }
        } else {
          if (matchup.homeClubId) allTeamIds.push(matchup.homeClubId.toString());
          if (matchup.awayClubId) allTeamIds.push(matchup.awayClubId.toString());
        }
      }
      
      const uniqueTeamIds = new Set(allTeamIds);
      if (allTeamIds.length !== uniqueTeamIds.size) {
        alert('No team can appear twice in the same round');
        return;
      }
      
      // Check all available teams are included
      const availableTeamIds = new Set(this.availableTeams.map(t => t.clubId.toString()));
      const assignedTeamIds = new Set(allTeamIds);
      const missingTeams = Array.from(availableTeamIds).filter(id => !assignedTeamIds.has(id));
      
      if (missingTeams.length > 0) {
        alert(`All teams must be assigned. Missing ${missingTeams.length} team(s).`);
        return;
      }
    }
    
    // Clean up matchups - remove empty strings, convert to null/undefined
    const cleanedMatchups = matchupsToSave.map(matchup => ({
      ...matchup,
      homeClubId: matchup.homeClubId && matchup.homeClubId !== '' ? matchup.homeClubId : undefined,
      awayClubId: matchup.awayClubId && matchup.awayClubId !== '' ? matchup.awayClubId : undefined,
      homeSeed: matchup.homeSeed || null,
      awaySeed: matchup.awaySeed || null
    }));
    
    console.log('Saving matchups:', cleanedMatchups);
    console.log('Bracket ID:', this.editingBracket._id);
    console.log('Round Order:', this.editingRoundOrder);
    
    // Dispatch action to update matchups
    this.store.dispatch(TournamentsActions.updateTournamentRoundMatchups({
      bracketId: this.editingBracket._id,
      roundOrder: this.editingRoundOrder!,
      matchups: cleanedMatchups
    }));
    
    // Subscribe to success or error
    let successReceived = false;
    let subscription: any;
    let errorSubscription: any;
    
    // Subscribe to errors first (before dispatch completes)
    errorSubscription = this.store.select(TournamentsSelectors.selectTournamentsError).subscribe(error => {
      if (error && !successReceived) {
        console.error('Error updating matchups:', error);
        // Handle different error formats
        let errorMessage = 'Unknown error';
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (error?.error) {
          errorMessage = String(error.error);
        }
        alert('Error updating matchups: ' + errorMessage);
        successReceived = true; // Prevent duplicate alerts
        if (subscription) subscription.unsubscribe();
        if (errorSubscription) errorSubscription.unsubscribe();
      }
    });
    
    subscription = this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).subscribe(bracket => {
      if (bracket && bracket._id === this.editingBracket._id && !successReceived) {
        // Small delay to ensure this isn't from a previous update
        setTimeout(() => {
          if (!successReceived) {
            successReceived = true;
            alert('Matchups updated successfully!');
            this.closeMatchupEditor();
            this.loadBrackets();
            if (subscription) subscription.unsubscribe();
            if (errorSubscription) errorSubscription.unsubscribe();
          }
        }, 100);
      }
    });
    
    // Set timeout to check if update didn't complete
    setTimeout(() => {
      if (!successReceived) {
        if (subscription) subscription.unsubscribe();
        if (errorSubscription) errorSubscription.unsubscribe();
        // Check if there's an error
        this.store.select(TournamentsSelectors.selectTournamentsError).pipe(take(1)).subscribe(error => {
          if (error) {
            alert('Error updating matchups: ' + (error.message || error.error?.message || 'Unknown error'));
          } else {
            alert('Update may still be processing. Please check the bracket to confirm.');
          }
        });
      }
    }, 5000);
  }

  canEditRound(bracket: any, roundOrder: number): boolean {
    if (roundOrder === 1) {
      // Round 1 can always be edited if bracket has seedings
      return bracket.seedings && bracket.seedings.length > 0;
    } else {
      // Subsequent rounds can be edited if previous round has completed series
      const previousRound = roundOrder - 1;
      const previousRoundSeries = bracket.series?.filter((s: any) => s.roundOrder === previousRound) || [];
      return previousRoundSeries.some((s: any) => s.status === 'completed' || s.status === 'bye');
    }
  }

  updateMatchupSeed(matchup: any, side: 'home' | 'away') {
    const clubId = side === 'home' ? matchup.homeClubId : matchup.awayClubId;
    if (clubId) {
      // For placement bracket round 2, check winners or losers based on bracket type
      let team;
      if (this.editingBracket?.format === 'placement-bracket' && this.editingRoundOrder === 2) {
        if (matchup.placementBracketType === 'losers') {
          team = this.availableLosers.find(t => t.clubId.toString() === clubId.toString());
        } else {
          team = this.availableWinners.find(t => t.clubId.toString() === clubId.toString());
        }
      } else {
        team = this.availableTeams.find(t => t.clubId.toString() === clubId.toString());
      }
      
      if (team) {
        if (side === 'home') {
          matchup.homeSeed = team.seed;
        } else {
          matchup.awaySeed = team.seed;
        }
      }
    }
  }

  getPlacementMatchLabel(placementMatch: number): string {
    if (placementMatch === undefined || placementMatch === null || placementMatch < 0) {
      return '';
    }
    
    // Get number of teams from editing bracket to determine labels
    const numTeams = this.editingBracket?.numTeams || 8;
    const numPlacementMatches = numTeams / 2;
    
    if (placementMatch >= numPlacementMatches) {
      return '';
    }
    
    // Generate labels dynamically based on number of teams
    // For 4 teams: 0=1st/2nd, 1=3rd/4th
    // For 8 teams: 0=1st/2nd, 1=3rd/4th, 2=5th/6th, 3=7th/8th
    const labels: string[] = [];
    for (let i = 0; i < numPlacementMatches; i++) {
      if (i === 0) {
        labels.push('Championship');
      } else {
        const lowerPlace = i * 2 + 1;
        const upperPlace = (i + 1) * 2;
        labels.push(`${lowerPlace}${this.getOrdinalSuffix(lowerPlace)}/${upperPlace}${this.getOrdinalSuffix(upperPlace)} Place`);
      }
    }
    
    return labels[placementMatch] || '';
  }
  
  private getOrdinalSuffix(n: number): string {
    const j = n % 10;
    const k = n % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }
}

