import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { environment } from '../../../environments/environment';

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
  logoUrl?: string;
}

@Component({
  selector: 'app-seasons',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="seasons-page">
      <div class="page-header">
        <h2>Seasons & Divisions</h2>
        <button class="primary-button" (click)="isAddingSeason = true">
          <i class="fas fa-plus"></i>
          Add Season
        </button>
      </div>

      <div class="content-grid">
        <!-- Seasons List -->
        <div class="content-card">
          <h3>Seasons</h3>
          <div class="list-container">
            <div class="list-item" *ngFor="let season of seasons" 
                 [class.selected]="selectedSeason?._id === season._id"
                 (click)="selectSeason(season)">
              <div class="list-item-content">
                <h4>{{ season.name }}</h4>
                <p>{{ season.startDate | date:'MMM d, y' }} - {{ season.endDate | date:'MMM d, y' }}</p>
              </div>
              <div class="list-item-actions">
                <button class="icon-button" (click)="editSeason(season); $event.stopPropagation()">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="icon-button delete" (click)="deleteSeason(season); $event.stopPropagation()">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Divisions List -->
        <div class="content-card" *ngIf="selectedSeason">
          <div class="card-header">
            <h3>Divisions in {{ selectedSeason.name }}</h3>
            <button class="primary-button" (click)="isAddingDivision = true">
              <i class="fas fa-plus"></i>
              Add Division
            </button>
          </div>
          <div class="list-container">
            <div class="list-item" *ngFor="let division of getDivisionsForSelectedSeason()">
              <div class="list-item-content">
                <img *ngIf="division.logoUrl" [src]="getImageUrl(division.logoUrl)" [alt]="division.name + ' logo'" class="division-logo">
                <h4>{{ division.name }}</h4>
              </div>
              <div class="list-item-actions">
                <button class="icon-button" (click)="editDivision(division)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="icon-button delete" (click)="deleteDivision(division)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Clubs by Division (moved below grid) -->
      <div class="clubs-by-division-section" *ngIf="selectedSeason">
        <h3>Clubs by Division in {{ selectedSeason.name }}</h3>
        <div class="division-cards">
          <div class="division-card" *ngFor="let division of getDivisionsForSelectedSeason()">
            <div class="division-title">{{ division.name }}</div>
            <ul class="club-list">
              <li *ngFor="let club of getClubsForDivision(division._id)" class="club-list-item">
                <img [src]="getImageUrl(club.logoUrl)" alt="Logo" class="club-logo" />
                <span class="club-info">
                  <span class="club-name">{{ club.name }}</span>
                  <span class="club-manager">{{ club.manager }}</span>
                </span>
              </li>
              <li *ngIf="getClubsForDivision(division._id).length === 0" class="no-clubs">No clubs in this division.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Season Form Modal -->
      <div class="modal" *ngIf="isAddingSeason">
        <div class="modal-content">
          <h3>{{ editingSeason ? 'Edit Season' : 'Add Season' }}</h3>
          <form [formGroup]="seasonForm" (ngSubmit)="editingSeason ? updateSeason() : addSeason()">
            <div class="form-group">
              <label>Season Name</label>
              <input formControlName="name" type="text" placeholder="Enter season name">
            </div>
            <div class="form-group">
              <label>Start Date</label>
              <input formControlName="startDate" type="date">
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input formControlName="endDate" type="date">
            </div>
            <div class="form-actions">
              <button type="submit" class="primary-button" [disabled]="!seasonForm.valid">
                {{ editingSeason ? 'Update' : 'Add' }}
              </button>
              <button type="button" class="secondary-button" (click)="cancelSeasonForm()">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Division Form Modal -->
      <div class="modal" *ngIf="isAddingDivision">
        <div class="modal-content">
          <h3>{{ editingDivision ? 'Edit Division' : 'Add Division' }}</h3>
          <form [formGroup]="divisionForm" (ngSubmit)="editingDivision ? updateDivision() : addDivision()">
            <div class="form-group">
              <label>Division Name</label>
              <input formControlName="name" type="text" placeholder="Enter division name">
            </div>
            <div class="form-group">
              <label>Division Logo</label>
              <div class="file-upload">
                <input type="file" accept="image/*" (change)="onDivisionLogoFileChange($event)">
                <div *ngIf="divisionLogoPreview" class="logo-preview">
                  <img [src]="divisionLogoPreview" alt="Logo Preview">
                  <span *ngIf="uploadingDivisionLogo" class="upload-status">Uploading...</span>
                </div>
              </div>
              <input formControlName="logoUrl" type="text" style="display:none">
            </div>
            <div class="form-actions">
              <button type="submit" class="primary-button" [disabled]="!divisionForm.valid">
                {{ editingDivision ? 'Update' : 'Add' }}
              </button>
              <button type="button" class="secondary-button" (click)="cancelDivisionForm()">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seasons-page {
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h2 {
      color: #90caf9;
      margin: 0;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .content-card {
      background: #23293a;
      border-radius: 12px;
      padding: 24px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .content-card h3 {
      color: #90caf9;
      margin: 0 0 16px 0;
    }

    .list-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .list-item {
      background: #2c3446;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
    }

    .list-item:hover {
      background: #394867;
    }

    .list-item.selected {
      border: 2px solid #1976d2;
    }

    .list-item-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .list-item-content h4 {
      color: #fff;
      margin: 0 0 4px 0;
    }

    .list-item-content p {
      color: #90caf9;
      margin: 0;
      font-size: 0.9rem;
    }

    .list-item-actions {
      display: flex;
      gap: 8px;
    }

    .club-logo {
      width: 40px;
      height: 40px;
      object-fit: contain;
      border-radius: 4px;
      background: #23293a;
    }

    .primary-button {
      background: #1976d2;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .primary-button:hover {
      background: #1565c0;
    }

    .secondary-button {
      background: #394867;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .secondary-button:hover {
      background: #2c3446;
    }

    .icon-button {
      background: none;
      border: none;
      color: #90caf9;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .icon-button:hover {
      background: #394867;
      color: #fff;
    }

    .icon-button.delete:hover {
      background: #d32f2f;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #23293a;
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 400px;
    }

    .modal-content h3 {
      color: #90caf9;
      margin: 0 0 24px 0;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      color: #e3eafc;
      margin-bottom: 8px;
    }

    .form-group input {
      width: 100%;
      background: #2c3446;
      border: 1px solid #394867;
      border-radius: 6px;
      padding: 8px 12px;
      color: #fff;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    @media (max-width: 768px) {
      .seasons-page {
        padding: 16px;
      }

      .content-grid {
        grid-template-columns: 1fr;
      }

      .modal-content {
        margin: 16px;
      }
    }

    .clubs-by-division-section {
      margin-top: 40px;
    }

    .division-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
    }

    .division-card {
      background: #23293a;
      border-radius: 12px;
      padding: 24px;
      min-width: 260px;
      flex: 1 1 260px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    }

    .division-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #90caf9;
      margin-bottom: 16px;
    }

    .club-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .club-list-item {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 14px;
    }

    .club-logo {
      width: 36px;
      height: 36px;
      object-fit: contain;
      border-radius: 6px;
      background: #181c24;
      border: 1px solid #394867;
    }

    .club-info {
      display: flex;
      flex-direction: column;
    }

    .club-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
    }

    .club-manager {
      font-size: 0.98rem;
      color: #90caf9;
      font-weight: 500;
    }

    .no-clubs {
      color: #90caf9;
      font-size: 1rem;
      margin-top: 8px;
    }

    .clubs-by-division-section h3 {
      color: #90caf9;
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 24px;
    }

    /* Division logo styling */
    .division-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
      border-radius: 4px;
      background: #23293a;
      border: 1px solid #394867;
    }

    /* File upload styling */
    .file-upload {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-upload input[type="file"] {
      background: #2c3446;
      border: 1px solid #394867;
      border-radius: 6px;
      padding: 8px 12px;
      color: #fff;
      cursor: pointer;
    }

    .logo-preview {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-preview img {
      width: 40px;
      height: 40px;
      object-fit: contain;
      border-radius: 4px;
      background: #23293a;
      border: 1px solid #394867;
    }

    .upload-status {
      color: #90caf9;
      font-size: 0.9rem;
    }
  `]
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
  
  // Logo handling properties
  divisionLogoPreview: string | null = null;
  uploadingDivisionLogo = false;

  constructor(private fb: FormBuilder, private api: ApiService) {
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

  ngOnInit(): void {
    this.api.getSeasons().subscribe(seasons => {
      this.seasons = seasons;
    });
    this.api.getDivisions().subscribe(divisions => {
      this.divisions = divisions;
    });
  }

  selectSeason(season: Season): void {
    this.selectedSeason = season;
    this.api.getClubsBySeason(season._id!).subscribe(clubs => {
      this.clubsInSeason = clubs;
    });
  }

  addSeason(): void {
    if (this.seasonForm.valid) {
      this.api.addSeason(this.seasonForm.value).subscribe(newSeason => {
        this.seasons.push(newSeason);
        this.cancelSeasonForm();
      });
    }
  }

  updateSeason(): void {
    if (this.seasonForm.valid && this.editingSeason) {
      const updated = { ...this.editingSeason, ...this.seasonForm.value };
      this.api.updateSeason(updated).subscribe(updatedSeason => {
        const idx = this.seasons.findIndex(s => s._id === updatedSeason._id);
        if (idx > -1) this.seasons[idx] = updatedSeason;
        this.cancelSeasonForm();
      });
    }
  }

  deleteSeason(season: Season): void {
    if (confirm('Are you sure you want to delete this season?')) {
      this.api.deleteSeason(season._id!).subscribe(() => {
        this.seasons = this.seasons.filter(s => s._id !== season._id);
        if (this.selectedSeason?._id === season._id) {
          this.selectedSeason = null;
          this.clubsInSeason = [];
        }
      });
    }
  }

  addDivision(): void {
    if (this.divisionForm.valid && this.selectedSeason) {
      const division = {
        ...this.divisionForm.value,
        seasonId: this.selectedSeason._id
      };
      this.api.addDivision(division).subscribe(newDivision => {
        this.divisions.push(newDivision);
        this.cancelDivisionForm();
      });
    }
  }

  updateDivision(): void {
    if (this.divisionForm.valid && this.editingDivision) {
      const updated = { ...this.editingDivision, ...this.divisionForm.value };
      // Updating division with form data
      
      this.api.updateDivision(updated).subscribe({
        next: (updatedDivision) => {
          const idx = this.divisions.findIndex(d => d._id === updatedDivision._id);
          if (idx > -1) this.divisions[idx] = updatedDivision;
          this.cancelDivisionForm();
        },
        error: (error) => {
          console.error('🚨 Error updating division:', error);
        }
      });
    }
  }

  deleteDivision(division: Division): void {
    if (confirm('Are you sure you want to delete this division?')) {
      this.api.deleteDivision(division._id!).subscribe(() => {
        this.divisions = this.divisions.filter(d => d._id !== division._id);
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

  editDivision(division: Division): void {
    this.editingDivision = division;
    this.divisionForm.patchValue({ 
      name: division.name,
      logoUrl: division.logoUrl || ''
    });
    this.divisionLogoPreview = division.logoUrl ? this.getImageUrl(division.logoUrl) : null;
    this.isAddingDivision = true;
  }

  cancelSeasonForm(): void {
    this.seasonForm.reset();
    this.editingSeason = null;
    this.isAddingSeason = false;
  }

  cancelDivisionForm(): void {
    this.divisionForm.reset();
    this.editingDivision = null;
    this.isAddingDivision = false;
    this.divisionLogoPreview = null;
  }

  getDivisionsForSelectedSeason(): Division[] {
    if (!this.selectedSeason) return [];
    return this.divisions.filter(d => d.seasonId === this.selectedSeason?._id);
  }

  getClubsForDivision(divisionId?: string) {
    if (!divisionId) return [];
    return this.clubsInSeason.filter(club =>
      club.seasons.some((s: any) =>
        s.seasonId === this.selectedSeason?._id && s.divisionIds.includes(divisionId)
      )
    );
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

  // Logo handling methods
  onDivisionLogoFileChange(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingDivisionLogo = true;
      
      // Upload the file - using the EXACT same pattern as club logos
      this.api.uploadFile(file).subscribe({
        next: (res) => {
          console.log('🔍 Division upload response:', res);
          this.divisionForm.patchValue({ logoUrl: res.url });
          this.divisionLogoPreview = this.getImageUrl(res.url);
          this.uploadingDivisionLogo = false;
        },
        error: () => {
          this.uploadingDivisionLogo = false;
          alert('Error uploading logo. Please try again.');
        }
      });
      
      // Show local preview while uploading
      const reader = new FileReader();
      reader.onload = e => this.divisionLogoPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

} 