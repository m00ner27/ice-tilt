import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  isLoading = false;
  
  constructor(public auth: AuthService, private router: Router) {}
  
  ngOnInit() {
    // Clear any existing Auth0 state to prevent invalid state errors
    this.clearAuth0State();
    
    // Log Auth0 configuration for debugging
    console.log('Auth0 Configuration:', {
      domain: 'dev-51tl555qz78d354r.us.auth0.com',
      clientId: 'WgWpaLK0yww0VSuHQuvcKBAUWPCJcO4e',
      redirectUri: window.location.origin,
      audience: 'http://localhost:3000'
    });
    
    // Check if user is already authenticated
    this.auth.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        console.log('User is already authenticated, redirecting...');
        this.router.navigate(['/']);
      }
    });
    
    // Handle Auth0 errors
    this.auth.error$.subscribe(error => {
      if (error) {
        console.error('Auth0 error:', error);
        // Check if it's an Auth0 error with error property
        const auth0Error = error as any;
        if (auth0Error.error === 'invalid_state') {
          console.log('Invalid state error detected, clearing state...');
          this.clearAuth0State();
        }
        alert('Login error: ' + (error.message || auth0Error.error || 'Unknown error'));
      }
    });
  }
  
  private clearAuth0State() {
    // Clear localStorage items that might cause state issues
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('@@auth0') || key.startsWith('auth0'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('Cleared Auth0 state from localStorage');
  }
  
  signIn() {
    if (this.isLoading) {
      console.log('Login already in progress...');
      return;
    }
    
    this.isLoading = true;
    console.log('Login button clicked');
    console.log('Current origin:', window.location.origin);
    
    // Clear any existing Auth0 state before login
    this.clearAuth0State();
    
    // Check Auth0 state before attempting login
    this.auth.isLoading$.pipe(take(1)).subscribe(loading => {
      if (loading) {
        console.log('Auth0 is still loading, please wait...');
        this.isLoading = false;
        return;
      }
      
      this.auth.isAuthenticated$.pipe(take(1)).subscribe(isAuth => {
        if (isAuth) {
          console.log('User is already authenticated');
          this.router.navigate(['/']);
          this.isLoading = false;
          return;
        }
        
        console.log('Starting Auth0 login redirect...');
        
        // Use loginWithRedirect with proper error handling
        this.auth.loginWithRedirect({
          authorizationParams: {
            redirect_uri: window.location.origin,
            audience: 'http://localhost:3000',
            scope: 'openid profile email offline_access'
          }
        }).subscribe({
          next: (result) => {
            console.log('Login redirect initiated successfully');
            // Don't set isLoading to false here as the page will redirect
          },
          error: (error) => {
            console.error('Login redirect error:', error);
            alert('Login failed: ' + (error.message || 'Unknown error'));
            this.isLoading = false;
          }
        });
      });
    });
  }

  signInWithPopup() {
    if (this.isLoading) {
      console.log('Login already in progress...');
      return;
    }
    
    this.isLoading = true;
    console.log('Login with popup button clicked');
    
    // Clear any existing Auth0 state before login
    this.clearAuth0State();
    
    // Use loginWithPopup with audience for API calls
    this.auth.loginWithPopup({
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: 'http://localhost:3000',
        scope: 'openid profile email offline_access'
      }
    }).subscribe({
      next: (result) => {
        console.log('Login popup successful:', result);
        this.isLoading = false;
        
        // After successful login, try to get access token for API calls
        // Wait a moment for the authentication state to settle
        setTimeout(() => {
          this.auth.getAccessTokenSilently({
            authorizationParams: {
              audience: 'http://localhost:3000'
            }
          }).subscribe({
            next: (token) => {
              console.log('Access token obtained for API calls:', token ? 'Yes' : 'No');
              if (token) {
                console.log('Token preview:', token.substring(0, 20) + '...');
              }
            },
            error: (error) => {
              console.warn('Could not get access token for API calls:', error);
              // This is not critical for basic login - user can still use the app
            }
          });
        }, 1000);
        
        // Navigate to home page
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Login popup error:', error);
        alert('Login failed: ' + (error.message || 'Unknown error'));
        this.isLoading = false;
      }
    });
  }

  private async checkBackendAvailability(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/seasons', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend not available:', error);
      return false;
    }
  }

  clearStateAndRetry() {
    console.log('Clearing Auth0 state and retrying...');
    this.clearAuth0State();
    this.isLoading = false;
    // Force a page reload to clear any remaining state
    window.location.reload();
  }

  nuclearReset() {
    console.log('Nuclear reset - clearing everything...');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies (if any)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force logout from Auth0
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
    
    // Reload the page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  signOut() {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }
}
