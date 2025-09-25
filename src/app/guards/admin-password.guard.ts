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
    // Check if we're already on the admin-password page
    if (route.url[0]?.path === 'admin-password') {
      return true; // Allow access to the password page
    }
    
    // Check if admin password is verified
    const isPasswordVerified = this.adminPasswordService.isAdminPasswordVerified();
    
    if (!isPasswordVerified) {
      // Password not verified, redirect to password page
      this.router.navigate(['/admin-password']);
      return false;
    }
    
    // Password is verified, allow access
    return true;
  }
}
