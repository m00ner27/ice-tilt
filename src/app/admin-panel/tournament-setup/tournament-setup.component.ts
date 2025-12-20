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
  currentMatchups: any[] = [];
  
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
      numTeams: [8, [Validators.required, Validators.min(2)]],
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
      // Placement bracket requires exactly 8 teams
      this.bracketForm.patchValue({ numTeams: 8 });
      this.onNumTeamsChange();
    }
  }

  onNumTeamsChange() {
    const numTeams = this.bracketForm.get('numTeams')?.value || 8;
    const format = this.bracketForm.get('format')?.value;
    
    // Validate placement bracket requires 8 teams
    if (format === 'placement-bracket' && numTeams !== 8) {
      alert('Placement bracket format requires exactly 8 teams');
      this.bracketForm.patchValue({ numTeams: 8 });
      return;
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
    const numTeams = this.bracketForm.get('numTeams')?.value || 8;
    const format = this.bracketForm.get('format')?.value;
    const roundsArray = this.bracketForm.get('rounds') as FormArray;
    
    // Clear existing rounds
    while (roundsArray.length > 0) {
      roundsArray.removeAt(0);
    }
    
    let numRounds: number;
    let roundNames: string[];
    
    if (format === 'placement-bracket') {
      // Placement bracket always has 3 rounds
      numRounds = 3;
      roundNames = ['Initial Matchups', 'Winners/Losers Bracket', 'Final Placement'];
    } else {
      // Single elimination: log2 of teams
      numRounds = Math.ceil(Math.log2(numTeams));
      roundNames = ['Finals', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32'];
    }
    
    // Create rounds
    for (let i = 0; i < numRounds; i++) {
      const roundOrder = numRounds - i;
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
    const seeds = seedings.map((s: Seeding) => s.seed).filter((s: number) => s);
    const uniqueSeeds = new Set(seeds);
    
    if (seeds.length !== uniqueSeeds.size) {
      alert('Each seed number must be unique!');
      return false;
    }
    
    const numTeams = this.bracketForm.get('numTeams')?.value;
    if (seeds.length !== numTeams) {
      alert(`Please assign all ${numTeams} teams!`);
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
    const numRounds = format === 'placement-bracket' ? 3 : Math.ceil(Math.log2(formValue.numTeams));
    
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
    if (!this.bracketForm.valid || !this.validateSeedings()) {
      alert('Please fix all errors before saving');
      return;
    }

    const formValue = this.bracketForm.value;
    const format = formValue.format || 'single-elimination';
    const numRounds = format === 'placement-bracket' ? 3 : Math.ceil(Math.log2(formValue.numTeams));
    
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
    if (!this.bracketForm.valid || !this.validateSeedings()) {
      alert('Please fix all errors before saving');
      return;
    }

    // First save the bracket
    const formValue = this.bracketForm.value;
    const format = formValue.format || 'single-elimination';
    const numRounds = format === 'placement-bracket' ? 3 : Math.ceil(Math.log2(formValue.numTeams));
    
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
    this.bracketForm.patchValue({ numTeams: 8 });
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
}

