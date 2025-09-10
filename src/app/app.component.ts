import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { ScheduleBarComponent } from './schedule-bar/schedule-bar.component';
import { Store } from '@ngrx/store';
import * as UsersActions from './store/users.actions';
import { combineLatest, filter } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    RouterModule,
    RouterOutlet,
    NavigationComponent,
    ScheduleBarComponent
  ],
})
export class AppComponent implements OnInit {
  isLoading = true;
  isLoggedIn = false;
  userProfile: User | undefined | null = null;

  constructor(
    private auth: AuthService,
    private store: Store
  ) {}

  ngOnInit(): void {
    // Wait for a stable authenticated state, then perform a single sync
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
        
        this.isLoading = false;
        this.isLoggedIn = true;
        this.userProfile = user;

        // Validate required Auth0 user fields
        if (!user.sub || !user.email || !user.name) {
          return;
        }

        // Sync user with MongoDB via NgRx action; follow-up handled in effect
        this.store.dispatch(UsersActions.auth0Sync());
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }
}
