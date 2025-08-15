import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../store/services/api.service';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

interface Offer {
  _id: string;
  clubId: {
    _id: string;
    name: string;
    logoUrl?: string;
  };
  status: string;
}

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit {
  offers: Offer[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  userId: string | undefined;

  constructor(
    private apiService: ApiService,
    private auth: AuthService,
    private http: HttpClient
  ) {}

  // Method to get the full image URL
  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/square-default.png';
    }
    
    // If it's already a full URL, return as is
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // If it's a relative path starting with /uploads, prepend the API URL
    if (logoUrl.startsWith('/uploads/')) {
      return `${environment.apiUrl}${logoUrl}`;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }

  ngOnInit(): void {
    this.auth.user$.pipe(
      switchMap(user => {
        if (!user?.sub) {
          this.isLoading = false;
          this.error = 'You must be logged in to view your inbox.';
          throw new Error('User not authenticated');
        }
        
        // Get the MongoDB user ID by syncing with the database
        return this.auth.getAccessTokenSilently({
          authorizationParams: { audience: 'http://localhost:3000' }
        }).pipe(
          switchMap(token => 
            this.http.post(
              `${environment.apiUrl}/api/users/auth0-sync`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            )
          ),
          switchMap((dbUser: any) => {
            this.userId = dbUser._id;
            if (!this.userId) {
              throw new Error('Could not get user ID from database');
            }
            return this.apiService.getInboxOffers(this.userId);
          })
        );
      })
    ).subscribe({
      next: (offers) => {
        this.offers = offers;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading offers:', err);
        this.isLoading = false;
        if (!this.error) {
          this.error = 'Failed to load offers.';
        }
      }
    });
  }

  respondToOffer(offerId: string, response: 'accepted' | 'rejected'): void {
    this.apiService.respondToOffer(offerId, response).subscribe({
      next: () => {
        // Remove the offer from the list
        this.offers = this.offers.filter(offer => offer._id !== offerId);
      },
      error: (err) => {
        console.error(`Failed to ${response} offer:`, err);
        this.error = `An error occurred while trying to ${response} the offer.`;
      }
    });
  }
}
