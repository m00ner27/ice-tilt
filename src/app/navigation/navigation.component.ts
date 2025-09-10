import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthButtonComponent } from './auth-button/auth-button.component'; // Correct path
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AuthService } from '@auth0/auth0-angular';
import { ApiService } from '../store/services/api.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../store';
import { selectIsUserAnyManager } from '../store/managers.selectors';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterModule, CommonModule, AuthButtonComponent, UserProfileComponent],
  templateUrl: './navigation.component.html',
})
export class NavigationComponent {
  isMenuCollapsed = true;
  isAdmin$: Observable<boolean>;
  isManager$: Observable<boolean>;

  constructor(public auth: AuthService, private api: ApiService, private store: Store<AppState>) {
    console.log('Navigation component initialized!');
    this.isAdmin$ = this.auth.isAuthenticated$.pipe(
      map(isAuth => {
        if (!isAuth) return false;
        return true; // Will be checked in template
      })
    );
    this.isManager$ = this.store.select(selectIsUserAnyManager);
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}


