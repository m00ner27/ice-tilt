import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';

import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ImageUrlService } from '../shared/services/image-url.service';

// Import selectors
import * as UsersSelectors from '../store/users.selectors';

interface Offer {
  _id: string;
  clubId: string;
  clubName: string;
  clubLogoUrl?: string;
  userId: string;
  playerName: string;
  seasonId?: string;
  seasonName?: string;
  sentBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observable selectors
  inboxOffers$: Observable<Offer[]>;
  offersLoading$: Observable<boolean>;
  offersError$: Observable<any>;
  
  // Local state
  userId: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private imageUrlService: ImageUrlService
  ) {
    // Initialize selectors
    this.inboxOffers$ = this.store.select(UsersSelectors.selectInboxOffers);
    this.offersLoading$ = this.store.select(UsersSelectors.selectOffersLoading);
    this.offersError$ = this.store.select(UsersSelectors.selectOffersError);
  }

  ngOnInit(): void {
    this.setupAuthSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAuthSubscription() {
    this.auth.user$.pipe(
      takeUntil(this.destroy$),
      switchMap(user => {
        if (!user?.sub) {
          this.isLoading = false;
          this.error = 'You must be logged in to view your inbox.';
          throw new Error('User not authenticated');
        }
        
        // Get the MongoDB user ID by syncing with the database
        // Use NgRx to sync with Auth0 and get user data
        this.ngrxApiService.auth0Sync();
        
        // Subscribe to the current user from the store
        return this.store.select(UsersSelectors.selectCurrentUser).pipe(
          switchMap((dbUser: any) => {
            if (!dbUser || !dbUser._id) {
              throw new Error('Could not get user ID from database');
            }
            
            this.userId = dbUser._id;
            
            // Load inbox offers using NgRx
            this.ngrxApiService.loadInboxOffers(this.userId!);
            return this.inboxOffers$;
          })
        );
      })
    ).subscribe({
      next: (offers) => {
        this.isLoading = false;
        this.error = null;
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
    // Find the offer before removing it
    this.inboxOffers$.pipe(takeUntil(this.destroy$)).subscribe(offers => {
      const offer = offers.find(offer => offer._id === offerId);
      if (!offer) {
        console.error('Offer not found:', offerId);
        return;
      }

      console.log(`Responding to offer ${offerId} with ${response}`);
      console.log('Offer details:', offer);

      // Use NgRx to respond to offer
      this.ngrxApiService.respondToOffer(offerId, response);

      // Show success message
      const message = response === 'accepted' 
        ? `You have accepted the offer from ${offer.clubName}!`
        : `You have declined the offer from ${offer.clubName}.`;
      
      alert(message);
    });
  }

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }
}