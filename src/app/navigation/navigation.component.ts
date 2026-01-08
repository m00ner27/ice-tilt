import { Component, HostListener, ElementRef } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AuthButtonComponent } from './auth-button/auth-button.component';
import { AuthService } from '@auth0/auth0-angular';
import { ApiService } from '../store/services/api.service';
import { AdminPasswordService } from '../services/admin-password.service';
import { Observable, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';
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
  isLeagueDropdownOpen = false;
  isAdmin$: Observable<boolean>;
  isManager$: Observable<boolean>;
  shouldShowLoginButton$: Observable<boolean>;
  isInAdminPanel$: Observable<boolean>;
  
  constructor(
    public auth: AuthService, 
    private api: ApiService, 
    private store: Store<AppState>,
    public adminPasswordService: AdminPasswordService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    // Debug authentication state
    this.auth.isAuthenticated$.subscribe(isAuth => {
      console.log('Navigation - User authenticated:', isAuth);
    });
    
    this.auth.user$.subscribe(user => {
      console.log('Navigation - User data:', user);
    });
    this.isAdmin$ = this.auth.isAuthenticated$.pipe(
      map(isAuth => {
        if (!isAuth) return false;
        return true; // Will be checked in template
      })
    );
    this.isManager$ = this.store.select(selectIsUserAnyManager);
    
    // Keep login button logic but it's hidden with CSS
    this.shouldShowLoginButton$ = combineLatest([
      this.adminPasswordService.isAdminPasswordVerified$,
      this.auth.isAuthenticated$
    ]).pipe(
      map(([isAdminPasswordVerified, isAuthenticated]) => {
        return isAdminPasswordVerified && !isAuthenticated;
      })
    );

    // Check if current route is in admin panel
    this.isInAdminPanel$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => {
        const isAdminRoute = event.url.startsWith('/admin') || event.url.startsWith('/admin-password');
        console.log('Navigation check - URL:', event.url, 'Is admin route:', isAdminRoute);
        return isAdminRoute;
      })
    );

    // Check if admin password is verified
    this.adminPasswordService.isAdminPasswordVerified$.subscribe(isVerified => {
      console.log('Navigation - Admin password verified:', isVerified);
    });
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  toggleLeagueDropdown() {
    this.isLeagueDropdownOpen = !this.isLeagueDropdownOpen;
  }

  closeLeagueDropdown() {
    this.isLeagueDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Check if click is outside the dropdown
    if (this.isLeagueDropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isLeagueDropdownOpen = false;
    }
  }
}


