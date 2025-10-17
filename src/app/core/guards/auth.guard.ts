import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, take, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../store/services/api.service';

export const authGuard = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const api = inject(ApiService);

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

export const adminGuard = () => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  return auth.isAuthenticated$.pipe(
    take(1),
    switchMap(isAuthenticated => {
      if (!isAuthenticated) {
        // Redirect to admin password page instead of using popup
        return of(router.createUrlTree(['/admin-password']));
      }
      // User is authenticated, check if they have admin privileges
      return api.getMyAdminRecord().pipe(
        map((me: any) => !!me),
        catchError(() => of(false))
      );
    }),
    map(result => {
      if (result instanceof Object && 'commands' in result) {
        // This is a UrlTree (redirect)
        return result;
      }
      if (!result) {
        return router.createUrlTree(['/']);
      }
      return true;
    })
  );
};

export const superAdminGuard = () => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  return auth.isAuthenticated$.pipe(
    take(1),
    switchMap(isAuthenticated => {
      if (!isAuthenticated) {
        // Redirect to admin password page instead of using popup
        return of(router.createUrlTree(['/admin-password']));
      }
      return api.getMyAdminRecord().pipe(
        map((me: any) => !!me?.superAdmin),
        catchError(() => of(false))
      );
    }),
    map(result => {
      if (result instanceof Object && 'commands' in result) {
        // This is a UrlTree (redirect)
        return result;
      }
      if (!result) {
        return router.createUrlTree(['/']);
      }
      return true;
    })
  );
};
