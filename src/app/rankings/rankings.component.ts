import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../store/services/api.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface RankingEntry {
  rank: number;
  clubId: string;
  clubName: string;
  clubLogo?: string;
  totalRP: number;
  seasons: {
    seasonId: string;
    seasonName: string;
    placementRP: number;
    playoffRP: number;
    totalRP: number;
  }[];
}

@Component({
  selector: 'app-rankings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.css']
})
export class RankingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  rankings: RankingEntry[] = [];
  filteredRankings: RankingEntry[] = [];
  selectedRegion: string = 'all';
  isLoading: boolean = true;
  error: string | null = null;
  
  sortColumn: string = 'rank';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Expose Math for template
  Math = Math;

  constructor(
    private apiService: ApiService,
    private imageUrlService: ImageUrlService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRankings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRankings(): void {
    this.isLoading = true;
    this.error = null;
    
    const region = this.selectedRegion === 'all' ? undefined : this.selectedRegion;
    
    this.apiService.getRankings(region)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('[Rankings] Received data:', data);
          console.log('[Rankings] Selected region:', region);
          
          // Handle both single region array and multi-region response
          if (Array.isArray(data) && data.length > 0 && data[0].region) {
            // Multi-region response, use first region's rankings
            this.rankings = data[0].rankings || [];
            console.log('[Rankings] Multi-region response, using first region:', data[0].region, 'rankings:', this.rankings.length);
          } else if (Array.isArray(data)) {
            // Single region array
            this.rankings = data;
            console.log('[Rankings] Single region array, rankings count:', this.rankings.length);
          } else {
            this.rankings = [];
            console.log('[Rankings] No valid data, using empty array');
          }
          
          this.filteredRankings = [...this.rankings];
          this.sortRankings();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading rankings:', err);
          this.error = 'Failed to load rankings. Please try again later.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onRegionChange(): void {
    this.loadRankings();
  }

  sortRankings(): void {
    this.filteredRankings.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'clubName':
          aValue = a.clubName.toLowerCase();
          bValue = b.clubName.toLowerCase();
          break;
        case 'totalRP':
          aValue = a.totalRP;
          bValue = b.totalRP;
          break;
        default:
          aValue = a.rank;
          bValue = b.rank;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortRankings();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  getLogoUrl(logoUrl?: string): string {
    return this.imageUrlService.getImageUrl(logoUrl || '');
  }
}

