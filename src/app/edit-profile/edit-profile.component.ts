import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
})
export class EditProfileComponent implements OnInit {
  availablePositions = ['C', 'RW', 'LW', 'RD', 'LD', 'G'];
  availableRegions = ['North America', 'Europe'];
  
  northAmericanCountries = [
    { name: 'USA', emoji: '🇺🇸' },
    { name: 'Canada', emoji: '🇨🇦' }
  ];

  europeanCountries = [
    { name: 'Albania', emoji: '🇦🇱' }, { name: 'Andorra', emoji: '🇦🇩' }, { name: 'Austria', emoji: '🇦🇹' }, 
    { name: 'Belarus', emoji: '🇧🇾' }, { name: 'Belgium', emoji: '🇧🇪' }, { name: 'Bosnia and Herzegovina', emoji: '🇧🇦' },
    { name: 'Bulgaria', emoji: '🇧🇬' }, { name: 'Croatia', emoji: '🇭🇷' }, { name: 'Czechia', emoji: '🇨🇿' },
    { name: 'Denmark', emoji: '🇩🇰' }, { name: 'Estonia', emoji: '🇪🇪' }, { name: 'Finland', emoji: '🇫🇮' },
    { name: 'France', emoji: '🇫🇷' }, { name: 'Germany', emoji: '🇩🇪' }, { name: 'Greece', emoji: '🇬🇷' },
    { name: 'Hungary', emoji: '🇭🇺' }, { name: 'Iceland', emoji: '🇮🇸' }, { name: 'Ireland', 'emoji': '🇮🇪' },
    { name: 'Italy', emoji: '🇮🇹' }, { name: 'Latvia', emoji: '🇱🇻' }, { name: 'Liechtenstein', emoji: '🇱🇮' },
    { name: 'Lithuania', emoji: '🇱🇹' }, { name: 'Luxembourg', emoji: '🇱🇺' }, { name: 'Malta', emoji: '🇲🇹' },
    { name: 'Moldova', emoji: '🇲🇩' }, { name: 'Monaco', emoji: '🇲🇨' }, { name: 'Montenegro', emoji: '🇲🇪' },
    { name: 'Netherlands', emoji: '🇳🇱' }, { name: 'North Macedonia', emoji: '🇲🇰' }, { name: 'Norway', emoji: '🇳🇴' },
    { name: 'Poland', emoji: '🇵🇱' }, { name: 'Portugal', emoji: '🇵🇹' }, { name: 'Romania', emoji: '🇷🇴' },
    { name: 'Russia', emoji: '🇷🇺' }, { name: 'Serbia', emoji: '🇷🇸' }, { name: 'Slovakia', emoji: '🇸🇰' },
    { name: 'Slovenia', emoji: '🇸🇮' }, { name: 'Spain', emoji: '🇪🇸' }, { name: 'Sweden', emoji: '🇸🇪' },
    { name: 'Switzerland', emoji: '🇨🇭' }, { name: 'Ukraine', emoji: '🇺🇦' }, { name: 'United Kingdom', emoji: '🇬🇧' }
  ];
  filteredCountries: { name: string, emoji: string }[] = [];

  user: any = null;
  form: any = {
    discordId: '',
    platform: 'PS5',
    gamertag: '',
    primaryPosition: 'C',
    secondaryPositions: [] as string[],
    handedness: 'Left',
    country: 'USA',
    region: 'North America',
  };
  loading = false;
  error = '';
  success = '';

  constructor(private http: HttpClient, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    this.loading = true;
    this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).subscribe({
      next: (token) => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        this.http.get(`${environment.apiUrl}/api/users/me`, { headers }).subscribe({
          next: (user: any) => {
            if (!user) {
              this.error = 'Failed to load user profile (user not found).';
              this.loading = false;
              return;
            }
            this.user = user;
            this.form.discordId = user.auth0Id || '';
            this.form.platform = user.platform || 'PS5';
            const discordName = user.nickname || user.name || '';
            if (user.gamertag && user.gamertag !== discordName && user.gamertag !== user.auth0Id) {
              this.form.gamertag = user.gamertag;
            } else {
              this.form.gamertag = '';
            }
            this.form.primaryPosition = user.playerProfile?.position || 'C';
            this.form.secondaryPositions = user.playerProfile?.secondaryPositions || [];
            this.form.handedness = user.playerProfile?.handedness || 'Left';
            this.form.country = user.playerProfile?.country || 'USA';
            this.form.region = user.playerProfile?.region || 'North America';
            this.onRegionChange();
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load user profile.';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to get access token.';
        this.loading = false;
      }
    });
  }

  onRegionChange() {
    if (this.form.region === 'North America') {
      this.filteredCountries = this.northAmericanCountries;
    } else if (this.form.region === 'Europe') {
      this.filteredCountries = this.europeanCountries;
    } else {
      this.filteredCountries = [];
    }
    if (!this.filteredCountries.find(c => c.name === this.form.country)) {
      this.form.country = this.filteredCountries[0]?.name;
    }
  }

  toggleSecondaryPosition(position: string) {
    const idx = this.form.secondaryPositions.indexOf(position);
    if (idx === -1) {
      this.form.secondaryPositions.push(position);
    } else {
      this.form.secondaryPositions.splice(idx, 1);
    }
  }

  submit() {
    this.loading = true;
    this.error = '';
    this.success = '';
    if (!this.form.gamertag) {
      this.error = 'Gamertag is required.';
      this.loading = false;
      return;
    }
    this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).subscribe({
      next: (token) => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        const update = {
          email: this.user.email,
          name: this.user.name,
          auth0Id: this.user.auth0Id,
          platform: this.form.platform,
          gamertag: this.form.gamertag || '',
          playerProfile: {
            position: this.form.primaryPosition,
            secondaryPositions: this.form.secondaryPositions,
            handedness: this.form.handedness,
            country: this.form.country,
            region: this.form.region,
            status: this.user.playerProfile?.status || 'Free Agent',
          }
        };
        this.http.put(`${environment.apiUrl}/api/users/${this.user._id}`, update, { headers }).subscribe({
          next: (updated: any) => {
            this.success = 'Profile updated!';
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to update profile.';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to get access token.';
        this.loading = false;
      }
    });
  }
}