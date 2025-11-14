import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AuthButtonComponent } from './auth-button/auth-button.component';
import { AuthService } from '@auth0/auth0-angular';
import { ApiService } from '../store/services/api.service';
import { AdminPasswordService } from '../services/admin-password.service';
import { Observable, combineLatest } from 'rxjs';
import { map, filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../store';
import { selectIsUserAnyManager } from '../store/managers.selectors';
import { LoggerService } from '../shared/services/logger.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterModule, CommonModule, UserProfileComponent, AuthButtonComponent],
  templateUrl: './navigation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationComponent {
  private destroy$ = new Subject<void>();
  isMenuCollapsed = true;
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
    private logger: LoggerService,
    private cdr: ChangeDetectorRef
  ) {
    // Use async observables instead of manual subscriptions for better performance
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
        return isAdminRoute;
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

}


