import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { EashlService } from '../../services/eashl.service';
import { TransactionsService } from '../../store/services/transactions.service';
import { RosterUpdateService } from '../../store/services/roster-update.service';
import { environment } from '../../../environments/environment';
import { REGIONS } from '../../shared';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Club {
  _id?: string;
  name: string;
  logoUrl: string;
  manager: string;
  primaryColour: string;
  seasons: any[];
  roster?: any[];
  region: string;
  eashlClubId: string;
}

interface Division {
  _id?: string;
  name: string;
  seasonId: string;
}

interface User {
  _id: string;
  discordId?: string;
  discordUsername?: string;
  playerProfile?: {
    position?: string;
    status?: string;
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
  freeAgents: User[] = [];
  clubForm: FormGroup;
  logoPreview: string | ArrayBuffer | null = null;
  uploadingLogo = false;
  selectedSeasonId: string | null = null;
  private rosterUpdateSubscription: Subscription | undefined;
  private managerValueSub: Subscription | undefined;
  allUsers: User[] = [];
  managerSuggestions: User[] = [];
  showManagerSuggestions = false;
  highlightedSuggestionIndex = -1;
  regions: string[] = [];
  private isSelectingManager = false; // Flag to prevent suggestions from showing during selection

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private eashlService: EashlService,
    private transactionsService: TransactionsService,
    private rosterUpdateService: RosterUpdateService
  ) {
    this.clubForm = this.fb.group({
      name: ['', Validators.required],
      logo: [''],
      manager: ['', Validators.required],
      color: ['#ffffff', Validators.required],
      region: ['', Validators.required],
      eashlClubId: ['']
    });

    // Add validator to ensure manager matches a registered user
    this.clubForm.get('manager')?.addValidators(this.managerExistsValidator());

    // Typeahead subscription for manager input
    const managerCtrl = this.clubForm.get('manager');
    if (managerCtrl) {
      this.managerValueSub = managerCtrl.valueChanges.pipe(
        debounceTime(200),
        distinctUntilChanged()
      ).subscribe((term: string) => {
        // Don't show suggestions if we're programmatically selecting a manager
        if (this.isSelectingManager) {
          return;
        }

        const query = (term || '').toLowerCase().trim();
        if (!query) {
          this.managerSuggestions = [];
          this.showManagerSuggestions = false;
          this.highlightedSuggestionIndex = -1;
          return;
        }
        const getName = (u: User) => (u.discordUsername || u.discordId || '').toLowerCase();
        this.managerSuggestions = this.allUsers
          .filter(u => getName(u).includes(query))
          .slice(0, 8);
        this.showManagerSuggestions = this.managerSuggestions.length > 0;
        this.highlightedSuggestionIndex = -1;
      });
    }
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

  get filteredRoster(): User[] {
    const filtered = (this.selectedClub?.roster || []).filter(p => !!p && p.discordUsername);
    return filtered;
  }

  // Method to get the full image URL
  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/square-default.png';
    }
    
    // If it's already a full URL, return as is
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // If it's a relative path starting with /uploads, prepend the API URL
    if (logoUrl.startsWith('/uploads/')) {
      return `${environment.apiUrl}${logoUrl}`;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }

