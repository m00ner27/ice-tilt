import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '@auth0/auth0-angular';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { ScheduleBarComponent } from './schedule-bar/schedule-bar.component';
import { HeaderAdComponent } from './components/adsense/header-ad.component';
import { FooterAdComponent } from './components/adsense/footer-ad.component';
import { Store } from '@ngrx/store';
import * as UsersActions from './store/users.actions';
import { combineLatest, filter } from 'rxjs';
import { take } from 'rxjs/operators';
import { PerformanceService } from './shared/services/performance.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    NavigationComponent,
    ScheduleBarComponent,
    HeaderAdComponent,
    FooterAdComponent
  ],
})
export class AppComponent implements OnInit {
  isLoading = true;
  isLoggedIn = false;
  userProfile: User | undefined | null = null;
  showAds = true; // Control ad visibility based on route

  constructor(
    private auth: AuthService,
    private store: Store,
    private router: Router,
    private performanceService: PerformanceService
  ) {
    // Mark app initialization start
    this.performanceService.mark('app-init-start');
    this.performanceService.logInitialLoad();
  }

  ngOnInit(): void {
    this.performanceService.mark('app-init-end');
    this.performanceService.measure('app-initialization', 'app-init-start', 'app-init-end');
    
    // Check route to determine if ads should be shown
    this.checkRouteForAds();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkRouteForAds();
      }
    });
    
    // Wait for a stable authenticated state, then perform a single sync
    this.performanceService.mark('auth-check-start');
    combineLatest([
      this.auth.isLoading$,
      this.auth.isAuthenticated$,
      this.auth.user$
    ]).pipe(
      filter(([loading, isAuth, user]) => !loading && isAuth && !!user),
      take(1)
    ).subscribe({
      next: ([_, __, user]) => {
        if (!user) return; // Type guard to ensure user is not null
        
        this.performanceService.mark('auth-check-end');
        this.performanceService.measure('authentication-check', 'auth-check-start', 'auth-check-end');
        
        this.isLoading = false;
        this.isLoggedIn = true;
        this.userProfile = user;

        // Validate required Auth0 user fields
        if (!user.sub || !user.email || !user.name) {
          return;
        }

        // Sync user with MongoDB via NgRx action; follow-up handled in effect
        this.store.dispatch(UsersActions.auth0Sync());
        
        // Check if user should be redirected to admin panel after login
        const adminRedirect = sessionStorage.getItem('adminRedirectAfterLogin');
        if (adminRedirect) {
          sessionStorage.removeItem('adminRedirectAfterLogin');
          this.router.navigate([adminRedirect]);
        }
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }

  private checkRouteForAds(): void {
    const url = this.router.url;
    // Hide ads on admin pages, profile pages, inbox, and test pages
    this.showAds = !url.startsWith('/admin') && 
                   !url.startsWith('/profile') && 
                   !url.startsWith('/edit-profile') &&
                   !url.startsWith('/inbox') &&
                   !url.startsWith('/test');
  }
}
