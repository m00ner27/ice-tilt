import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { EashlService } from '../../services/eashl.service';
import { TransactionsService } from '../../store/services/transactions.service';
import { RosterUpdateService } from '../../store/services/roster-update.service';
import { ImageUrlService } from '../../shared/services/image-url.service';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from '../../../environments/environment';
import { REGIONS } from '../../shared';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { selectFreeAgents, selectFreeAgentsForSeason, selectAdminLoading, selectAdminError } from '../../store/players.selectors';
import { loadFreeAgents, loadFreeAgentsForSeason } from '../../store/players.actions';

interface Club {
  _id?: string;
  name: string;
  logoUrl: string;
  primaryColour: string;
  seasons: any[];
  roster?: Player[];
  region: string;
  eashlClubId: string;
}

interface Division {
  _id?: string;
  name: string;
  seasonId: string;
  order?: number;
}

interface Player {
  _id: string;
  gamertag: string;
  discordId?: string;
  discordUsername?: string;
  platform: string;
  position: string;
  status: string;
  playerProfile?: {
    position?: string;
    status?: string;
    handedness?: string;
    location?: string;
    region?: string;
  };
}

interface Season {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-clubs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './clubs.component.html'
})
export class ClubsComponent implements OnInit, OnDestroy {
  clubs: Club[] = [];
  selectedClub: Club | null = null;
  isAddingClub = false;
  editingClub: Club | null = null;
  seasons: Season[] = [];
  divisions: Division[] = [];
  freeAgents$: any;
  adminLoading$: any;
  adminError$: any;
  
  // Local state for free agents
  freeAgents: Player[] = [];
  seasonFreeAgents: Player[] = [];
  private seasonFreeAgentsSubscription?: Subscription;
  clubForm: FormGroup;
  logoPreview: string | ArrayBuffer | null = null;
  uploadingLogo = false;
  selectedSeasonId: string | null = null;
  private rosterUpdateSubscription: Subscription | undefined;
  regions: any[] = []; // Change from string[] to any[] to store full region objects
  regionOptions: string[] = []; // Keep this for the dropdown display
  
  // Roster data for filtering
  private allRostersLoaded = false;
  private rosterLoadingPromises: Promise<any>[] = [];
  
  // Free agents search and filtering
  freeAgentSearchTerm: string = '';
  freeAgentPlatformFilter: string = 'all';
  freeAgentSortBy: string = 'gamertag';
  freeAgentSortOrder: 'asc' | 'desc' = 'asc';
  currentFreeAgentPage: number = 1;
  freeAgentsPerPage: number = 20;
  
