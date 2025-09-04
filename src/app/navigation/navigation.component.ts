import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthButtonComponent } from './auth-button/auth-button.component'; // Correct path
import { UserProfileComponent } from './user-profile/user-profile.component';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterModule, CommonModule, AuthButtonComponent, UserProfileComponent],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
})
export class NavigationComponent {
  isMenuCollapsed = true;

  constructor() {
    console.log('Navigation component initialized!');
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}


