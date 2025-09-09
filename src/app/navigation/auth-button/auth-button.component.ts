import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auth-button',
  standalone: true,
  imports: [CommonModule], // Allows the use of *ngIf and async pipe
  templateUrl: './auth-button.component.html',
  styleUrls: ['./auth-button.component.css'],
})
export class AuthButtonComponent {
  vm$!: Observable<{ showLogin: boolean; loading: boolean; isAuth: boolean }>;

  constructor(public auth: AuthService) {
    this.vm$ = combineLatest([this.auth.isLoading$, this.auth.isAuthenticated$, this.auth.user$]).pipe(
      map(([loading, isAuth, user]) => ({
        showLogin: !loading && !isAuth && !user,
        loading,
        isAuth
      }))
    );
  }

  // Auth0 method for logging in
  login() {
    this.auth.loginWithPopup({
      authorizationParams: {
        audience: environment.apiAudience,
        scope: 'openid profile email offline_access'
      }
    }).subscribe();
  }

  // Auth0 method for logging out
  logout() {
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }
}

