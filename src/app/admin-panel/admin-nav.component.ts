import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [RouterModule],
  template: `
    <nav class="admin-nav">
      <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
      <a routerLink="/admin/seasons" routerLinkActive="active">Seasons</a>
      <a routerLink="/admin/clubs" routerLinkActive="active">Clubs</a>
      <!-- Add more links as you add more admin features -->
    </nav>
  `,
  styleUrls: ['./admin-nav.component.css']
})
export class AdminNavComponent {} 