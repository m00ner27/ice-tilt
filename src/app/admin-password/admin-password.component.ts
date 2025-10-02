import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminPasswordService } from '../services/admin-password.service';
import { AuthService } from '@auth0/auth0-angular';
import { take } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
          <img src="assets/images/1ithlwords.png" alt="League Logo" class="h-12 w-auto">
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Access Required
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Please enter the admin password to access the administrative panel
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form (ngSubmit)="onSubmit()" #passwordForm="ngForm" class="space-y-6">
            <div>
              <label for="adminPassword" class="block text-sm font-medium text-gray-700">
                Admin Password
              </label>
              <div class="mt-1">
                <input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  [(ngModel)]="password"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter admin password"
                  #passwordInput
                  (keydown.enter)="onSubmit()"
                />
              </div>
            </div>

            <div class="error-message" *ngIf="errorMessage">
              <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {{ errorMessage }}
              </div>
            </div>

            <div>
              <button
                type="submit"
                [disabled]="!password.trim() || isLoading"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span *ngIf="!isLoading">Verify Password</span>
                <span *ngIf="isLoading">Verifying...</span>
              </button>
            </div>

            <div class="text-center">
              <a 
                routerLink="/home" 
                class="text-sm text-blue-600 hover:text-blue-500"
              >
                ← Back to Home
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-message {
      margin-top: 1rem;
    }
  `]
})
export class AdminPasswordComponent implements OnInit {
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private adminPasswordService: AdminPasswordService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Check if admin password is already verified and user is authenticated
    if (this.adminPasswordService.isAdminPasswordVerified()) {
      this.auth.isAuthenticated$.pipe(take(1)).subscribe(isAuth => {
        if (isAuth) {
          // User is authenticated and password is verified, go to admin panel
          this.router.navigate(['/admin/dashboard']);
        }
      });
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.isLoading = true;
    
    if (!this.password.trim()) {
      this.errorMessage = 'Please enter a password';
      this.isLoading = false;
      return;
    }

    // Simulate a brief loading state for better UX
    setTimeout(() => {
      const isValid = this.adminPasswordService.verifyAdminPassword(this.password);
      
      if (isValid) {
        // Password verified, now check if user is authenticated
        this.auth.isAuthenticated$.pipe(take(1)).subscribe(isAuth => {
          if (isAuth) {
            // User is authenticated, go to admin panel
            this.router.navigate(['/admin/dashboard']);
          } else {
            // Store the intended destination for after Auth0 login
            sessionStorage.setItem('adminRedirectAfterLogin', '/admin/dashboard');
            
            // User needs to login with Auth0
            this.auth.loginWithRedirect({
              authorizationParams: {
                audience: environment.apiAudience,
                scope: 'openid profile email offline_access'
              }
            });
          }
        });
      } else {
        this.errorMessage = 'Invalid admin password. Please try again.';
        this.password = '';
      }
      
      this.isLoading = false;
    }, 500);
  }
}
