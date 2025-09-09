import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { ScheduleBarComponent } from './schedule-bar/schedule-bar.component';
import { Store } from '@ngrx/store';
import { loginWithDiscordProfile } from './store/players.actions';
import { NgRxApiService } from './store/services/ngrx-api.service';
import { selectCurrentProfile } from './store/players.selectors';
import { PlayerProfile } from './store/models/models/player-profile.model';
import { Observable, combineLatest, filter } from 'rxjs';
import { take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    RouterModule,
    RouterOutlet,
    NavigationComponent,
    ScheduleBarComponent
  ],
})
export class AppComponent implements OnInit {
  isLoading = true;
  isLoggedIn = false;
  userProfile: User | undefined | null = null;
  currentProfile$!: Observable<PlayerProfile | undefined | null>;

  constructor(
    private auth: AuthService,
    private store: Store,
    private ngrxApiService: NgRxApiService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('App component initializing...');
    console.log('Current URL:', window.location.href);
    console.log('Current origin:', window.location.origin);
    this.currentProfile$ = this.store.select(selectCurrentProfile);
    
    // Debug Auth0 state
    this.auth.isLoading$.subscribe(loading => console.log('Auth loading:', loading));
    this.auth.isAuthenticated$.subscribe(isAuth => console.log('Auth authenticated:', isAuth));
    this.auth.user$.subscribe(user => console.log('Auth user:', user));

    // Debug access token - only when user is authenticated
    this.auth.isAuthenticated$.pipe(
      filter(isAuth => isAuth === true),
      take(1)
    ).subscribe(() => {
      console.log('User is authenticated, getting access token...');
      this.auth.getAccessTokenSilently().subscribe({
        next: (token) => {
          console.log('Access token available:', token ? 'Yes' : 'No');
          if (token) {
            console.log('Token preview:', token.substring(0, 20) + '...');
            console.log('Full token length:', token.length);
            console.log('Token audience claim:', this.getTokenAudience(token));
            
            // Test direct API call with token
            this.testDirectApiCall(token);
            
            // Test HTTP interceptor
            this.testHttpInterceptor();
          }
        },
        error: (error) => {
          console.log('Access token error:', error);
        }
      });
    });
    
    // Handle Auth0 callback with better error handling
    // Only handle callback if we're coming from Auth0 redirect
    if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
      this.auth.handleRedirectCallback().subscribe({
        next: (result) => {
          console.log('Auth0 callback result:', result);
          if (result) {
            console.log('User authenticated via callback');
            // The user will be automatically handled by the auth state
          }
        },
        error: (error) => {
          console.error('Auth0 callback error:', error);
          // Clear any corrupted state and try to re-authenticate
          const auth0Error = error as any;
          if (auth0Error.error === 'invalid_state' || error.message?.includes('Invalid state')) {
            console.log('Invalid state error detected - clearing all Auth0 data and redirecting to login...');
            // Clear all Auth0 related data
            this.clearAllAuth0Data();
            // No redirect; user can click Login to retry
          }
        }
      });
    }
    
    // Use combineLatest to handle multiple observables
    combineLatest([
      this.auth.isLoading$,
      this.auth.isAuthenticated$,
      this.auth.user$
    ]).pipe(
      filter(([loading, isAuth, user]) => !loading && isAuth && !!user)
    ).subscribe({
      next: ([_, __, user]) => {
        console.log('Auth flow - user authenticated:', user);
        if (!user) return; // Type guard to ensure user is not null
        
        this.isLoading = false;
        this.isLoggedIn = true;
        this.userProfile = user;
        console.log('User restored:', user);

        // Validate required Auth0 user fields
        if (!user.sub || !user.email || !user.name) {
          console.error('Missing required Auth0 user data:', user);
          return;
        }

        // Sync user with MongoDB using NgRx
        this.ngrxApiService.auth0Sync();
        this.store.dispatch(loginWithDiscordProfile({ discordProfile: user }));
      },
      error: (error) => {
        console.error('Auth error:', error);
        this.isLoading = false;
      }
    });
  }

  private clearAllAuth0Data() {
    // Clear localStorage items that might cause state issues
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('@@auth0') || key.startsWith('auth0') || key.includes('auth0'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage as well
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('@@auth0') || key.startsWith('auth0') || key.includes('auth0'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('Cleared all Auth0 data from localStorage and sessionStorage');
  }

  private getTokenAudience(token: string): string | null {
    try {
      // Decode JWT token to get audience claim
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.aud || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private testDirectApiCall(token: string): void {
    console.log('Testing direct API call with token...');
    fetch('http://localhost:3001/api/seasons', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('Direct API call response status:', response.status);
      if (response.ok) {
        console.log('Direct API call successful!');
        return response.json();
      } else {
        console.log('Direct API call failed:', response.status, response.statusText);
        return response.text();
      }
    })
    .then(data => {
      console.log('Direct API call data:', data);
    })
    .catch(error => {
      console.error('Direct API call error:', error);
    });
  }

  private testHttpInterceptor(): void {
    console.log('Testing HTTP interceptor...');
    
    // This should trigger the Auth0 HTTP interceptor
    this.http.get('http://localhost:3001/api/seasons').subscribe({
      next: (response) => {
        console.log('HTTP interceptor test successful!', response);
      },
      error: (error) => {
        console.log('HTTP interceptor test failed:', error.status, error.message);
      }
    });
  }
}
