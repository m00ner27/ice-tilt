import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],

})
export class UserProfileComponent implements OnInit {
  isDropdownOpen: boolean = false;
  isManager: boolean = false;

  constructor(public auth: AuthService) {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.isManager = user['isManager'] === true;
      }
    });
  }

  ngOnInit() {
    // Log user data to the console
    this.auth.user$.subscribe((user) => console.log('User:', user));
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  editProfile() {
    // TODO: Implement edit profile functionality
    console.log('Edit profile clicked');
    this.isDropdownOpen = false;
  }

  logout() {
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
    this.isDropdownOpen = false;
  }
}

