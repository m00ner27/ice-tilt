import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { ScheduleBarComponent } from './schedule-bar/schedule-bar.component';
import { Store } from '@ngrx/store';
import { loginWithDiscordProfile } from './store/players.actions';
import { selectCurrentProfile } from './store/players.selectors';
import { PlayerProfile } from './store/models/models/player-profile.model';
import { Observable } from 'rxjs';

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
    private store: Store
  ) {}

  ngOnInit(): void {
    this.currentProfile$ = this.store.select(selectCurrentProfile);
    this.auth.isLoading$.subscribe((loading) => {
      this.isLoading = loading;

      if (!loading) {
        this.auth.isAuthenticated$.subscribe((isAuth) => {
          this.isLoggedIn = isAuth;

          if (isAuth) {
            this.auth.user$.subscribe((user) => {
              this.userProfile = user;
              console.log('User restored:', user);

              if (user) {
                this.store.dispatch(loginWithDiscordProfile({ discordProfile: user }));
              }
            });
          }
        });
      }
    });
  }
}
