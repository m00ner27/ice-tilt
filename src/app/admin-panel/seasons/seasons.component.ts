import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { AdminNavComponent } from '../admin-nav.component';

interface Season {
  _id?: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Division {
  _id?: string;
  name: string;
  seasonId: string;
}

@Component({
  selector: 'app-seasons',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminNavComponent],
  templateUrl: './seasons.component.html',
  styleUrl: './seasons.component.css'
})
export class SeasonsComponent implements OnInit {
  seasons: Season[] = [];
  divisions: Division[] = [];
  seasonForm: FormGroup;
  divisionForm: FormGroup;
  selectedSeason: Season | null = null;
  isAddingSeason = false;
  isAddingDivision = false;
  editingSeason: Season | null = null;
  editingDivision: Division | null = null;
  clubsInSeason: any[] = [];

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.seasonForm = this.fb.group({
      name: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
    this.divisionForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.api.getSeasons().subscribe(seasons => {
      this.seasons = seasons;
    });
  }

  addSeason(): void {
    if (this.seasonForm.valid) {
      const seasonData = this.seasonForm.value;
      this.api.addSeason(seasonData).subscribe(newSeason => {
        this.seasons.push(newSeason);
        this.isAddingSeason = false;
        this.seasonForm.reset();
      });
    }
  }

  selectSeason(season: Season): void {
    this.selectedSeason = season;
    this.api.getDivisionsBySeason(season._id!).subscribe(divisions => {
      this.divisions = divisions;
    });
    this.api.getClubsBySeason(season._id!).subscribe(clubs => {
      this.clubsInSeason = clubs;
    });
  }

  addDivision(): void {
    if (this.divisionForm.valid && this.selectedSeason) {
      const divisionData = {
        name: this.divisionForm.value.name,
        seasonId: this.selectedSeason._id
      };
      this.api.addDivision(divisionData).subscribe(newDivision => {
        this.divisions.push(newDivision);
        this.isAddingDivision = false;
        this.divisionForm.reset();
      });
    }
  }

  editSeason(season: Season): void {
    this.editingSeason = season;
    this.seasonForm.patchValue({
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate
    });
    this.isAddingSeason = true;
  }

  updateSeason(): void {
    if (this.seasonForm.valid && this.editingSeason) {
      const updated = { ...this.editingSeason, ...this.seasonForm.value };
      // TODO: Call API to update season
      this.editingSeason = null;
      this.isAddingSeason = false;
      this.seasonForm.reset();
    }
  }

  deleteSeason(season: Season): void {
    if (!season._id) return;
    this.api.deleteSeason(season._id).subscribe(() => {
      this.seasons = this.seasons.filter(s => s._id !== season._id);
      if (this.selectedSeason && this.selectedSeason._id === season._id) {
        this.selectedSeason = null;
        this.divisions = [];
      }
    });
  }

  editDivision(division: Division): void {
    this.editingDivision = division;
    this.divisionForm.patchValue({ name: division.name });
    this.isAddingDivision = true;
  }

  updateDivision(): void {
    if (this.divisionForm.valid && this.editingDivision) {
      const updated = { ...this.editingDivision, ...this.divisionForm.value };
      // TODO: Call API to update division
      this.editingDivision = null;
      this.isAddingDivision = false;
      this.divisionForm.reset();
    }
  }

  deleteDivision(division: Division): void {
    if (!division._id) return;
    this.api.deleteDivision(division._id).subscribe(() => {
      this.divisions = this.divisions.filter(d => d._id !== division._id);
      if (this.editingDivision && this.editingDivision._id === division._id) {
        this.editingDivision = null;
        this.isAddingDivision = false;
        this.divisionForm.reset();
      }
    });
  }

  getDivisionsForSelectedSeason(): Division[] {
    if (!this.selectedSeason) return [];
    return this.divisions.filter(d => d.seasonId === this.selectedSeason?._id);
  }

  // Optionally add edit/delete methods for seasons/divisions
} 