  ngOnInit(): void {
    this.loadData();

    // Load all users for manager suggestions
    this.api.getUsers().subscribe(users => {
      this.allUsers = users || [];
      // Revalidate manager after users load
      this.clubForm.get('manager')?.updateValueAndValidity({ onlySelf: true });
    });

    // Load regions from API
    this.api.getRegions().subscribe(list => {
      this.regions = (list || []).map((r: any) => r.name || r.key);
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
      }
    });
  }

  loadData(): void {
    this.api.getSeasons().subscribe(seasons => {
      this.seasons = seasons;
      
      // Load all divisions for all seasons
      this.api.getDivisions().subscribe(divisions => {
        this.divisions = divisions;
        
        // Add season controls to form after seasons are loaded
        this.addSeasonControls();
      });
      
      // Auto-select the first season by default
      if (seasons.length > 0) {
        this.selectedSeasonId = seasons[0]._id;
        // Load clubs for the first season
        this.loadClubsForSeason(seasons[0]._id);
        // Load free agents for the first season
        this.loadFreeAgentsForSeason(seasons[0]._id);
      }
    });
  }

  private loadClubsForSeason(seasonId: string): void {
    // Load all clubs and filter by season
    this.api.getClubs().subscribe(allClubs => {
      // Filter clubs that are active in this season
      this.clubs = allClubs.filter(club => 
        club.seasons && club.seasons.some((season: any) => {
          // Handle both object and string seasonId formats
          if (typeof season.seasonId === 'object' && season.seasonId._id) {
            return season.seasonId._id === seasonId;
          } else if (typeof season.seasonId === 'string') {
            return season.seasonId === seasonId;
          }
          return false;
        })
      );

    });
  }

  private loadFreeAgentsForSeason(seasonId: string): void {
    // Fetch season-specific free agents
    this.api.getFreeAgentsForSeason(seasonId).subscribe(agents => {
      this.freeAgents = agents;

    });
  }

  private updateFreeAgentsList(): void {
    // Get the current season from the form
    const selectedSeasonId = this.selectedSeasonId;
    
    if (selectedSeasonId) {
      // Refresh season-specific free agents
      this.loadFreeAgentsForSeason(selectedSeasonId);
    }
    
    // Refresh the selected club's roster if one is selected
    if (this.selectedClub && this.selectedClub._id && selectedSeasonId) {
      this.api.getClubRoster(this.selectedClub._id, selectedSeasonId).subscribe(roster => {

        if (this.selectedClub) {
          this.selectedClub.roster = roster;
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
          this.clubForm.patchValue({ logo: res.url });
          this.logoPreview = res.url;
          this.uploadingLogo = false;
        },
        error: () => {
          this.uploadingLogo = false;
        }
      });
      // Show local preview while uploading
      const reader = new FileReader();
      reader.onload = e => this.logoPreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  onSeasonChange(event: any): void {
    const seasonId = event.target.value;

    this.selectedSeasonId = seasonId;
    this.loadClubsForSeason(seasonId);
    this.loadFreeAgentsForSeason(seasonId);
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
      
      console.log('Adding club with seasons:', seasons);
      
      const clubData = {
        name: form.name,
        logoUrl: form.logo,
        manager: form.manager,
        primaryColour: form.color,
        seasons: seasons,
        region: form.region,
        eashlClubId: form.eashlClubId
      };
      
      this.api.addClub(clubData).subscribe(newClub => {
        this.clubs.push(newClub);
        this.cancelClubForm();
      });
    }
  }

  editClub(club: Club): void {
    this.editingClub = club;
    this.isAddingClub = true;
    this.logoPreview = club.logoUrl;
    
    console.log('Editing club:', club.name);
    console.log('Club seasons:', club.seasons);
    
    // Ensure season controls are added
    this.addSeasonControls();
    
    // Reset form first to clear any previous state
    this.clubForm.reset();
    
    // Set basic form values
    this.clubForm.patchValue({
      name: club.name,
      logo: club.logoUrl,
      manager: club.manager,
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
    
    // Mark form as touched to trigger validation
    this.clubForm.markAllAsTouched();
    
    console.log('Form validity after edit setup:', this.clubForm.valid);
    console.log('Form errors:', this.getFormErrors());
  }

  updateClub(): void {
    console.log('Update club called');
    console.log('Form valid:', this.clubForm.valid);
    console.log('Form errors:', this.getFormErrors());
    
    if (!this.editingClub) {
      console.error('No club selected for editing');
      return;
    }
    
    if (!this.clubForm.valid) {
      console.error('Form is not valid');
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
    
    console.log('Updated seasons for club:', seasons);
    
    // Create a clean update object with only the fields that should be updated
    const updated = {
      _id: this.editingClub._id, // Include the club ID for the API call
      name: form.name,
      logoUrl: form.logo,
      manager: form.manager,
      primaryColour: form.color,
      seasons: seasons,
      region: form.region,
      eashlClubId: form.eashlClubId
    };
    
    console.log('Sending update:', updated);
    
    this.api.updateClub(updated).subscribe({
      next: (updatedClub) => {
        console.log('Club updated successfully:', updatedClub);
        const idx = this.clubs.findIndex(c => c._id === updatedClub._id);
        if (idx > -1) this.clubs[idx] = updatedClub;
        this.cancelClubForm();
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
      });
    }
  }

  cancelClubForm(): void {
    this.clubForm.reset();
    this.editingClub = null;
    this.isAddingClub = false;
    this.logoPreview = null;
    this.managerSuggestions = [];
    this.showManagerSuggestions = false;
    this.highlightedSuggestionIndex = -1;
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
    
    console.log('Season controls added. Form controls:', Object.keys(this.clubForm.controls));
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
        console.log('No seasons selected');
        return { noSeasonsSelected: true };
      }
      
      // Check that all selected seasons have divisions
      const hasInvalidSeasons = this.seasons.some(season => {
        const seasonControlName = `season_${season._id}`;
        const divisionControlName = `division_${season._id}`;
        
        if (formGroup.get(seasonControlName)?.value === true) {
          const divisionValue = formGroup.get(divisionControlName)?.value;
          const isInvalid = !divisionValue || divisionValue === '';
          if (isInvalid) {
            console.log(`Season ${season.name} selected but no division chosen`);
          }
          return isInvalid;
        }
        return false;
      });
      
      if (hasInvalidSeasons) {
        console.log('Some seasons have incomplete divisions');
        return { incompleteSeasons: true };
      }
      
      console.log('Season validation passed');
      return null;
    };
  }

  // Removed loadDivisionsForSeason - divisions are loaded globally in loadData()

  getDivisionsForSeason(seasonId: string): Division[] {
    console.log('Getting divisions for season:', seasonId);
    console.log('All divisions:', this.divisions);
    
    // Debug: Show the seasonId of each division
    this.divisions.forEach((div, index) => {
      console.log(`Division ${index}:`, div.name, '-> seasonId:', div.seasonId, 'Type:', typeof div.seasonId);
    });
    
    // Debug: Show what we're comparing against
    console.log('Looking for seasonId:', seasonId, 'Type:', typeof seasonId);
    
    const filtered = this.divisions.filter(d => d.seasonId === seasonId);
    console.log('Filtered divisions for season', seasonId, ':', filtered);
    return filtered;
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
            this.selectedClub!.roster = roster;
          },
          error: (error) => {
            console.error('Error fetching roster:', error);
          }
        });
      }
    }
  }

  addPlayer(club: Club, player: User): void {
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
            this.clubs[clubIndex].roster = roster;
          });
        }
      },
      error: (error) => {
        console.error('Error adding player:', error);
      }
    });
  }

  removePlayer(club: Club, player: User): void {
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
        console.log('Player removed successfully');
        
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
            this.clubs[clubIndex].roster = roster;
          });
        }
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
    if (this.managerValueSub) {
      this.managerValueSub.unsubscribe();
    }
  }

  // ---------- Manager typeahead helpers ----------
  managerExistsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = (control.value || '').toString().trim().toLowerCase();
      if (!value) return null;
      if (!this.allUsers || this.allUsers.length === 0) return null; // don't block before users load
      
      // Check if the manager value matches any user
      const exists = this.allUsers.some(u => {
        const displayName = this.managerDisplay(u).toLowerCase();
        return displayName === value || displayName.includes(value);
      });
      
      return exists ? null : { managerNotFound: true };
    };
  }

  managerDisplay(u: User): string {
    return u.discordUsername || u.discordId || '';
  }

  onManagerFocus(): void {
    // Only show suggestions if we have them and we're not in the middle of selecting
    if (!this.isSelectingManager) {
      this.showManagerSuggestions = (this.managerSuggestions && this.managerSuggestions.length > 0);
    }
  }

  onManagerBlur(): void {
    // Delay hiding so click can register on suggestions
    setTimeout(() => {
      // Only hide if we're not in the middle of selecting a manager
      if (!this.isSelectingManager) {
        this.showManagerSuggestions = false;
      }
    }, 150);
  }

  selectManager(u: User): void {
    this.isSelectingManager = true;
    this.clubForm.get('manager')?.setValue(this.managerDisplay(u));
    this.showManagerSuggestions = false;
    this.highlightedSuggestionIndex = -1;
    
    // Reset the flag after a short delay to allow the value change to complete
    setTimeout(() => {
      this.isSelectingManager = false;
    }, 100);
  }

  moveManagerHighlight(direction: number): void {
    if (!this.managerSuggestions || this.managerSuggestions.length === 0) return;
    const max = this.managerSuggestions.length - 1;
    this.highlightedSuggestionIndex = Math.max(0, Math.min(max, this.highlightedSuggestionIndex + direction));
  }

  onManagerEnter(): void {
    if (this.highlightedSuggestionIndex >= 0 && this.highlightedSuggestionIndex < this.managerSuggestions.length) {
      this.selectManager(this.managerSuggestions[this.highlightedSuggestionIndex]);
    }
  }

  // ---------- Region helpers ----------
  get regionOptions(): string[] {
    const current = (this.clubForm.get('region')?.value || '').toString();
    const base = [...this.regions];
    if (current && !base.includes(current)) {
      base.unshift(current);
    }
    return base;
  }

  // ---------- Debug helpers ----------
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
} 