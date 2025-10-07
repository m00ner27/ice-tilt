import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AdminPasswordService } from '../services/admin-password.service';

@Injectable({
  providedIn: 'root'
})
export class AdminPasswordGuard implements CanActivate {
  constructor(
    private adminPasswordService: AdminPasswordService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    console.log('AdminPasswordGuard - Checking route:', route.url);
    
    // Check if we're already on the admin-password page
    if (route.url[0]?.path === 'admin-password') {
      console.log('AdminPasswordGuard - Allowing access to password page');
      return true; // Allow access to the password page
    }
    
    // Check if admin password is verified
    const isPasswordVerified = this.adminPasswordService.isAdminPasswordVerified();
    console.log('AdminPasswordGuard - Password verified:', isPasswordVerified);
    
    if (!isPasswordVerified) {
      // Password not verified, redirect to password page
      console.log('AdminPasswordGuard - Redirecting to password page');
      this.router.navigate(['/admin-password']);
      return false;
    }
    
    // Password is verified, allow access
    console.log('AdminPasswordGuard - Allowing access to admin panel');
    return true;
  }
}
