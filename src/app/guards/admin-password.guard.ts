import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AdminPasswordService } from '../services/admin-password.service';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminPasswordGuard implements CanActivate {
  constructor(
    private adminPasswordService: AdminPasswordService,
    private router: Router,
    private auth: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    console.log('AdminPasswordGuard - Checking route:', route.url);
    
    // Check if we're already on the admin-password page
    if (route.url[0]?.path === 'admin-password') {
      console.log('AdminPasswordGuard - Allowing access to password page');
      return of(true); // Allow access to the password page
    }
    
    // First check if user is authenticated with Auth0
    return this.auth.isAuthenticated$.pipe(
      switchMap(isAuth => {
        console.log('AdminPasswordGuard - Auth0 authenticated:', isAuth);
        
        if (!isAuth) {
          // User not authenticated, clear admin password and redirect to password page
          console.log('AdminPasswordGuard - User not authenticated, clearing admin password');
          this.adminPasswordService.resetAdminPasswordVerification();
          this.router.navigate(['/admin-password']);
          return of(false);
        }
        
        // User is authenticated, check admin password
        const isPasswordVerified = this.adminPasswordService.isAdminPasswordVerified();
        console.log('AdminPasswordGuard - Password verified:', isPasswordVerified);
        
        if (!isPasswordVerified) {
          // Password not verified, redirect to password page
          console.log('AdminPasswordGuard - Redirecting to password page');
          this.router.navigate(['/admin-password']);
          return of(false);
        }
        
        // Both Auth0 and admin password are verified, allow access
        console.log('AdminPasswordGuard - Allowing access to admin panel');
        return of(true);
      })
    );
  }
}
