import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store';
import { selectIsUserAnyManager, selectUserManagedClubs } from '../../store/managers.selectors';
import * as ManagersActions from '../../store/managers.actions';
import { AdminPasswordService } from '../../services/admin-password.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],

})
export class UserProfileComponent implements OnInit {
  isDropdownOpen: boolean = false;
  isManager$: Observable<boolean>;
  managedClubs$: Observable<any[]>;

  constructor(
    public auth: AuthService, 
    private store: Store<AppState>,
    private adminPasswordService: AdminPasswordService
  ) {
    this.isManager$ = this.store.select(selectIsUserAnyManager);
    this.managedClubs$ = this.store.select(selectUserManagedClubs);
  }

  ngOnInit() {
    // Log user data to the console
    this.auth.user$.subscribe((user) => {
      console.log('User:', user);
      if (user?.sub) {
        // Extract user ID from Auth0 sub and load manager data
        console.log('Auth0 sub field:', user.sub);
        const userId = user.sub.split('|')[2]; // Get the actual Discord ID, not 'discord'
        console.log('Extracted userId:', userId);
        
        // Only dispatch if we have a valid userId (not 'discord')
        if (userId && userId !== 'discord') {
          // TODO: Manager feature temporarily disabled
          // this.store.dispatch(ManagersActions.loadManagersByUser({ userId }));
          console.log('Manager loading disabled - feature temporarily disabled');
        } else {
          console.log('Skipping manager load - invalid userId:', userId);
        }
      }
    });
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
    // Reset admin password verification when logging out
    this.adminPasswordService.resetAdminPasswordVerification();
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
    this.isDropdownOpen = false;
  }
}

