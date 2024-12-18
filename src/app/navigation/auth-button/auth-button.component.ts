import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-button',
  standalone: true,
  imports: [CommonModule], // Allows the use of *ngIf and async pipe
  template: `
    <!-- Show "Log in" button if the user is not authenticated -->
    <button *ngIf="!(auth.isAuthenticated$ | async)" (click)="login()">Log in</button>

    <!-- Show "Log out" button if the user is authenticated -->
    <button *ngIf="auth.isAuthenticated$ | async" (click)="logout()">Log out</button>
  `,
})
export class AuthButtonComponent {
  constructor(public auth: AuthService) {}

  // Auth0 method for logging in
  login() {
    this.auth.loginWithRedirect();
  }

  // Auth0 method for logging out
  logout() {
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }
}

