import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../store/services/api.service';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

interface FreeAgent {
  _id: string;
  discordUsername: string;
  // Add other relevant properties you want to display
}

@Component({
  selector: 'app-manager-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-view.component.html',
  styleUrls: ['./manager-view.component.css']
})
export class ManagerViewComponent implements OnInit {
  freeAgents: FreeAgent[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  notification: { type: 'success' | 'error', message: string } | null = null;
  
  // Mock manager's club ID for now
  // In a real app, you'd get this based on the logged-in manager
  managerClubId: string = '6646848972d35a16d557f929'; 
  managerUserId: string | undefined;

  constructor(
    private apiService: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.auth.user$.pipe(
      switchMap(user => {
        if (user?.sub) {
          this.managerUserId = user.sub.split('|')[1];
        }
        return of(null);
      })
    ).subscribe();

    this.loadFreeAgents();
  }

  loadFreeAgents(): void {
    this.isLoading = true;
    this.apiService.getFreeAgents().subscribe({
      next: (agents) => {
        this.freeAgents = agents;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading free agents:', error);
        this.isLoading = false;
        this.error = 'Failed to load free agents.';
      }
    });
  }

  sendOffer(agentId: string): void {
    if (!this.managerUserId) {
        this.showNotification('error', 'Could not identify the manager. Please log in again.');
        return;
    }
    const offerData = {
      clubId: this.managerClubId,
      userId: agentId,
      sentBy: this.managerUserId
    };
    
    this.apiService.sendContractOffer(offerData).subscribe({
      next: () => {
        this.showNotification('success', 'Offer sent successfully!');
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Failed to send offer.';
        this.showNotification('error', errorMessage);
        console.error('Error sending offer:', error);
      }
    });
  }

  showNotification(type: 'success' | 'error', message: string) {
    this.notification = { type, message };
    setTimeout(() => this.notification = null, 5000);
  }
}
