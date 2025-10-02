import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { ImageUrlService } from '../shared/services/image-url.service';

// Import selectors
import * as ClubsSelectors from '../store/clubs.selectors';

// Updated interface to match backend Club model
interface Club {
  _id?: string;
  name: string;
  logoUrl?: string;
  primaryColour?: string;
  seasons?: any[];
  roster?: any[];
}

@Component({
  selector: 'app-club-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './club-list.component.html'
})
export class ClubListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observable selectors
  clubs$: Observable<Club[]>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  
  // Local state for filtering
  filteredClubs: Club[] = [];
  searchText: string = '';

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private imageUrlService: ImageUrlService
  ) {
    // Initialize selectors
    this.clubs$ = this.store.select(ClubsSelectors.selectAllClubs);
    this.loading$ = this.store.select(ClubsSelectors.selectClubsLoading);
    this.error$ = this.store.select(ClubsSelectors.selectClubsError);
  }

  ngOnInit() {
    // Load clubs using NgRx
    this.ngrxApiService.loadClubs();
    
    // Subscribe to clubs changes for filtering
    this.clubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
      this.sortAndFilterClubs(clubs);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClubs() {
    this.ngrxApiService.loadClubs();
  }

  sortAndFilterClubs(clubs: Club[]) {
    // Sort clubs alphabetically
    const sortedClubs = [...clubs].sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    
    // Apply search filter
    if (!this.searchText) {
      this.filteredClubs = sortedClubs;
      return;
    }

    const searchTerm = this.searchText.toLowerCase();
    this.filteredClubs = sortedClubs.filter(club => 
      club.name.toLowerCase().includes(searchTerm)
    );
  }

  filterClubs() {
    // Get current clubs from store and apply filter
    this.clubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
      this.sortAndFilterClubs(clubs);
    });
  }

  // Method to get the full image URL using the centralized service
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  // Handle image loading errors
  onImageError(event: any, club: any): void {
    console.log('Image failed to load for club:', club.name, 'URL:', event.target.src);
    
    // Prevent infinite error loops - if we're already showing the default image, don't change it
    if (event.target.src.includes('square-default.png')) {
      console.log('Default image also failed to load, stopping error handling');
      return;
    }
    
    // Set the fallback image using the image service to ensure correct URL construction
    event.target.src = this.imageUrlService.getImageUrl(undefined);
  }
}