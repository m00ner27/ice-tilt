import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [RouterOutlet, AdminDashboardComponent],
  template: `<router-outlet></router-outlet>`
})
export class AdminPanelComponent {} 