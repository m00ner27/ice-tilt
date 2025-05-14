import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service'; // Import ApiService
@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
        <section class="edit-profile-section mt-4">
          <div class="container">
            <h2 class="text-center mb-4">Manage Player Profiles</h2>
    
            <!-- Feedback messages -->
            <div *ngIf="profileFormLoading" class="alert alert-info">Processing...</div>
            <div *ngIf="profileFormError" class="alert alert-danger">{{ profileFormError }}</div>
            <div *ngIf="profileFormSuccess" class="alert alert-success">{{ profileFormSuccess }}</div>
    
            <!-- Add New Profile Form -->
            <div class="edit-profile-container card mb-4">
              <div class="card-header">Add New Profile</div>
              <div class="card-body">
                <form (ngSubmit)="submitNewProfile()">
                  <!-- Name -->
                  <div class="form-group">
                    <label for="newProfileName">Discord Name</label>
                    <input class="form-input form-control" id="newProfileName" type="text" [(ngModel)]="newProfile.name" name="newProfileName" required>
                  </div>
    
                  <!-- Location -->
                  <div class="form-group">
                    <label for="newProfileLocation">Location</label>
                    <select class="form-input form-control" id="newProfileLocation" [(ngModel)]="newProfile.location" name="newProfileLocation">
                      <option value="">Select location</option>
                      <optgroup label="North America">
                        <option value="Canada West">Canada West</option>
                        <option value="Canada Central">Canada Central</option>
                        <option value="Canada East">Canada East</option>
                        <option value="US West">US West</option>
                        <option value="US Central">US Central</option>
                        <option value="US East">US East</option>
                      </optgroup>
                      <optgroup label="Europe">
                        <!-- Add European countries from original template -->
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <!-- ... other countries -->
                      </optgroup>
                    </select>
                  </div>
    
                  <!-- Handedness -->
                  <div class="form-group">
                    <label for="newProfileHandedness">Handedness</label>
                    <select class="form-input form-control" id="newProfileHandedness" [(ngModel)]="newProfile.handedness" name="newProfileHandedness">
                      <option value="">Select handedness</option>
                      <option value="L">Left</option>
                      <option value="R">Right</option>
                      <option value="B">Both</option>
                    </select>
                  </div>
    
                  <!-- Number -->
                  <div class="form-group">
                    <label for="newProfileNumber">Number</label>
                    <input class="form-input form-control" id="newProfileNumber" type="number" [(ngModel)]="newProfile.number" name="newProfileNumber" min="0" max="99">
                  </div>
    
                  <!-- Primary Position -->
                  <div class="form-group">
                    <label for="newProfilePrimaryPosition">Primary Position</label>
                    <select class="form-input form-control" id="newProfilePrimaryPosition" [(ngModel)]="newProfile.primaryPosition" name="newProfilePrimaryPosition">
                      <option value="">Select primary position</option>
                      <option value="C">Center</option>
                      <option value="RW">Right Wing</option>
                      <option value="LW">Left Wing</option>
                      <option value="RD">Right Defense</option>
                      <option value="LD">Left Defense</option>
                      <option value="G">Goalie</option>
                    </select>
                  </div>
    
                  <!-- Secondary Positions -->
                  <div class="form-group">
                    <label>Secondary Positions</label>
                    <div class="secondary-positions">
                      <div *ngFor="let pos of availablePositions" class="position-option">
                        <input type="checkbox" [id]="'newProfilePos-' + pos" [value]="pos" (change)="toggleNewProfileSecondaryPosition(pos)" [checked]="newProfile.secondaryPositions.includes(pos)" class="position-checkbox">
                        <label [for]="'newProfilePos-' + pos">{{pos}}</label>
                      </div>
                    </div>
                  </div>
    
                  <!-- Bio -->
                  <div class="form-group">
                    <label for="newProfileBio">Bio</label>
                    <textarea class="form-input form-control" id="newProfileBio" rows="3" [(ngModel)]="newProfile.bio" name="newProfileBio"></textarea>
                  </div>

                  <!-- Stats - Simplified like SkaterData for now -->
                  <div class="row">
                    <div class="col-md-3 form-group">
                        <label for="newProfileGoals">Goals</label>
                        <input type="number" class="form-input form-control" id="newProfileGoals" [(ngModel)]="newProfile.stats.goals" name="newProfileGoals">
                    </div>
                    <div class="col-md-3 form-group">
                        <label for="newProfileAssists">Assists</label>
                        <input type="number" class="form-input form-control" id="newProfileAssists" [(ngModel)]="newProfile.stats.assists" name="newProfileAssists">
                    </div>
                     <div class="col-md-3 form-group">
                        <label for="newProfileGamesPlayed">Games Played</label>
                        <input type="number" class="form-input form-control" id="newProfileGamesPlayed" [(ngModel)]="newProfile.stats.gamesPlayed" name="newProfileGamesPlayed">
                    </div>
                  </div>
    
                  <div class="form-actions">
                    <button type="submit" class="save-button btn btn-success">Add Profile</button>
                  </div>
                </form>
              </div>
            </div>
    
            <!-- Display Existing Profiles -->
            <div class="card">
              <div class="card-header">Existing Player Profiles</div>
              <div class="card-body">
                <button (click)="loadPlayerProfiles()" class="btn btn-primary mb-3">Refresh Profiles List</button>
                <div *ngIf="profilesListLoading" class="text-center"><p>Loading profiles...</p></div>
                <div *ngIf="profilesListError" class="alert alert-danger">{{ profilesListError }}</div>
                <table *ngIf="!profilesListLoading && playerProfiles.length > 0" class="table table-striped">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Primary Pos</th>
                      <th>Number</th>
                      <th>Goals</th>
                      <th>Assists</th>
                      <th>Games</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let profile of playerProfiles">
                      <td>{{ profile.name }}</td>
                      <td>{{ profile.location }}</td>
                      <td>{{ profile.primaryPosition }}</td>
                      <td>{{ profile.number }}</td>
                      <td>{{ profile.stats?.goals }}</td>
                      <td>{{ profile.stats?.assists }}</td>
                      <td>{{ profile.stats?.gamesPlayed }}</td>
                    </tr>
                  </tbody>
                </table>
                <div *ngIf="!profilesListLoading && playerProfiles.length === 0 && !profilesListError" class="alert alert-info">
                  No player profiles found. Add one using the form above.
                </div>
              </div>
            </div>
    
          </div>
        </section>
      `,
  styles: [
    // Add relevant styles from the original edit-profile or new ones as needed
    // For example, for .form-group, .form-input, .save-button, .secondary-positions
    `
        .edit-profile-section { padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        h2 { color: white; }
        .card-header { font-weight: bold; }
        .edit-profile-container, .card { background-color: #1a252f; border: 1px solid #34495e; border-radius: 8px; padding: 20px; color:white; }
        .form-group { margin-bottom: 15px; }
        label { display: block; color: white; margin-bottom: 5px; font-weight: 500; }
        .form-input, .form-control { /* Ensure form-control is targeted if bootstrap is overriding */
          width: 100%;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #34495e;
          background-color: #2c3e50; /* Darker input background */
          color: white;
        }
        .form-input::placeholder { color: #8795a5; }
        .form-input:focus { outline: none; border-color: #3498db; }
        .secondary-positions { background-color: #2c3e50; border: 1px solid #34495e; border-radius: 4px; padding: 10px; margin-top: 5px; }
        .position-option { display: inline-flex; align-items: center; margin-right: 15px; margin-bottom: 5px;}
        .position-checkbox { margin-right: 5px; }
        .position-option label { margin: 0; font-weight: normal; } /* override general label for checkbox label */
        .save-button { /* Re-style to match Bootstrap btn-success or your theme */ }
        select.form-input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 16px;
          padding-right: 32px; /* Make space for arrow */
        }
        optgroup { background-color: #1a252f; color: #3498db; font-weight: 500; }
        optgroup option { background-color: #1a252f; color: white; padding: 8px; }
        `
  ]
})
export class EditProfileComponent implements OnInit {
  availablePositions = ['C', 'RW', 'LW', 'RD', 'LD', 'G'];

  // For the "Add New Profile" Form
  newProfile: any = this.initializeNewProfile();

  // For listing existing profiles
  playerProfiles: any[] = [];
  profilesListLoading: boolean = false;
  profilesListError: string = '';

  // Form submission status
  profileFormLoading: boolean = false;
  profileFormError: string = '';
  profileFormSuccess: string = '';

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.loadPlayerProfiles();
  }

  initializeNewProfile(): any {
    return {
      name: '',
      location: '',
      handedness: '',
      number: null,
      primaryPosition: '',
      secondaryPositions: [] as string[],
      bio: '',
      stats: {
        goals: 0,
        assists: 0,
        gamesPlayed: 0
        // yellowCards: 0, // Add if in your model
        // redCards: 0    // Add if in your model
      }
    };
  }

  loadPlayerProfiles() {
    this.profilesListLoading = true;
    this.profilesListError = '';
    this.apiService.getPlayerProfiles().subscribe({
      next: (data) => {
        this.playerProfiles = data;
        this.profilesListLoading = false;
      },
      error: (err) => {
        this.profilesListError = `Failed to load profiles: ${err.message || 'Server error'}`;
        this.profilesListLoading = false;
        console.error('Error loading player profiles:', err);
      }
    });
  }

  toggleNewProfileSecondaryPosition(position: string) {
    const index = this.newProfile.secondaryPositions.indexOf(position);
    if (index === -1) {
      this.newProfile.secondaryPositions.push(position);
    } else {
      this.newProfile.secondaryPositions.splice(index, 1);
    }
  }

  submitNewProfile() {
    if (!this.newProfile.name) {
      this.profileFormError = 'Discord Name is required.';
      return;
    }
    this.profileFormLoading = true;
    this.profileFormError = '';
    this.profileFormSuccess = '';

    this.apiService.addPlayerProfile(this.newProfile).subscribe({
      next: (response) => {
        this.profileFormLoading = false;
        this.profileFormSuccess = 'Profile added successfully!';
        this.playerProfiles.push(response); // Add to the list
        this.newProfile = this.initializeNewProfile(); // Reset form
        setTimeout(() => this.profileFormSuccess = '', 3000); // Clear success message
      },
      error: (err) => {
        this.profileFormLoading = false;
        this.profileFormError = `Failed to add profile: ${err.error?.message || err.message || 'Server error'}`;
        console.error('Error adding player profile:', err);
        setTimeout(() => this.profileFormError = '', 5000); // Clear error message
      }
    });
  }
}