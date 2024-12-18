import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="auth.user$ | async as user">
      <h2>Welcome, {{ user.name }}!</h2>
      <img [src]="user.picture" alt="Profile Picture" />
      <p><strong>Email:</strong> {{ user.email }}</p>
    </div>
  `,
})
export class UserProfileComponent implements OnInit {
  constructor(public auth: AuthService) {}

  ngOnInit() {
    // Log user data to the console
    this.auth.user$.subscribe((user) => console.log('User:', user));
  }
}