  // Expose Math for template use
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private eashlService: EashlService,
    private transactionsService: TransactionsService,
    private rosterUpdateService: RosterUpdateService,
    private imageUrlService: ImageUrlService,
    private auth: AuthService,
    private store: Store<AppState>
  ) {
    // Initialize store selectors
    this.freeAgents$ = this.store.select(selectFreeAgents);
    this.adminLoading$ = this.store.select(selectAdminLoading);
    this.adminError$ = this.store.select(selectAdminError);
    this.clubForm = this.fb.group({
      name: ['', Validators.required],
      logo: [''],
      color: ['#ffffff', Validators.required],
      region: ['', Validators.required],
      eashlClubId: ['']
    });

  }

  get divisionsForSelectedSeason(): Division[] {
    const selectedSeasonId = this.selectedSeasonId;
    return this.divisions.filter(d => d.seasonId === selectedSeasonId);
  }

  getSelectedSeasonName(): string {
    if (!this.selectedSeasonId) return '';
    const season = this.seasons.find(s => s._id === this.selectedSeasonId);
    return season ? season.name : '';
  }

  get filteredRoster(): Player[] {
    const filtered = (this.selectedClub?.roster || []).filter(p => !!p && p.gamertag);
    return filtered;
  }

  get availableFreeAgents(): Player[] {
    // Use season-specific free agents if available, otherwise fallback to general free agents
    const freeAgentsToUse = this.seasonFreeAgents.length > 0 ? this.seasonFreeAgents : this.freeAgents;
    const seasonId = this.selectedSeasonId;
    
    if (!freeAgentsToUse || freeAgentsToUse.length === 0) {
      return [];
    }
    
    // Get player IDs that are already on ANY club's roster for this season
    const allRosterPlayerIds = this.clubs
      .filter(club => club.roster && club.roster.length > 0)
      .flatMap(club => club.roster!)
      .filter(p => p && p._id)
      .map(p => p._id);
    
    // Filter out players who are already on ANY club's roster
    let filtered = freeAgentsToUse.filter(player => 
      !allRosterPlayerIds.includes(player._id)
    );
    
    // Apply search filter
    if (this.freeAgentSearchTerm.trim()) {
      const searchTerm = this.freeAgentSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(player => 
        player.gamertag?.toLowerCase().includes(searchTerm) ||
        player.discordUsername?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply platform filter
    if (this.freeAgentPlatformFilter !== 'all') {
      filtered = filtered.filter(player => player.platform === this.freeAgentPlatformFilter);
    }
    
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.freeAgentSortBy) {
        case 'gamertag':
          aValue = a.gamertag || '';
          bValue = b.gamertag || '';
          break;
        case 'platform':
          aValue = a.platform || '';
          bValue = b.platform || '';
          break;
        default:
          aValue = a.gamertag || '';
          bValue = b.gamertag || '';
      }
      
      if (aValue < bValue) return this.freeAgentSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.freeAgentSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }
  
  get paginatedFreeAgents(): Player[] {
    const startIndex = (this.currentFreeAgentPage - 1) * this.freeAgentsPerPage;
    const endIndex = startIndex + this.freeAgentsPerPage;
    return this.availableFreeAgents.slice(startIndex, endIndex);
  }
  
  get totalFreeAgentPages(): number {
    return Math.ceil(this.availableFreeAgents.length / this.freeAgentsPerPage);
  }
  
  get freeAgentPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalFreeAgentPages; i++) {
      pages.push(i);
    }
    return pages;
  }


  ngOnInit(): void {
    this.loadData();

    // Subscribe to free agents
    this.freeAgents$.subscribe((agents: Player[]) => {
      this.freeAgents = agents || [];
    });
    
    // Also load general free agents to ensure we have some data
    this.store.dispatch(loadFreeAgents());
    
    // Subscribe to season-specific free agents when season changes
    this.clubForm.get('seasons')?.valueChanges.subscribe(() => {
      this.updateSeasonFreeAgents();
      this.updateFreeAgentsList();
    });

    // Load regions from API
    this.api.getRegions().subscribe(list => {
      this.regions = list || [];
      this.regionOptions = this.regions.map((r: any) => r.name || r.key);
    });
    
    // Subscribe to roster updates to refresh data when needed
    this.rosterUpdateSubscription = this.rosterUpdateService.rosterUpdates$.subscribe(event => {
      if (event.action === 'sign' && event.clubId && event.seasonId) {
        // Refresh the club data if it's the currently selected club
        if (this.selectedClub && this.selectedClub._id === event.clubId) {
          this.viewClubDetails(this.selectedClub);
        }
        // Also refresh the free agents list for the current season
        this.updateFreeAgentsList();
        this.updateSeasonFreeAgents();
      }
    });
    
    // Initialize season-specific free agents if a season is already selected
    if (this.selectedSeasonId) {
      this.updateSeasonFreeAgents();
    }
  }

  loadData(): void {
    this.api.getSeasons().subscribe({
      next: (seasons) => {
        this.seasons = seasons || [];
        
        // Load all divisions for all seasons
        this.api.getDivisions().subscribe({
          next: (divisions) => {
            this.divisions = (divisions || []).sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
            
            // Add season controls to form after seasons are loaded
            this.addSeasonControls();
          },
          error: (error) => {
            console.error('Error loading divisions:', error);
            this.divisions = [];
            this.addSeasonControls();
          }
        });
        
        // Auto-select the first season by default
        if (this.seasons.length > 0) {
          this.selectedSeasonId = this.seasons[0]._id;
          // Load clubs for the first season
          this.loadClubsForSeason(this.seasons[0]._id);
          // Load free agents for the first season
          this.loadFreeAgentsForSeason(this.seasons[0]._id);
        }
      },
      error: (error) => {
        console.error('Error loading seasons:', error);
        this.seasons = [];
      }
    });
  }

  private loadClubsForSeason(seasonId: string): void {
    // Clear cache first to ensure fresh data
    this.api.invalidateClubsCache();
    
    // Load all clubs and filter by season
    // Use a direct HTTP call to bypass cache if needed
    this.api.getClubs().subscribe({
      next: (allClubs) => {
        // Filter clubs that are active in this season
        this.clubs = (allClubs || []).filter(club => 
          club.seasons && club.seasons.some((season: any) => {
            // Handle both object and string seasonId formats
            if (typeof season.seasonId === 'object' && season.seasonId._id) {
              return season.seasonId._id === seasonId;
            } else if (typeof season.seasonId === 'string') {
              return season.seasonId === seasonId;
            }
            return false;
          })
        ).sort((a, b) => a.name.localeCompare(b.name));

        // Load all rosters for proper filtering
        this.loadAllRostersForFiltering(seasonId);
      },
      error: (error) => {
        console.error('Error loading clubs for season:', error);
        this.clubs = [];
      }
    });
  }

  private loadAllRostersForFiltering(seasonId: string): void {
    this.allRostersLoaded = false;
    this.rosterLoadingPromises = [];
    
    // Load rosters for all clubs
    this.clubs.forEach(club => {
      if (club._id) {
        const rosterPromise = this.api.getClubRoster(club._id, seasonId).toPromise().then(roster => {
          // Map roster data to Player objects
          const mappedRoster = (roster || []).map((player: any): Player => ({
            _id: player._id,
            gamertag: player.gamertag || player.discordUsername || 'Unknown',
            discordId: player.discordId,
            discordUsername: player.discordUsername,
            platform: player.platform || 'PS5',
            position: player.playerProfile?.position || 'C',
            status: player.playerProfile?.status || 'Signed',
            playerProfile: player.playerProfile
          }));
          
          // Update the club's roster in the clubs array
          const clubIndex = this.clubs.findIndex(c => c._id === club._id);
          if (clubIndex > -1) {
            this.clubs[clubIndex] = { ...this.clubs[clubIndex], roster: mappedRoster };
          }
          
          return mappedRoster;
        }).catch(error => {
          console.error(`Error fetching roster for club ${club.name}:`, error);
          return [];
        });
        
        this.rosterLoadingPromises.push(rosterPromise);
      }
    });
    
    // Wait for all rosters to load
    Promise.all(this.rosterLoadingPromises).then(() => {
      this.allRostersLoaded = true;
    });
  }

  private loadFreeAgentsForSeason(seasonId: string): void {
    // Load season-specific free agents using Player state
    this.store.dispatch(loadFreeAgentsForSeason({ seasonId }));
  }

  private updateSeasonFreeAgents(): void {
    // Unsubscribe from previous subscription
    if (this.seasonFreeAgentsSubscription) {
      this.seasonFreeAgentsSubscription.unsubscribe();
    }
    
    const seasonId = this.selectedSeasonId;
    
    if (seasonId) {
      this.seasonFreeAgentsSubscription = this.store.select(selectFreeAgentsForSeason(seasonId)).subscribe((agents: Player[]) => {
        this.seasonFreeAgents = agents || [];
      });
    } else {
      this.seasonFreeAgents = [];
    }
  }

  private updateFreeAgentsList(): void {
    // Get the current season from the form
    const selectedSeasonId = this.selectedSeasonId;
    
    if (selectedSeasonId) {
      // Refresh season-specific free agents
      this.loadFreeAgentsForSeason(selectedSeasonId);
      
      // Reload all rosters to ensure proper filtering
      this.loadAllRostersForFiltering(selectedSeasonId);
    }
    
    // Refresh the selected club's roster if one is selected
    if (this.selectedClub && this.selectedClub._id && selectedSeasonId) {
      this.api.getClubRoster(this.selectedClub._id, selectedSeasonId).subscribe(roster => {
        const mappedRoster = roster.map((player: any): Player => ({
          _id: player._id,
          gamertag: player.gamertag || player.discordUsername || 'Unknown',
          discordId: player.discordId,
          discordUsername: player.discordUsername,
          platform: player.platform || 'PS5',
          position: player.playerProfile?.position || 'C',
          status: player.playerProfile?.status || 'Signed',
          playerProfile: player.playerProfile
        }));

        if (this.selectedClub) {
          this.selectedClub = { ...this.selectedClub, roster: mappedRoster };
        }
      });
    }
  }

  onLogoFileChange(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingLogo = true;
      
      this.api.uploadFile(file).subscribe({
        next: (res) => {
          const logoUrl = res.url || res.data?.url || res;
          this.clubForm.patchValue({ logo: logoUrl });
          this.logoPreview = this.imageUrlService.getImageUrl(logoUrl);
          this.uploadingLogo = false;
        },
        error: (error) => {
          console.error('Upload failed:', error);
          alert('Logo upload failed. Please try again.');
          this.uploadingLogo = false;
        }
      });
      
      // Show local preview while uploading
      const reader = new FileReader();
      reader.onload = e => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/1ithlwords.png';
  }

  getLogoPreviewUrl(): string {
    if (typeof this.logoPreview === 'string') {
      return this.imageUrlService.getImageUrl(this.logoPreview);
    }
    // If it's an ArrayBuffer (local preview), return it directly
    return this.logoPreview as unknown as string;
  }

  onSeasonChange(event: any): void {
    const seasonId = event.target.value;

    this.selectedSeasonId = seasonId;
    this.loadClubsForSeason(seasonId);
    this.loadFreeAgentsForSeason(seasonId);
    this.updateSeasonFreeAgents();
  }

  addClub(): void {
    if (this.clubForm.valid) {
      const form = this.clubForm.value;
      
      // Build seasons array from form data
      const seasons: any[] = [];
      this.seasons.forEach(season => {
        const seasonControlName = `season_${season._id}`;
        const divisionControlName = `division_${season._id}`;
        
        if (this.clubForm.get(seasonControlName)?.value) {
          const divisionId = this.clubForm.get(divisionControlName)?.value;
          if (divisionId) {
            seasons.push({
              seasonId: season._id,
              divisionIds: [divisionId]
            });
          }
        }
      });
      
      // Find the regionId from the selected region name
      const selectedRegion = this.regions.find(r => (r.name || r.key) === form.region);
      if (!selectedRegion) {
        console.error('Selected region not found:', form.region);
        return;
      }
      
      const clubData = {
        name: form.name,
        logoUrl: form.logo,
        primaryColour: form.color,
        seasons: seasons,
        regionId: selectedRegion._id, // Use regionId instead of region
        eashlClubId: form.eashlClubId
      };
      
      
      this.api.addClub(clubData).subscribe({
        next: (newClub) => {
          this.clubs.push(newClub);
          this.clubs.sort((a, b) => a.name.localeCompare(b.name));
          
          // Clear clubs cache to ensure fresh data is loaded
          this.api.invalidateClubsCache();
          
          this.cancelClubForm();
        },
        error: (error) => {
          console.error('Error creating club:', error);
        }
      });
    }
  }

  editClub(club: Club): void {
    this.editingClub = club;
    this.isAddingClub = true;
    
    // Ensure season controls are added
    this.addSeasonControls();
    
    // Reset form first to clear any previous state with default values
    this.clubForm.reset({
      name: '',
      logo: '',
      color: '#ffffff',
      region: '',
      eashlClubId: ''
    });
    
    // Set basic form values
    this.clubForm.patchValue({
      name: club.name,
      logo: club.logoUrl,
      color: club.primaryColour || '#ffffff',
      region: club.region,
      eashlClubId: club.eashlClubId
    });
    
    
    // Set season and division values
    if (club.seasons && club.seasons.length > 0) {
      club.seasons.forEach(seasonInfo => {
        let seasonId = seasonInfo.seasonId;
        if (typeof seasonId === 'object' && seasonId._id) {
          seasonId = seasonId._id;
        }
        
        if (seasonId) {
          const seasonControlName = `season_${seasonId}`;
          const divisionControlName = `division_${seasonId}`;
          
          // Check if controls exist before setting values
          if (this.clubForm.contains(seasonControlName)) {
            this.clubForm.get(seasonControlName)?.setValue(true);
          }
          if (this.clubForm.contains(divisionControlName)) {
            this.clubForm.get(divisionControlName)?.setValue(seasonInfo.divisionIds?.[0] || '');
          }
        }
      });
    }
    
    // Set the logo preview after form is populated
    this.logoPreview = this.imageUrlService.getImageUrl(club.logoUrl);
    
    // Mark form as touched to trigger validation
    this.clubForm.markAllAsTouched();
  }

  updateClub(): void {
    if (!this.editingClub) {
      console.error('No club selected for editing');
      return;
    }
    
    
    if (!this.clubForm.valid) {
      console.error('Form is not valid');
      console.error('Form errors:', this.getFormErrors());
      this.clubForm.markAllAsTouched();
      return;
    }
    
    const form = this.clubForm.value;
    
    // Build seasons array from form data
    const seasons: any[] = [];
    this.seasons.forEach(season => {
      const seasonControlName = `season_${season._id}`;
      const divisionControlName = `division_${season._id}`;
      
      if (this.clubForm.get(seasonControlName)?.value) {
        const divisionId = this.clubForm.get(divisionControlName)?.value;
        if (divisionId) {
          seasons.push({
            seasonId: season._id,
            divisionIds: [divisionId]
          });
        }
      }
    });
    
    // Create a clean update object with only the fields that should be updated
    const updated: any = {
      _id: this.editingClub._id, // Include the club ID for the API call
      name: form.name,
      primaryColour: form.color,
      seasons: seasons,
      region: form.region,
      eashlClubId: form.eashlClubId
    };
    
    // Always include logoUrl from form (backend will preserve existing if empty)
    updated.logoUrl = form.logo || '';
    
    this.api.updateClub(updated).subscribe({
      next: (updatedClub) => {
        // Clear clubs cache FIRST before reloading to ensure fresh data
        this.api.invalidateClubsCache();
        
        // Update the club in the local array immediately with the response
        const idx = this.clubs.findIndex(c => c._id === updatedClub._id);
        if (idx > -1) {
          // Create a new object to trigger change detection
          this.clubs[idx] = { ...updatedClub };
        }
        this.clubs.sort((a, b) => a.name.localeCompare(b.name));
        
        // Force a complete reload of clubs AFTER cache is cleared
        setTimeout(() => {
          this.loadClubsForSeason(this.selectedSeasonId || this.seasons[0]?._id || '');
        }, 100);
        
        // Trigger storage event to notify other components
        const timestamp = Date.now().toString();
        localStorage.setItem('admin-data-updated', timestamp);
        
        // Show success message and close form after a brief delay
        alert('Club updated successfully!');
        setTimeout(() => {
          this.cancelClubForm();
        }, 1000);
      },
      error: (error) => {
        console.error('Error updating club:', error);
        alert('Failed to update club. Please try again.');
      }
    });
  }

  deleteClub(club: Club): void {
    if (confirm('Are you sure you want to delete this club?')) {
      this.api.deleteClub(club._id!).subscribe(() => {
        this.clubs = this.clubs.filter(c => c._id !== club._id);
        
        // Clear clubs cache to ensure fresh data is loaded
        this.api.invalidateClubsCache();
      });
    }
  }

  clearAllCaches(): void {
    this.api.invalidateAllCaches();
    console.log('Cleared all caches');
    alert('All caches cleared! The page will reload with fresh data.');
    // Reload the page to ensure fresh data is loaded
    window.location.reload();
  }

  cancelClubForm(): void {
    this.clubForm.reset({
      name: '',
      logo: '',
      color: '#000000', // Provide a default hex color
      region: '',
      eashlClubId: ''
    });
    this.editingClub = null;
    this.isAddingClub = false;
    this.logoPreview = null;
  }

  getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.clubForm.controls).forEach(key => {
      const control = this.clubForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  addSeasonControls(): void {
    // Add form controls for each season dynamically
    this.seasons.forEach(season => {
      const seasonControlName = `season_${season._id}`;
      const divisionControlName = `division_${season._id}`;
      
      if (!this.clubForm.contains(seasonControlName)) {
        this.clubForm.addControl(seasonControlName, this.fb.control(false));
      }
      if (!this.clubForm.contains(divisionControlName)) {
        this.clubForm.addControl(divisionControlName, this.fb.control(''));
      }
    });
    
    // Add custom validator for seasons
    this.clubForm.setValidators(this.validateSeasons());
    
    // Update validation status
    this.clubForm.updateValueAndValidity();
  }

  validateSeasons(): any {
    return (formGroup: FormGroup) => {
      if (!this.seasons || this.seasons.length === 0) {
        return null; // Skip validation if seasons not loaded yet
      }
      
      const hasSelectedSeason = this.seasons.some(season => {
        const seasonControlName = `season_${season._id}`;
        return formGroup.get(seasonControlName)?.value === true;
      });
      
      if (!hasSelectedSeason) {
        return { noSeasonsSelected: true };
      }
      
      // Check that all selected seasons have divisions
      const hasInvalidSeasons = this.seasons.some(season => {
        const seasonControlName = `season_${season._id}`;
        const divisionControlName = `division_${season._id}`;
        
        if (formGroup.get(seasonControlName)?.value === true) {
          const divisionValue = formGroup.get(divisionControlName)?.value;
          const isInvalid = !divisionValue || divisionValue === '';
          return isInvalid;
        }
        return false;
      });
      
      if (hasInvalidSeasons) {
        return { incompleteSeasons: true };
      }
      
      return null;
    };
  }

  // Removed loadDivisionsForSeason - divisions are loaded globally in loadData()

  getDivisionsForSeason(seasonId: string): Division[] {
    return this.divisions.filter(d => d.seasonId === seasonId).sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
  }

  isSeasonSelected(seasonId: string): boolean {
    // First check the form value for current state
    const seasonControlName = `season_${seasonId}`;
    const formValue = this.clubForm.get(seasonControlName)?.value;
    
    if (formValue !== null && formValue !== undefined) {
      return formValue === true;
    }
    
    // Fallback to original club data for initial load
    if (!this.editingClub) return false;
    return this.editingClub.seasons?.some(s => {
      if (typeof s.seasonId === 'object' && s.seasonId._id) {
        return s.seasonId._id === seasonId;
      }
      return s.seasonId === seasonId;
    }) || false;
  }

  onSeasonToggle(seasonId: string, event: any): void {
    const isChecked = event.target.checked;
    const seasonControlName = `season_${seasonId}`;
    const divisionControlName = `division_${seasonId}`;
    
    this.clubForm.get(seasonControlName)?.setValue(isChecked);
    
    if (!isChecked) {
      // Clear division selection when unchecking season
      this.clubForm.get(divisionControlName)?.setValue('');
    }
    
    // Trigger form validation
    this.clubForm.updateValueAndValidity();
  }

  onDivisionChange(seasonId: string, event: any): void {
    const divisionId = event.target.value;
    const divisionControlName = `division_${seasonId}`;
    this.clubForm.get(divisionControlName)?.setValue(divisionId);
    
    // Trigger form validation
    this.clubForm.updateValueAndValidity();
  }

  viewClubDetails(club: Club): void {
    this.selectedClub = club;
    if (club._id) {
      const selectedSeasonId = this.selectedSeasonId;
      if (selectedSeasonId) {
        this.api.getClubRoster(club._id, selectedSeasonId).subscribe({
          next: (roster) => {
            // Map roster data to Player objects
            const mappedRoster = roster.map((player: any): Player => ({
              _id: player._id,
              gamertag: player.gamertag || player.discordUsername || 'Unknown',
              discordId: player.discordId,
              discordUsername: player.discordUsername,
              platform: player.platform || 'PS5',
              position: player.playerProfile?.position || 'C',
              status: player.playerProfile?.status || 'Signed',
              playerProfile: player.playerProfile
            }));
            
            // Update both selectedClub and the clubs array
            this.selectedClub = { ...this.selectedClub!, roster: mappedRoster };
            
            // Also update the roster in the clubs array to ensure filtering works correctly
            const clubIndex = this.clubs.findIndex(c => c._id === club._id);
            if (clubIndex > -1) {
              this.clubs[clubIndex] = { ...this.clubs[clubIndex], roster: mappedRoster };
            }
          },
          error: (error) => {
            console.error('Error fetching roster:', error);
          }
        });
      }
    }
  }

  addPlayer(club: Club, player: Player): void {
    if (!club._id || !player._id) {
      console.error('Missing club or player ID');
      return;
    }

    const selectedSeasonId = this.selectedSeasonId;
    if (!selectedSeasonId) {
      console.error('No season selected');
      return;
    }

    this.api.addPlayerToClub(club._id, player._id, selectedSeasonId).subscribe({
      next: () => {
        // Log transaction
        this.logPlayerSigning(club, player, selectedSeasonId);
        
        // Refresh the selected club if it's the one we just updated
        if (this.selectedClub && this.selectedClub._id === club._id) {
          this.viewClubDetails(club);
        }
        
        // Refresh free agents list for the current season
        this.updateFreeAgentsList();
        
        // Update the clubs list to reflect the change
        const clubIndex = this.clubs.findIndex(c => c._id === club._id);
        if (clubIndex > -1 && club._id) {
          // Refresh just this club's roster
          this.api.getClubRoster(club._id, selectedSeasonId).subscribe(roster => {
            const mappedRoster = roster.map((player: any): Player => ({
              _id: player._id,
              gamertag: player.gamertag || player.discordUsername || 'Unknown',
              discordId: player.discordId,
              discordUsername: player.discordUsername,
              platform: player.platform || 'PS5',
              position: player.playerProfile?.position || 'C',
              status: player.playerProfile?.status || 'Signed',
              playerProfile: player.playerProfile
            }));
            this.clubs[clubIndex] = { ...this.clubs[clubIndex], roster: mappedRoster };
          });
        }
        
        // Trigger storage event to notify club detail component
        localStorage.setItem('roster-updated', Date.now().toString());
      },
      error: (error) => {
        console.error('Error adding player:', error);
      }
    });
  }

  removePlayerFromRoster(club: Club, player: Player): void {
    if (!club._id || !player._id) {
      console.error('Missing club or player ID');
      return;
    }

    const selectedSeasonId = this.selectedSeasonId;
    if (!selectedSeasonId) {
      console.error('No season selected');
      return;
    }

    this.api.removePlayerFromClub(club._id, player._id, selectedSeasonId).subscribe({
      next: () => {
        // Log transaction
        this.logPlayerRelease(club, player, selectedSeasonId);
        
        // Refresh the selected club if it's the one we just updated
        if (this.selectedClub && this.selectedClub._id === club._id) {
          this.viewClubDetails(club);
        }
        
        // Refresh free agents list for the current season
        this.updateFreeAgentsList();
        
        // Update the clubs list to reflect the change
        const clubIndex = this.clubs.findIndex(c => c._id === club._id);
        if (clubIndex > -1 && club._id) {
          // Refresh just this club's roster
          this.api.getClubRoster(club._id, selectedSeasonId).subscribe(roster => {
            const mappedRoster = roster.map((player: any): Player => ({
              _id: player._id,
              gamertag: player.gamertag || player.discordUsername || 'Unknown',
              discordId: player.discordId,
              discordUsername: player.discordUsername,
              platform: player.platform || 'PS5',
              position: player.playerProfile?.position || 'C',
              status: player.playerProfile?.status || 'Signed',
              playerProfile: player.playerProfile
            }));
            this.clubs[clubIndex] = { ...this.clubs[clubIndex], roster: mappedRoster };
          });
        }
        
        // Trigger storage event to notify club detail component
        localStorage.setItem('roster-updated', Date.now().toString());
      },
      error: (error) => {
        console.error('Error removing player:', error);
      }
    });
  }
  

  ngOnDestroy(): void {
    if (this.rosterUpdateSubscription) {
      this.rosterUpdateSubscription.unsubscribe();
    }
    if (this.seasonFreeAgentsSubscription) {
      this.seasonFreeAgentsSubscription.unsubscribe();
    }
  }


  // ---------- Region helpers ----------
  get availableRegionOptions(): string[] {
    const current = (this.clubForm.get('region')?.value || '').toString();
    const base = [...this.regionOptions];
    if (current && !base.includes(current)) {
      base.unshift(current);
    }
    return base;
  }

  // ---------- Transaction logging helpers ----------
  private logPlayerSigning(club: Club, player: Player, seasonId: string): void {
    const season = this.seasons.find(s => s._id === seasonId);
    const seasonName = season ? season.name : 'Unknown Season';
    
    this.transactionsService.logPlayerSigning(
      club._id!,
      club.name,
      club.logoUrl,
      player._id,
      player.gamertag || player.discordUsername || 'Unknown Player',
      seasonId,
      seasonName,
      'Admin' // Since this is admin action
    ).subscribe({
      next: (transaction) => {
        console.log('Player signing logged:', transaction);
        // Notify roster update service for real-time updates
        this.rosterUpdateService.notifyPlayerSigned(club._id!, seasonId, player._id);
      },
      error: (error) => {
        console.error('Error logging player signing:', error);
      }
    });
  }

  private logPlayerRelease(club: Club, player: Player, seasonId: string): void {
    const season = this.seasons.find(s => s._id === seasonId);
    const seasonName = season ? season.name : 'Unknown Season';
    
    this.transactionsService.logPlayerRelease(
      club._id!,
      club.name,
      club.logoUrl,
      player._id,
      player.gamertag || player.discordUsername || 'Unknown Player',
      seasonId,
      seasonName,
      'Admin' // Since this is admin action
    ).subscribe({
      next: (transaction) => {
        console.log('Player release logged:', transaction);
        // Notify roster update service for real-time updates
        this.rosterUpdateService.notifyPlayerReleased(club._id!, seasonId, player._id);
      },
      error: (error) => {
        console.error('Error logging player release:', error);
      }
    });
  }

  // ---------- Debug helpers ----------
  
  // Free agents management methods
  onFreeAgentSearchChange(): void {
    this.currentFreeAgentPage = 1; // Reset to first page when searching
  }
  
  onFreeAgentFilterChange(): void {
    this.currentFreeAgentPage = 1; // Reset to first page when filtering
  }
  
  onFreeAgentSortChange(): void {
    this.currentFreeAgentPage = 1; // Reset to first page when sorting
  }
  
  goToFreeAgentPage(page: number): void {
    if (page >= 1 && page <= this.totalFreeAgentPages) {
      this.currentFreeAgentPage = page;
    }
  }
  
  previousFreeAgentPage(): void {
    if (this.currentFreeAgentPage > 1) {
      this.currentFreeAgentPage--;
    }
  }
  
  nextFreeAgentPage(): void {
    if (this.currentFreeAgentPage < this.totalFreeAgentPages) {
      this.currentFreeAgentPage++;
    }
  }
  
  clearFreeAgentFilters(): void {
    this.freeAgentSearchTerm = '';
    this.freeAgentPlatformFilter = 'all';
    this.freeAgentSortBy = 'gamertag';
    this.freeAgentSortOrder = 'asc';
    this.currentFreeAgentPage = 1;
  }
} 