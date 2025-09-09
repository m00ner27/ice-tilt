import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export const authGuard = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return auth.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      
      // Trigger login with popup if not authenticated
      auth.loginWithPopup({
        authorizationParams: {
          audience: environment.apiAudience,
          scope: 'openid profile email offline_access'
        }
      }).subscribe();
      return false; // navigation will remain blocked until authenticated
    })
  );
}; 