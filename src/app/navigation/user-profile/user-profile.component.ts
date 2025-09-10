import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store';
import { selectIsUserAnyManager, selectUserManagedClubs } from '../../store/managers.selectors';
import * as ManagersActions from '../../store/managers.actions';

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

  constructor(public auth: AuthService, private store: Store<AppState>) {
    this.isManager$ = this.store.select(selectIsUserAnyManager);
    this.managedClubs$ = this.store.select(selectUserManagedClubs);
  }

  ngOnInit() {
    // Log user data to the console
    this.auth.user$.subscribe((user) => {
      console.log('User:', user);
      if (user?.sub) {
        // Extract user ID from Auth0 sub and load manager data
        const userId = user.sub.split('|')[1];
        this.store.dispatch(ManagersActions.loadManagersByUser({ userId }));
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
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
    this.isDropdownOpen = false;
  }
}

