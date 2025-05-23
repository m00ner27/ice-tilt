import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-button',
  standalone: true,
  imports: [CommonModule], // Allows the use of *ngIf and async pipe
  templateUrl: './auth-button.component.html',
  styleUrls: ['./auth-button.component.css'],
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

