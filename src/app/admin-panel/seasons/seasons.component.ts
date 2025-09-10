import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as SeasonsActions from '../../store/seasons.actions';
import { selectAllSeasons, selectSeasonsLoading, selectSeasonsError } from '../../store/seasons.selectors';
import { Season, Division } from '../../store/models/models';

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
    private store: Store
  ) {
    this.seasonForm = this.fb.group({
      name: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });

    this.divisionForm = this.fb.group({
      name: ['', Validators.required],
      logoUrl: ['']
    });
  }

  ngOnInit() {
    // Initialize observables
    this.seasons$ = this.store.select(selectAllSeasons);
    
    // Load seasons using NgRx
    this.store.dispatch(SeasonsActions.loadSeasons());
    
    // For now, keep divisions as a simple array since we don't have NgRx for divisions yet
    this.loadDivisions();
  }

  loadDivisions() {
    // This would be replaced with NgRx when division actions are available
    this.divisions = [];
  }

  selectSeason(season: Season) {
    this.selectedSeason = season;
  }

  getDivisionsForSelectedSeason(): Division[] {
    if (!this.selectedSeason) return [];
    return this.divisions.filter(div => div.seasonId === this.selectedSeason!._id);
  }

  getClubsForDivision(divisionId: string): any[] {
    // This would need to be implemented based on your API
    return [];
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url; // Simplified for now
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
      const seasonData = this.seasonForm.value;
      const updatedSeason = { ...this.editingSeason, ...seasonData };
      this.store.dispatch(SeasonsActions.updateSeason({ season: updatedSeason }));
      this.cancelSeasonForm();
    }
  }

  deleteSeason(season: Season) {
    if (confirm('Are you sure you want to delete this season?')) {
      this.store.dispatch(SeasonsActions.deleteSeason({ seasonId: season._id }));
      if (this.selectedSeason?._id === season._id) {
        this.selectedSeason = null;
      }
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
      // For now, just add to local array since we don't have NgRx for divisions
      this.divisions.push({ ...divisionData, _id: Date.now().toString() });
      this.cancelDivisionForm();
    }
  }

  editDivision(division: Division) {
    this.editingDivision = division;
    this.divisionForm.patchValue(division);
    this.isAddingDivision = true;
  }

  updateDivision() {
    if (this.divisionForm.valid && this.editingDivision) {
      const divisionData = this.divisionForm.value;
      const index = this.divisions.findIndex(d => d._id === this.editingDivision!._id);
      if (index !== -1) {
        this.divisions[index] = { ...this.divisions[index], ...divisionData };
      }
      this.cancelDivisionForm();
    }
  }

  deleteDivision(division: Division) {
    if (confirm('Are you sure you want to delete this division?')) {
      this.divisions = this.divisions.filter(d => d._id !== division._id);
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
      // Implement file upload logic here
      // For now, just create a preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.divisionLogoPreview = e.target.result;
        this.uploadingDivisionLogo = false;
      };
      reader.readAsDataURL(file);
    }
  }
}
