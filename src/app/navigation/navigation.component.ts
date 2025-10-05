import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AuthButtonComponent } from './auth-button/auth-button.component';
import { AuthService } from '@auth0/auth0-angular';
import { ApiService } from '../store/services/api.service';
import { AdminPasswordService } from '../services/admin-password.service';
import { Observable, of, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../store';
import { selectIsUserAnyManager } from '../store/managers.selectors';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterModule, CommonModule, UserProfileComponent, AuthButtonComponent],
  templateUrl: './navigation.component.html',
})
export class NavigationComponent {
  isMenuCollapsed = true;
  isAdmin$: Observable<boolean>;
  isManager$: Observable<boolean>;
  shouldShowLoginButton$: Observable<boolean>;
  
  constructor(
    public auth: AuthService, 
    private api: ApiService, 
    private store: Store<AppState>,
    private adminPasswordService: AdminPasswordService
  ) {
    this.isAdmin$ = this.auth.isAuthenticated$.pipe(
      map(isAuth => {
        if (!isAuth) return false;
        return true; // Will be checked in template
      })
    );
    this.isManager$ = this.store.select(selectIsUserAnyManager);
    
    // Show login button only if admin password is verified AND user is not authenticated
    this.shouldShowLoginButton$ = combineLatest([
      this.adminPasswordService.isAdminPasswordVerified$,
      this.auth.isAuthenticated$
    ]).pipe(
      map(([isAdminPasswordVerified, isAuthenticated]) => {
        return isAdminPasswordVerified && !isAuthenticated;
      })
    );
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

}


