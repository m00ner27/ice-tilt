import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as SeasonsActions from '../../store/seasons.actions';
import { selectAllSeasons, selectSeasonsLoading, selectSeasonsError } from '../../store/seasons.selectors';
import { Season, Division } from '../../store/models/models';
import { ApiService } from '../../store/services/api.service';
import { ImageUrlService } from '../../shared/services/image-url.service';

@Component({
  selector: 'app-seasons',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './seasons.component.html'
})
export class SeasonsComponent implements OnInit {
  seasons$!: Observable<Season[]>;
  divisions: Division[] = [];
  seasonForm: FormGroup;
  divisionForm: FormGroup;
  selectedSeason: Season | null = null;
  isAddingSeason = false;
  isAddingDivision = false;
  editingSeason: Season | null = null;
  editingDivision: Division | null = null;
  divisionLogoPreview: string | null = null;
  uploadingDivisionLogo = false;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private apiService: ApiService,
    private imageUrlService: ImageUrlService
  ) {
    this.seasonForm = this.fb.group({
      name: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });

    this.divisionForm = this.fb.group({
      name: ['', Validators.required],
      logoUrl: [''],
      order: [0]
    });
  }

  ngOnInit() {
    // Initialize observables
    this.seasons$ = this.store.select(selectAllSeasons);
    
    // Load seasons using NgRx
    this.store.dispatch(SeasonsActions.loadSeasons());
    
    // Load divisions from API
    this.loadDivisions();
  }

  loadDivisions() {
    this.apiService.getDivisions().subscribe({
      next: (divisions) => {
        this.divisions = (divisions || []).sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
      },
      error: (error) => {
        console.error('Error loading divisions:', error);
      }
    });
  }

  selectSeason(season: Season) {
    this.selectedSeason = season;
  }

  getDivisionsForSelectedSeason(): Division[] {
    if (!this.selectedSeason) return [];
    const filtered = this.divisions
      .filter(div => div.seasonId === this.selectedSeason!._id)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
    
    // Only log when we have divisions to avoid spam
    if (filtered.length > 0) {
      console.log('getDivisionsForSelectedSeason - selectedSeason:', this.selectedSeason?.name);
      console.log('getDivisionsForSelectedSeason - all divisions:', this.divisions.map(d => ({ name: d.name, order: d.order, seasonId: d.seasonId })));
      console.log('getDivisionsForSelectedSeason - filtered divisions:', filtered.map(d => ({ name: d.name, order: d.order })));
    }
    
    return filtered;
  }

  getClubsForDivision(divisionId: string): any[] {
    // This would need to be implemented based on your API
    return [];
  }

  getImageUrl(url: string | undefined): string {
    return this.imageUrlService.getImageUrl(url);
  }

  // Handle image loading errors
  onImageError(event: any): void {
    console.log('Image failed to load, URL:', event.target.src);
    
    // Prevent infinite error loops - if we're already showing the default image, don't change it
    if (event.target.src.includes('square-default.png')) {
      console.log('Default image also failed to load, stopping error handling');
      return;
    }
    
    // Set the fallback image - use a path that will be treated as a local asset
    event.target.src = '/assets/images/square-default.png';
  }

  // Season methods
  addSeason() {
    if (this.seasonForm.valid) {
      const seasonData = this.seasonForm.value;
      this.store.dispatch(SeasonsActions.createSeason({ seasonData }));
      this.cancelSeasonForm();
    }
  }

  editSeason(season: Season) {
    this.editingSeason = season;
    this.seasonForm.patchValue(season);
    this.isAddingSeason = true;
  }

  updateSeason() {
    if (this.seasonForm.valid && this.editingSeason) {
      const seasonData = { ...this.seasonForm.value, _id: this.editingSeason._id };
      this.store.dispatch(SeasonsActions.updateSeason({ season: seasonData }));
      this.cancelSeasonForm();
    }
  }

  deleteSeason(season: Season) {
    if (confirm('Are you sure you want to delete this season?')) {
      this.store.dispatch(SeasonsActions.deleteSeason({ seasonId: season._id }));
    }
  }

  cancelSeasonForm() {
    this.isAddingSeason = false;
    this.editingSeason = null;
    this.seasonForm.reset();
  }

  // Division methods
  addDivision() {
    if (this.divisionForm.valid && this.selectedSeason) {
      const divisionData = {
        ...this.divisionForm.value,
        seasonId: this.selectedSeason._id
      };
      
      // Save to database via API
      this.apiService.addDivision(divisionData).subscribe({
        next: (newDivision) => {
          // Add to local array after successful API call
          this.divisions.push(newDivision);
          this.cancelDivisionForm();
          
          // Trigger storage event to notify standings component
          localStorage.setItem('admin-data-updated', Date.now().toString());
        },
        error: (error) => {
          console.error('Error creating division:', error);
        }
      });
    }
  }

  editDivision(division: Division) {
    this.editingDivision = division;
    this.divisionForm.patchValue({
      name: division.name,
      logoUrl: division.logoUrl || '',
      order: division.order || 0
    });
    this.isAddingDivision = true;
  }

  updateDivision() {
    if (this.divisionForm.valid && this.editingDivision) {
      const formValue = this.divisionForm.value;
      // Only include logoUrl if it has a value (to avoid clearing existing logos)
      const divisionData: any = { 
        ...formValue, 
        _id: this.editingDivision._id 
      };
      
      // Remove logoUrl if it's empty to preserve existing logo
      if (!divisionData.logoUrl || divisionData.logoUrl.trim() === '') {
        delete divisionData.logoUrl;
      }
      
      console.log('Sending division update:', divisionData);
      
      // Update via API
      this.apiService.updateDivision(divisionData).subscribe({
        next: (updatedDivision) => {
          console.log('Received updated division:', updatedDivision);
          console.log('Updated division order field:', updatedDivision.order);
          
          // Update local array after successful API call
          const index = this.divisions.findIndex(d => d._id === updatedDivision._id);
          if (index !== -1) {
            console.log('Found division at index:', index, 'before update:', this.divisions[index]);
            this.divisions[index] = updatedDivision;
            console.log('After update:', this.divisions[index]);
            console.log('All divisions after update:', this.divisions.map(d => ({ name: d.name, order: d.order })));
          } else {
            console.log('Division not found in local array!');
          }
          this.cancelDivisionForm();
          
          // Trigger storage event to notify standings component
          localStorage.setItem('admin-data-updated', Date.now().toString());
        },
        error: (error) => {
          console.error('Error updating division:', error);
        }
      });
    }
  }

  deleteDivision(division: Division) {
    if (confirm('Are you sure you want to delete this division?')) {
      // Delete via API
      this.apiService.deleteDivision(division._id).subscribe({
        next: () => {
          // Remove from local array after successful API call
          this.divisions = this.divisions.filter(d => d._id !== division._id);
          
          // Trigger storage event to notify standings component
          localStorage.setItem('admin-data-updated', Date.now().toString());
        },
        error: (error) => {
          console.error('Error deleting division:', error);
        }
      });
    }
  }

  cancelDivisionForm() {
    this.isAddingDivision = false;
    this.editingDivision = null;
    this.divisionForm.reset();
    this.divisionLogoPreview = null;
  }

  onDivisionLogoFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadingDivisionLogo = true;
      
      // Upload the file
      this.apiService.uploadFile(file).subscribe({
        next: (response: any) => {
          console.log('Division logo uploaded:', response);
          this.divisionLogoPreview = response.url;
          this.divisionForm.patchValue({ logoUrl: response.url });
          this.uploadingDivisionLogo = false;
        },
        error: (error) => {
          console.error('Error uploading division logo:', error);
          this.uploadingDivisionLogo = false;
        }
      });
    }
  }
}
