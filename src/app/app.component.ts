import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { ScheduleBarComponent } from './schedule-bar/schedule-bar.component';
import { Store } from '@ngrx/store';
import { loginWithDiscordProfile } from './store/players.actions';
import { selectCurrentProfile } from './store/players.selectors';
import { PlayerProfile } from './store/models/models/player-profile.model';
import { Observable, combineLatest, filter } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
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
  currentProfile$!: Observable<PlayerProfile | undefined | null>;

  constructor(
    private auth: AuthService,
    private store: Store,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.currentProfile$ = this.store.select(selectCurrentProfile);
    
    // Use combineLatest to handle multiple observables
    combineLatest([
      this.auth.isLoading$,
      this.auth.isAuthenticated$,
      this.auth.user$
    ]).pipe(
      filter(([loading, isAuth, user]) => !loading && isAuth && !!user)
    ).subscribe({
      next: ([_, __, user]) => {
        if (!user) return; // Type guard to ensure user is not null
        
        this.isLoading = false;
        this.isLoggedIn = true;
        this.userProfile = user;
        console.log('User restored:', user);

        // Validate required Auth0 user fields
        if (!user.sub || !user.email || !user.name) {
          console.error('Missing required Auth0 user data:', user);
          return;
        }

        // Sync user with MongoDB
        this.auth.getAccessTokenSilently({
          authorizationParams: { audience: environment.apiAudience }
        }).subscribe(token => {
          this.http.post(
            `${environment.apiUrl}/api/users/auth0-sync`,
            {}, // empty body
            { headers: { Authorization: `Bearer ${token}` } }
          ).subscribe({
            next: (dbUser) => {
              console.log('User synced with database:', dbUser);
              this.store.dispatch(loginWithDiscordProfile({ discordProfile: user }));
            },
            error: (error) => {
              console.error('Failed to sync user:', error);
              // You might want to show an error message to the user here
            }
          });
        });
      },
      error: (error) => {
        console.error('Auth error:', error);
        this.isLoading = false;
      }
    });
  }
}
