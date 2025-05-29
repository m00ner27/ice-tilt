import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, take } from 'rxjs/operators';

export const authGuard = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return auth.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      
      // Redirect to login if not authenticated
      router.navigate(['/login']);
      return false;
    })
  );
}; 