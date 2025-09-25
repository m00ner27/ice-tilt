import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminPasswordService {
  private readonly ADMIN_PASSWORD = 'ITHL2024Admin!'; // Change this to your desired password
  // To change the password, update the ADMIN_PASSWORD constant above
  private isAdminPasswordVerifiedSubject = new BehaviorSubject<boolean>(false);
  public isAdminPasswordVerified$ = this.isAdminPasswordVerifiedSubject.asObservable();

  constructor() {
    // Check if admin password was previously verified in this session
    const stored = sessionStorage.getItem('adminPasswordVerified');
    if (stored === 'true') {
      this.isAdminPasswordVerifiedSubject.next(true);
    }
  }

  /**
   * Verify the admin password
   * @param password The password to verify
   * @returns true if password is correct, false otherwise
   */
  verifyAdminPassword(password: string): boolean {
    const isCorrect = password === this.ADMIN_PASSWORD;
    if (isCorrect) {
      this.isAdminPasswordVerifiedSubject.next(true);
      sessionStorage.setItem('adminPasswordVerified', 'true');
    }
    return isCorrect;
  }

  /**
   * Check if admin password is currently verified
   */
  isAdminPasswordVerified(): boolean {
    return this.isAdminPasswordVerifiedSubject.value;
  }

  /**
   * Reset admin password verification (logout)
   */
  resetAdminPasswordVerification(): void {
    this.isAdminPasswordVerifiedSubject.next(false);
    sessionStorage.removeItem('adminPasswordVerified');
  }

  /**
   * Check if user should see login button
   * Only show login button if admin password is verified
   */
  shouldShowLoginButton(): boolean {
    return this.isAdminPasswordVerified();
  }
}
