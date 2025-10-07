import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminPasswordService } from '../services/admin-password.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-panel.component.html'
})
export class AdminPanelComponent implements OnInit {
  constructor(
    private adminPasswordService: AdminPasswordService,
    private router: Router
  ) {}

  ngOnInit() {
    // Double-check that admin password is verified
    if (!this.adminPasswordService.isAdminPasswordVerified()) {
      console.log('Admin password not verified, redirecting to password page');
      this.router.navigate(['/admin-password']);
    }
  }
} 