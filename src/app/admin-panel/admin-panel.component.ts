import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminPasswordService } from '../services/admin-password.service';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-panel.component.html'
})
export class AdminPanelComponent implements OnInit {
  constructor(
    private adminPasswordService: AdminPasswordService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    // Check if user is authenticated with Auth0
    this.auth.isAuthenticated$.subscribe(isAuth => {
      console.log('AdminPanel - Auth0 authenticated:', isAuth);
      
      if (!isAuth) {
        // User is not authenticated with Auth0, clear admin password verification
        console.log('AdminPanel - User not authenticated, clearing admin password verification');
        this.adminPasswordService.resetAdminPasswordVerification();
        this.router.navigate(['/admin-password']);
        return;
      }
      
      // User is authenticated, check admin password
      if (!this.adminPasswordService.isAdminPasswordVerified()) {
        console.log('Admin password not verified, redirecting to password page');
        this.router.navigate(['/admin-password']);
      }
    });
  }
} 