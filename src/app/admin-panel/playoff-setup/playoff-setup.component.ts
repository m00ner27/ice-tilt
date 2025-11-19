import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { forkJoin } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ApiService } from '../../store/services/api.service';
import { ImageUrlService } from '../../shared/services/image-url.service';
import * as PlayoffsActions from '../../store/playoffs/playoffs.actions';
import * as PlayoffsSelectors from '../../store/playoffs/playoffs.selectors';

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
  logoUrl?: string;
  seasons?: any[];
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
  selector: 'app-playoff-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './playoff-setup.component.html',
  styleUrl: './playoff-setup.component.css'
})
export class PlayoffSetupComponent implements OnInit {
  seasons: Season[] = [];
  divisions: Division[] = [];
  clubs: Club[] = [];
  filteredDivisions: Division[] = [];
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

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private store: Store<AppState>,
    private imageUrlService: ImageUrlService
  ) {
    this.bracketForm = this.fb.group({
      name: ['', Validators.required],
      seasonId: ['', Validators.required],
      divisionId: [''],
      logoUrl: [''],
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
    this.store.select(PlayoffsSelectors.selectAllPlayoffBrackets).subscribe(brackets => {
      this.brackets = brackets || [];
    });
  }

  loadAllData() {
    forkJoin({
      seasons: this.api.getSeasons(),
      divisions: this.api.getDivisions(),
      clubs: this.api.getClubs()
    }).subscribe({
      next: (data) => {
        this.seasons = data.seasons || [];
        this.divisions = (data.divisions || []).sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
        this.clubs = (data.clubs || []).sort((a, b) => a.name.localeCompare(b.name));
        this.dataLoaded = true;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.dataLoaded = true;
      }
    });
  }

  onSeasonChange() {
    const seasonId = this.bracketForm.get('seasonId')?.value;
    if (seasonId) {
      this.filteredDivisions = this.divisions.filter(div => div.seasonId === seasonId);
      // Filter clubs for this season
      this.filterClubsForSeason(seasonId);
    } else {
      this.filteredDivisions = [];
      this.filteredClubs = [];
    }
  }

  onDivisionChange() {
    const seasonId = this.bracketForm.get('seasonId')?.value;
    const divisionId = this.bracketForm.get('divisionId')?.value;
    if (seasonId && divisionId) {
      this.filterClubsForSeasonAndDivision(seasonId, divisionId);
    } else if (seasonId) {
      this.filterClubsForSeason(seasonId);
    }
  }

  filterClubsForSeason(seasonId: string) {
    this.filteredClubs = this.clubs.filter(club => {
      return club.seasons && club.seasons.some((season: any) => {
        const isInSeason = (typeof season.seasonId === 'object' && season.seasonId._id === seasonId) ||
                          (typeof season.seasonId === 'string' && season.seasonId === seasonId);
        return isInSeason;
      });
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  filterClubsForSeasonAndDivision(seasonId: string, divisionId: string) {
    this.filteredClubs = this.clubs.filter(club => {
      return club.seasons && club.seasons.some((season: any) => {
        const isInSeason = (typeof season.seasonId === 'object' && season.seasonId._id === seasonId) ||
                          (typeof season.seasonId === 'string' && season.seasonId === seasonId);
        if (!isInSeason) return false;
        
        return season.divisionIds && season.divisionIds.some((divId: any) => {
          return (typeof divId === 'object' && divId._id === divisionId) ||
                 (typeof divId === 'string' && divId === divisionId);
        });
      });
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  onNumTeamsChange() {
    const numTeams = this.bracketForm.get('numTeams')?.value || 8;
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
    const numRounds = Math.ceil(Math.log2(numTeams));
    const roundsArray = this.bracketForm.get('rounds') as FormArray;
    
    // Clear existing rounds
    while (roundsArray.length > 0) {
      roundsArray.removeAt(0);
    }
    
    // Create rounds
    const roundNames = ['Finals', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32'];
    for (let i = 0; i < numRounds; i++) {
      const roundOrder = numRounds - i;
      const roundName = roundNames[Math.min(i, roundNames.length - 1)] || `Round ${roundOrder}`;
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
      if (!this.bracketForm.get('name')?.valid || !this.bracketForm.get('seasonId')?.valid || !this.bracketForm.get('numTeams')?.valid) {
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
    const numRounds = Math.ceil(Math.log2(formValue.numTeams));
    
    this.previewBracket = {
      name: formValue.name,
      seasonId: formValue.seasonId,
      divisionId: formValue.divisionId,
      logoUrl: formValue.logoUrl,
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
    const numRounds = Math.ceil(Math.log2(formValue.numTeams));
    
    const bracketData: Partial<PlayoffsActions.PlayoffBracket> = {
      name: formValue.name,
      seasonId: formValue.seasonId,
      divisionId: formValue.divisionId || undefined,
      logoUrl: formValue.logoUrl || undefined,
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
      this.store.dispatch(PlayoffsActions.updatePlayoffBracket({ 
        bracketId: this.existingBracket._id, 
        bracketData 
      }));
      
      const subscription = this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket).subscribe(bracket => {
        if (bracket && bracket._id === this.existingBracket._id) {
          alert('Bracket updated successfully!');
          this.viewMode = 'list';
          this.loadBrackets();
          subscription.unsubscribe();
        }
      });
    } else {
      // Create new bracket
      this.store.dispatch(PlayoffsActions.createPlayoffBracket({ bracketData }));
      
      // Subscribe to the result
      const subscription = this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket).subscribe(bracket => {
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
    const numRounds = Math.ceil(Math.log2(formValue.numTeams));
    
    const bracketData: Partial<PlayoffsActions.PlayoffBracket> = {
      name: formValue.name,
      seasonId: formValue.seasonId,
      divisionId: formValue.divisionId || undefined,
      logoUrl: formValue.logoUrl || undefined,
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
      this.store.dispatch(PlayoffsActions.updatePlayoffBracket({ 
        bracketId: this.existingBracket._id, 
        bracketData 
      }));
      
      // Wait for update, then generate matchups
      const updateSubscription = this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket).subscribe(bracket => {
        if (bracket && bracket._id === this.existingBracket._id && bracket._id) {
          this.existingBracket = bracket;
          updateSubscription.unsubscribe();
          
          // Generate matchups after update
          this.store.dispatch(PlayoffsActions.generatePlayoffMatchups({ bracketId: bracket._id }));
          
          const generateSubscription = this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket).subscribe(updatedBracket => {
            if (updatedBracket && updatedBracket._id === bracket._id && updatedBracket.series && updatedBracket.series.length > 0) {
              alert('Bracket updated and matchups generated successfully!');
              this.viewMode = 'list';
              this.loadBrackets();
              generateSubscription.unsubscribe();
            }
          });
        }
      });
    } else {
      // Create new bracket
      this.store.dispatch(PlayoffsActions.createPlayoffBracket({ bracketData }));
      
      // Wait for creation, then generate matchups
      const createSubscription = this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket).subscribe(bracket => {
        if (bracket && bracket._id) {
          this.existingBracket = bracket;
          const bracketId = bracket._id;
          createSubscription.unsubscribe();
          
          // Generate matchups after creation
          this.store.dispatch(PlayoffsActions.generatePlayoffMatchups({ bracketId }));
          
          const generateSubscription = this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket).subscribe(updatedBracket => {
            if (updatedBracket && updatedBracket._id === bracket._id && updatedBracket.series && updatedBracket.series.length > 0) {
              alert('Bracket created and matchups generated successfully!');
              this.viewMode = 'list';
              this.loadBrackets();
              generateSubscription.unsubscribe();
            }
          });
        }
      });
    }
  }

  generateMatchups() {
    if (!this.existingBracket?._id) {
      alert('Please save the bracket first');
      return;
    }

    this.store.dispatch(PlayoffsActions.generatePlayoffMatchups({ bracketId: this.existingBracket._id }));
    
    const subscription = this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket).subscribe(bracket => {
      if (bracket && bracket._id === this.existingBracket._id && bracket.series && bracket.series.length > 0) {
        alert('Matchups generated successfully!');
        this.viewMode = 'list';
        this.loadBrackets();
        subscription.unsubscribe();
      }
    });
  }

  getSeasonName(seasonId: string): string {
    const season = this.seasons.find(s => s._id === seasonId);
    return season ? season.name : 'Unknown';
  }

  loadBrackets() {
    this.bracketsLoading = true;
    // Load all brackets (no status filter)
    this.store.dispatch(PlayoffsActions.loadPlayoffBrackets({}));
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
    this.router.navigate(['/playoffs', bracketId]);
  }

  editBracket(bracket: any) {
    this.viewMode = 'edit';
    this.existingBracket = bracket;
    this.currentStep = 1; // Start at step 1 for better UX
    
    // Load bracket details
    this.store.dispatch(PlayoffsActions.loadPlayoffBracket({ bracketId: bracket._id }));
    
    // Subscribe to get full bracket details
    this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket).pipe(take(1)).subscribe(fullBracket => {
      if (fullBracket) {
        this.existingBracket = fullBracket;
        
        // Handle seasonId - could be string or populated object
        const seasonIdValue = typeof fullBracket.seasonId === 'object' && fullBracket.seasonId !== null
          ? (fullBracket.seasonId as any)._id
          : fullBracket.seasonId;
        
        // Handle divisionId - could be string, populated object, or undefined
        const divisionIdValue = fullBracket.divisionId
          ? (typeof fullBracket.divisionId === 'object' && fullBracket.divisionId !== null
              ? (fullBracket.divisionId as any)._id
              : fullBracket.divisionId)
          : '';
        
        this.bracketForm.patchValue({
          name: fullBracket.name,
          seasonId: seasonIdValue,
          divisionId: divisionIdValue,
          logoUrl: fullBracket.logoUrl || '',
          numTeams: fullBracket.numTeams
        });
        
        // Set logo preview if logo exists
        if (fullBracket.logoUrl) {
          this.logoPreview = this.imageUrlService.getImageUrl(fullBracket.logoUrl);
        } else {
          this.logoPreview = null;
        }
        
        this.onSeasonChange();
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
      this.store.dispatch(PlayoffsActions.deletePlayoffBracket({ bracketId }));
      // Reload brackets after deletion
      setTimeout(() => this.loadBrackets(), 500);
    }
  }

  getDivisionName(divisionId: any): string {
    if (!divisionId) return 'All Divisions';
    const div = this.divisions.find(d => d._id === (divisionId._id || divisionId));
    return div ? div.name : 'Unknown';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'completed': return 'bg-blue-600';
      case 'setup': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  }

  // Matchup Editor Methods
  openMatchupEditor(bracket: any, roundOrder: number) {
    this.editingBracket = bracket;
    this.editingRoundOrder = roundOrder;
    
    // Load full bracket details
    this.store.dispatch(PlayoffsActions.loadPlayoffBracket({ bracketId: bracket._id }));
    
    this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket).pipe(take(1)).subscribe(fullBracket => {
      if (fullBracket) {
        this.editingBracket = fullBracket;
        
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
        } else {
          // Subsequent rounds - get winners from previous round
          const previousRound = roundOrder - 1;
          const previousRoundSeries = fullBracket.series.filter((s: any) => s.roundOrder === previousRound);
          
          this.availableTeams = [];
          previousRoundSeries.forEach((series: any) => {
            if (series.status === 'completed' && series.winnerClubId) {
              const winnerId = series.winnerClubId?._id || series.winnerClubId;
              const winnerSeed = series.homeClubId?.toString() === winnerId?.toString() 
                ? series.homeSeed 
                : series.awaySeed;
              this.availableTeams.push({
                clubId: winnerId,
                seed: winnerSeed,
                clubName: this.getClubName(winnerId)
              });
            } else if (series.status === 'bye' && series.homeClubId) {
              const byeId = series.homeClubId?._id || series.homeClubId;
              this.availableTeams.push({
                clubId: byeId,
                seed: series.homeSeed,
                clubName: this.getClubName(byeId)
              });
            }
          });
          
          // Sort by seed
          this.availableTeams.sort((a: any, b: any) => a.seed - b.seed);
        }
        
        // Get current matchups for this round
        const roundSeries = fullBracket.series.filter((s: any) => s.roundOrder === roundOrder);
        this.currentMatchups = roundSeries.map((series: any) => ({
          _id: series._id,
          homeClubId: series.homeClubId?._id || series.homeClubId,
          awayClubId: series.awayClubId?._id || series.awayClubId,
          homeSeed: series.homeSeed,
          awaySeed: series.awaySeed,
          status: series.status,
          homeWins: series.homeWins || 0,
          awayWins: series.awayWins || 0
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
        
        this.matchupEditorOpen = true;
      }
    });
  }

  closeMatchupEditor() {
    this.matchupEditorOpen = false;
    this.editingBracket = null;
    this.editingRoundOrder = null;
    this.availableTeams = [];
    this.currentMatchups = [];
  }

  getClubName(clubId: any): string {
    const club = this.clubs.find(c => c._id === (clubId?._id || clubId));
    return club ? club.name : 'Unknown';
  }

  autoGenerateMatchups() {
    if (!this.editingBracket || this.editingRoundOrder === null) return;
    
    const teams = [...this.availableTeams];
    const matchups: any[] = [];
    
    // Standard bracket: highest vs lowest remaining seed
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

  saveMatchups() {
    if (!this.editingBracket || this.editingRoundOrder === null) {
      alert('No bracket or round selected');
      return;
    }
    
    // Validate all teams are assigned
    const allTeamIds: string[] = [];
    for (const matchup of this.currentMatchups) {
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
    
    // Dispatch action to update matchups
    this.store.dispatch(PlayoffsActions.updateRoundMatchups({
      bracketId: this.editingBracket._id,
      roundOrder: this.editingRoundOrder!,
      matchups: this.currentMatchups
    }));
    
    // Subscribe to success
    const subscription = this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket).subscribe(bracket => {
      if (bracket && bracket._id === this.editingBracket._id) {
        alert('Matchups updated successfully!');
        this.closeMatchupEditor();
        this.loadBrackets();
        subscription.unsubscribe();
      }
    });
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
      const team = this.availableTeams.find(t => t.clubId.toString() === clubId.toString());
      if (team) {
        if (side === 'home') {
          matchup.homeSeed = team.seed;
        } else {
          matchup.awaySeed = team.seed;
        }
      }
    }
  }
}

