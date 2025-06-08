import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';

interface Club {
  _id?: string;
  name: string;
  logoUrl: string;
  manager: string;
  primaryColour: string;
  seasons: any[];
}

interface Division {
  _id?: string;
  name: string;
  seasonId: string;
}

@Component({
  selector: 'app-clubs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="clubs-page">
      <div class="page-header">
        <h2>Clubs Management</h2>
        <button class="primary-button" (click)="isAddingClub = true">
          <i class="fas fa-plus"></i>
          Add Club
        </button>
      </div>

      <div class="content-grid">
        <!-- Clubs List -->
        <div class="content-card">
          <h3>All Clubs</h3>
          <div class="list-container">
            <div class="list-item" *ngFor="let club of clubs">
              <div class="list-item-content">
                <img [src]="club.logoUrl" [alt]="club.name" class="club-logo">
                <div>
                  <h4>{{ club.name }}</h4>
                  <p>{{ club.manager }}</p>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-button" (click)="editClub(club)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="icon-button delete" (click)="deleteClub(club)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Club Details -->
        <div class="content-card" *ngIf="editingClub">
          <h3>Club Details</h3>
          <div class="club-details">
            <div class="detail-item">
              <label>Name</label>
              <p>{{ editingClub.name }}</p>
            </div>
            <div class="detail-item">
              <label>Manager</label>
              <p>{{ editingClub.manager }}</p>
            </div>
            <div class="detail-item">
              <label>Primary Color</label>
              <div class="color-preview" [style.background-color]="editingClub.primaryColour"></div>
            </div>
            <div class="detail-item">
              <label>Seasons</label>
              <div class="seasons-list">
                <span *ngFor="let season of editingClub.seasons" class="season-tag">
                  {{ season.seasonId }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Club Form Modal -->
      <div class="modal" *ngIf="isAddingClub">
        <div class="modal-content">
          <h3>{{ editingClub ? 'Edit Club' : 'Add Club' }}</h3>
          <form [formGroup]="clubForm" (ngSubmit)="editingClub ? updateClub() : addClub()">
            <div class="form-group">
              <label>Club Name</label>
              <input formControlName="name" type="text" placeholder="Enter club name">
            </div>

            <div class="form-group">
              <label>Logo</label>
              <div class="file-upload">
                <input type="file" accept="image/*" (change)="onLogoFileChange($event)">
                <div *ngIf="logoPreview" class="logo-preview">
                  <img [src]="logoPreview" alt="Logo Preview">
                  <span *ngIf="uploadingLogo" class="upload-status">Uploading...</span>
                </div>
              </div>
              <input formControlName="logo" type="text" style="display:none">
            </div>

            <div class="form-group">
              <label>Manager</label>
              <input formControlName="manager" type="text" placeholder="Enter manager name">
            </div>

            <div class="form-group">
              <label>Primary Color</label>
              <input formControlName="color" type="color">
            </div>

            <div class="form-group">
              <label>Season</label>
              <select formControlName="season">
                <option value="" disabled selected>Select Season</option>
                <option *ngFor="let season of seasons" [value]="season._id">{{ season.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Division</label>
              <select formControlName="division">
                <option value="" disabled selected>Select Division</option>
                <option *ngFor="let division of divisionsForSelectedSeason" [value]="division._id">{{ division.name }}</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="submit" class="primary-button" [disabled]="!clubForm.valid">
                {{ editingClub ? 'Update' : 'Add' }}
              </button>
              <button type="button" class="secondary-button" (click)="cancelClubForm()">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clubs-page {
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

    .club-details {
      display: grid;
      gap: 16px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-item label {
      color: #90caf9;
      font-size: 0.9rem;
    }

    .detail-item p {
      color: #fff;
      margin: 0;
    }

    .color-preview {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      border: 1px solid #394867;
    }

    .seasons-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .season-tag {
      background: #394867;
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9rem;
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

    .form-group input,
    .form-group select {
      width: 100%;
      background: #2c3446;
      border: 1px solid #394867;
      border-radius: 6px;
      padding: 8px 12px;
      color: #fff;
    }

    .file-upload {
      display: flex;
      flex-direction: column;
      gap: 8px;
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
    }

    .upload-status {
      color: #90caf9;
      font-size: 0.9rem;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    @media (max-width: 768px) {
      .clubs-page {
        padding: 16px;
      }

      .content-grid {
        grid-template-columns: 1fr;
      }

      .modal-content {
        margin: 16px;
      }
    }
  `]
})
export class ClubsComponent implements OnInit {
  clubs: Club[] = [];
  clubForm: FormGroup;
  isAddingClub = false;
  editingClub: Club | null = null;
  divisions: Division[] = [];
  seasons: any[] = [];
  logoPreview: string | ArrayBuffer | null = null;
  uploadingLogo = false;

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.clubForm = this.fb.group({
      name: ['', Validators.required],
      logo: ['', Validators.required],
      manager: ['', Validators.required],
      color: ['#3498db', Validators.required],
      division: ['', Validators.required],
      season: ['', Validators.required]
    });
  }

  get divisionsForSelectedSeason(): Division[] {
    const selectedSeasonId = this.clubForm.get('season')?.value;
    return this.divisions.filter(d => d.seasonId === selectedSeasonId);
  }

  ngOnInit(): void {
    this.api.getSeasons().subscribe(seasons => this.seasons = seasons);
    this.api.getDivisions().subscribe(divisions => this.divisions = divisions);
    this.api.getClubs().subscribe(clubs => this.clubs = clubs);
    this.clubForm.get('season')?.valueChanges.subscribe(() => {
      this.clubForm.get('division')?.setValue('');
    });
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

  addClub(): void {
    if (this.clubForm.valid) {
      const form = this.clubForm.value;
      const clubData = {
        name: form.name,
        logoUrl: form.logo,
        manager: form.manager,
        primaryColour: form.color,
        seasons: [
          {
            seasonId: form.season,
            divisionIds: [form.division]
          }
        ]
      };
      this.api.addClub(clubData).subscribe(newClub => {
        this.clubs.push(newClub);
        this.cancelClubForm();
      });
    }
  }

  editClub(club: Club): void {
    this.editingClub = club;
    this.clubForm.patchValue({
      name: club.name,
      logo: club.logoUrl,
      manager: club.manager,
      color: club.primaryColour,
      season: club.seasons[0]?.seasonId,
      division: club.seasons[0]?.divisionIds[0]
    });
    this.logoPreview = club.logoUrl;
    this.isAddingClub = true;
  }

  updateClub(): void {
    if (this.clubForm.valid && this.editingClub) {
      const form = this.clubForm.value;
      const updated = {
        ...this.editingClub,
        name: form.name,
        logoUrl: form.logo,
        manager: form.manager,
        primaryColour: form.color,
        seasons: [
          {
            seasonId: form.season,
            divisionIds: [form.division]
          }
        ]
      };
      this.api.updateClub(updated).subscribe(updatedClub => {
        const idx = this.clubs.findIndex(c => c._id === updatedClub._id);
        if (idx > -1) this.clubs[idx] = updatedClub;
        this.cancelClubForm();
      });
    }
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
  }
} 