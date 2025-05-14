import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="edit-profile-section mt-4">
      <div class="container">
        <div *ngIf="auth.user$ | async as user">
          <h2 class="text-center mb-4">Edit Profile</h2>
          
          <div class="edit-profile-container">
            <!-- Name (Read-only) -->
            <div class="form-group">
              <label for="name">Discord Name</label>
              <input 
                class="form-input"
                id="name"
                type="text"
                [(ngModel)]="player.name"
                [readonly]="true"
                [ngClass]="{'readonly-input': true}">
            </div>

            <!-- Location -->
            <div class="form-group">
              <label for="location">Location</label>
              <select 
                class="form-input"
                id="location"
                [(ngModel)]="player.location">
                <option value="">Select your location</option>
                
                <!-- North American Regions -->
                <optgroup label="North America">
                  <option value="Canada West">Canada West</option>
                  <option value="Canada Central">Canada Central</option>
                  <option value="Canada East">Canada East</option>
                  <option value="US West">US West</option>
                  <option value="US Central">US Central</option>
                  <option value="US East">US East</option>
                </optgroup>

                <!-- European Countries -->
                <optgroup label="Europe">
                  <option value="Albania">Albania</option>
                  <option value="Andorra">Andorra</option>
                  <option value="Armenia">Armenia</option>
                  <option value="Austria">Austria</option>
                  <option value="Azerbaijan">Azerbaijan</option>
                  <option value="Belarus">Belarus</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                  <option value="Bulgaria">Bulgaria</option>
                  <option value="Croatia">Croatia</option>
                  <option value="Cyprus">Cyprus</option>
                  <option value="Czech Republic">Czech Republic</option>
                  <option value="Denmark">Denmark</option>
                  <option value="Estonia">Estonia</option>
                  <option value="Finland">Finland</option>
                  <option value="France">France</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Germany">Germany</option>
                  <option value="Greece">Greece</option>
                  <option value="Hungary">Hungary</option>
                  <option value="Iceland">Iceland</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Italy">Italy</option>
                  <option value="Kazakhstan">Kazakhstan</option>
                  <option value="Kosovo">Kosovo</option>
                  <option value="Latvia">Latvia</option>
                  <option value="Liechtenstein">Liechtenstein</option>
                  <option value="Lithuania">Lithuania</option>
                  <option value="Luxembourg">Luxembourg</option>
                  <option value="Malta">Malta</option>
                  <option value="Moldova">Moldova</option>
                  <option value="Monaco">Monaco</option>
                  <option value="Montenegro">Montenegro</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="North Macedonia">North Macedonia</option>
                  <option value="Norway">Norway</option>
                  <option value="Poland">Poland</option>
                  <option value="Portugal">Portugal</option>
                  <option value="Romania">Romania</option>
                  <option value="Russia">Russia</option>
                  <option value="San Marino">San Marino</option>
                  <option value="Serbia">Serbia</option>
                  <option value="Slovakia">Slovakia</option>
                  <option value="Slovenia">Slovenia</option>
                  <option value="Spain">Spain</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Turkey">Turkey</option>
                  <option value="Ukraine">Ukraine</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Vatican City">Vatican City</option>
                </optgroup>
              </select>
            </div>

            <!-- Handedness -->
            <div class="form-group">
              <label for="handedness">Handedness</label>
              <select 
                class="form-input"
                id="handedness"
                [(ngModel)]="player.handedness">
                <option value="">Select handedness</option>
                <option value="L">Left</option>
                <option value="R">Right</option>
                <option value="B">Both</option>
              </select>
            </div>

            <!-- Number -->
            <div class="form-group">
              <label for="number">Number</label>
              <input 
                class="form-input"
                id="number"
                type="number"
                [(ngModel)]="player.number"
                placeholder="Your jersey number"
                min="0"
                max="99">
            </div>

            <!-- Primary Position -->
            <div class="form-group">
              <label for="primaryPosition">Primary Position</label>
              <select 
                class="form-input"
                id="primaryPosition"
                [(ngModel)]="player.primaryPosition">
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
                <div *ngFor="let position of availablePositions" class="position-option">
                  <input 
                    type="checkbox"
                    [id]="'pos-' + position"
                    [value]="position"
                    [checked]="player.secondaryPositions?.includes(position)"
                    (change)="toggleSecondaryPosition(position)"
                    class="position-checkbox">
                  <label [for]="'pos-' + position">{{position}}</label>
                </div>
              </div>
            </div>

            <!-- Bio -->
            <div class="form-group">
              <label for="bio">Bio</label>
              <textarea 
                class="form-input"
                id="bio"
                rows="4"
                [(ngModel)]="player.bio"
                placeholder="Tell us about yourself..."></textarea>
            </div>

            <div class="form-actions">
              <button 
                class="save-button"
                (click)="saveProfile()">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .edit-profile-section {
      padding: 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    h2 {
      color: white;
    }

    .edit-profile-container {
      background-color: #1a252f;
      border: 1px solid #34495e;
      border-radius: 8px;
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      color: white;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .form-input {
      width: 100%;
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #34495e;
      background-color: #1a252f;
      color: white;
    }

    .form-input::placeholder {
      color: #8795a5;
    }

    .form-input:focus {
      outline: none;
      border-color: #3498db;
    }

    .secondary-positions {
      background-color: #1a252f;
      border: 1px solid #34495e;
      border-radius: 4px;
      padding: 15px;
    }

    .position-option {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .position-checkbox {
      margin-right: 8px;
    }

    .position-option label {
      margin: 0;
      color: #8795a5;
    }

    .form-actions {
      margin-top: 20px;
    }

    .save-button {
      padding: 8px 16px;
      border-radius: 4px;
      border: 1px solid #3498db;
      background-color: transparent;
      color: #3498db;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .save-button:hover {
      background-color: #3498db;
      color: white;
    }

    select.form-input {
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 16px;
      padding-right: 32px;
    }

    textarea.form-input {
      resize: vertical;
      min-height: 100px;
    }

    .readonly-input {
      background-color: #2c3e50 !important;
      cursor: not-allowed;
      opacity: 0.8;
    }

    /* Style for optgroups */
    optgroup {
      background-color: #1a252f;
      color: #3498db;
      font-weight: 500;
    }

    optgroup option {
      background-color: #1a252f;
      color: white;
      padding: 8px;
    }
  `]
})
export class EditProfileComponent implements OnInit {
  availablePositions = ['C', 'RW', 'LW', 'RD', 'LD', 'G'];
  
  player: any = {
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
      gamesPlayed: 0,
      yellowCards: 0,
      redCards: 0
    }
  };

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    // Get the authenticated user's data
    this.auth.user$.subscribe(user => {
      if (user) {
        // Initialize player data with user's information
        this.player = {
          id: user.sub || '',
          name: user.name || '',
          location: '',
          handedness: '',
          number: null,
          primaryPosition: '',
          secondaryPositions: [],
          bio: '',
          stats: {
            goals: 0,
            assists: 0,
            gamesPlayed: 0,
            yellowCards: 0,
            redCards: 0
          }
        };

        // Load any existing player data from localStorage
        const savedPlayer = localStorage.getItem('editedPlayer');
        if (savedPlayer) {
          const parsedPlayer = JSON.parse(savedPlayer);
          this.player = { ...this.player, ...parsedPlayer };
        }
      }
    });
  }

  toggleSecondaryPosition(position: string) {
    if (!this.player.secondaryPositions) {
      this.player.secondaryPositions = [];
    }
    
    const index = this.player.secondaryPositions.indexOf(position);
    if (index === -1) {
      this.player.secondaryPositions.push(position);
    } else {
      this.player.secondaryPositions.splice(index, 1);
    }
  }

  saveProfile() {
    // For now, just log the updated player
    console.log('Updated player:', this.player);
    // Save to localStorage for persistence
    localStorage.setItem('editedPlayer', JSON.stringify(this.player));
    this.router.navigate(['/player-profile', this.player.id]);
  }

  login() {
    this.auth.loginWithRedirect();
  }

  logout() {
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }
}
