import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { EashlService } from '../../services/eashl.service';
import { TransactionsService } from '../../store/services/transactions.service';
import { RosterUpdateService } from '../../store/services/roster-update.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

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
        <!-- Season Selector -->
        <div class="content-card">
          <h3>Season Selection</h3>
          <div class="season-selector" style="margin-bottom: 20px; border: 2px solid #e74c3c; padding: 15px; background: #2c3e50; border-radius: 8px;">
            <label for="viewSeason" style="display: block; margin-bottom: 8px; color: #ecf0f1; font-weight: 500;">View Clubs for Season:</label>
            <select id="viewSeason" [(ngModel)]="selectedSeasonId" (change)="onSeasonChange($event)" style="padding: 8px 12px; border: 1px solid #34495e; border-radius: 4px; background: #34495e; color: #ecf0f1; font-size: 14px; min-width: 200px;">
              <option *ngFor="let season of seasons" [value]="season._id">{{ season.name }}</option>
            </select>
            <span *ngIf="clubs.length > 0" style="margin-left: 10px; color: #90caf9;">
              Showing {{ clubs.length }} clubs in {{ getSelectedSeasonName() }}
            </span>
          </div>
          
          <!-- Debug Info -->
          <div style="background: #34495e; padding: 10px; margin-bottom: 15px; border-radius: 4px; color: #ecf0f1;">
            <strong>Debug Info:</strong> Seasons count: {{ seasons ? seasons.length : 0 }} | 
            Selected season: {{ selectedSeasonId || 'None' }}
          </div>
        </div>
        
        <!-- Clubs List -->
        <div class="content-card">
          <h3>All Clubs</h3>
          <div class="list-container">
            <div class="list-item" *ngFor="let club of clubs">
              <div class="list-item-content">
                <img [src]="getImageUrl(club.logoUrl)" [alt]="club.name" class="club-logo">
                <div>
                  <h4>{{ club.name }}</h4>
                  <p>{{ club.manager }}</p>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-button" (click)="viewClubDetails(club)">
                  <i class="fas fa-users"></i>
                </button>
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
        <div class="content-card" *ngIf="selectedClub">
          <h3>{{ selectedClub.name }} - Roster</h3>
          
          <div class="roster-section">
            <h4>Current Roster</h4>
            <div class="roster-list">
              <div class="roster-item" *ngFor="let player of filteredRoster">
                <span class="player-name">{{ player.discordUsername }}</span>
                <span class="player-position">{{ player.playerProfile?.position }}</span>
                <button class="icon-button delete" (click)="removePlayer(selectedClub, player)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="free-agents-section">
            <h4>Free Agents</h4>
            <div class="free-agents-list">
              <div class="free-agent-item" *ngFor="let agent of freeAgents">
                <span class="discord-id">{{ agent.discordUsername || agent.discordId }}</span>
                <span class="player-position">{{ agent.playerProfile?.position }}</span>
                <button class="icon-button" (click)="addPlayer(selectedClub, agent)">
                  <i class="fas fa-plus"></i>
                </button>
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
              <label>Seasons & Divisions</label>
              <div class="seasons-container">
                <div *ngFor="let season of seasons" class="season-item">
                  <div class="season-header">
                    <label class="season-checkbox">
                      <input type="checkbox" 
                             [checked]="isSeasonSelected(season._id)"
                             (change)="onSeasonToggle(season._id, $event)">
                      <span class="season-name">{{ season.name }}</span>
                    </label>
                  </div>
                  <div *ngIf="isSeasonSelected(season._id)" class="division-selector">
                    <select [formControlName]="'division_' + season._id" 
                            (change)="onDivisionChange(season._id, $event)">
                      <option value="">Select Division</option>
                      <option *ngFor="let division of getDivisionsForSeason(season._id)" 
                              [value]="division._id">{{ division.name }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Region</label>
              <input formControlName="region" type="text" placeholder="Enter region">
            </div>

            <div class="form-group">
              <label>Eashl Club ID</label>
              <input formControlName="eashlClubId" type="text" placeholder="Enter Eashl Club ID">
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

    .roster-section, .free-agents-section {
      margin-top: 24px;
    }

    .roster-section h4, .free-agents-section h4 {
      color: #90caf9;
      margin: 0 0 12px 0;
    }

    .roster-list, .free-agents-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .roster-item, .free-agent-item {
      background: #2c3446;
      border-radius: 6px;
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .player-position {
      color: #90caf9;
      font-size: 0.9rem;
      background: #394867;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .player-name {
      color: #fff;
      font-weight: 500;
    }

    .discord-id {
      color: #fff;
    }

    .seasons-container {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #394867;
      border-radius: 6px;
      padding: 12px;
      background: #1a1f2e;
    }

    .season-item {
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid #394867;
      border-radius: 6px;
      background: #23293a;
    }

    .season-header {
      margin-bottom: 8px;
    }

    .season-checkbox {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: #90caf9;
      font-weight: 500;
    }

    .season-checkbox input[type="checkbox"] {
      margin-right: 8px;
      accent-color: #1976d2;
    }

    .season-name {
      font-size: 1rem;
    }

    .division-selector {
      margin-left: 24px;
    }

    .division-selector select {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #394867;
      border-radius: 4px;
      background: #2c3446;
      color: #fff;
      font-size: 0.9rem;
    }

    .division-selector select:focus {
      outline: none;
      border-color: #1976d2;
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
      region: [''],
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
    
    // Set basic form values
    this.clubForm.patchValue({
      name: club.name,
      logo: club.logoUrl,
      manager: club.manager,
      color: club.primaryColour,
      region: club.region,
      eashlClubId: club.eashlClubId
    });
    
    // Set season and division values
    club.seasons?.forEach(seasonInfo => {
      let seasonId = seasonInfo.seasonId;
      if (typeof seasonId === 'object' && seasonId._id) {
        seasonId = seasonId._id;
      }
      
      if (seasonId) {
        const seasonControlName = `season_${seasonId}`;
        const divisionControlName = `division_${seasonId}`;
        
        this.clubForm.get(seasonControlName)?.setValue(true);
        this.clubForm.get(divisionControlName)?.setValue(seasonInfo.divisionIds?.[0] || '');
        
        // No need to load divisions - they're already loaded globally
      }
    });
  }

  updateClub(): void {
    if (this.clubForm.valid && this.editingClub) {
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
      
      const updated = {
        ...this.editingClub,
        name: form.name,
        logoUrl: form.logo,
        manager: form.manager,
        primaryColour: form.color,
        seasons: seasons,
        region: form.region,
        eashlClubId: form.eashlClubId
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
  }
} 