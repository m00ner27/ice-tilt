import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { TransactionsService } from '../store/services/transactions.service';
import { ApiService } from '../store/services/api.service';
import { RosterUpdateService } from '../store/services/roster-update.service';
import { Transaction } from '../store/models/models/transaction.interface';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  @Input() isPreview: boolean = false; // For home page preview

  transactions: Transaction[] = [];
  allTransactions: Transaction[] = [];
  seasons: any[] = [];
  allClubs: any[] = [];
  filteredClubs: any[] = [];
  selectedSeason: string = 'All';
  selectedClub: string = 'All';
  loading: boolean = true;
  error: string | null = null;
  
  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  totalTransactions: number = 0;
  hasNextPage: boolean = false;
  hasPrevPage: boolean = false;
  pageSize: number = 50;
  
  // Make Math available in template
  Math = Math;
  
  private destroy$ = new Subject<void>();

  constructor(
    private transactionsService: TransactionsService,
    private apiService: ApiService,
    private rosterUpdateService: RosterUpdateService
  ) {}

  ngOnInit() {
    this.loadInitialData();
    this.subscribeToRosterUpdates();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData() {
    this.loading = true;
    
    // Load seasons, clubs, and transactions in parallel
    combineLatest([
      this.apiService.getSeasons(),
      this.apiService.getClubs(),
      this.transactionsService.getTransactions(this.currentPage, this.pageSize)
    ]).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([seasons, clubs, transactionData]) => {
        this.seasons = seasons;
        this.allClubs = clubs;
        this.allTransactions = transactionData.transactions;
        this.currentPage = transactionData.pagination.currentPage;
        this.totalPages = transactionData.pagination.totalPages;
        this.totalTransactions = transactionData.pagination.totalTransactions;
        this.hasNextPage = transactionData.pagination.hasNextPage;
        this.hasPrevPage = transactionData.pagination.hasPrevPage;
        this.updateFilteredClubs();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading initial data:', error);
        this.error = 'Failed to load data';
        this.loading = false;
      }
    });
  }

  private subscribeToRosterUpdates() {
    this.rosterUpdateService.rosterUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        console.log('Roster update received:', event);
        this.handleRosterUpdate(event);
      });
  }

  private handleRosterUpdate(event: any) {
    // Reload transactions when roster changes occur
    this.transactionsService.getTransactions(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactionData) => {
          this.allTransactions = transactionData.transactions;
          this.currentPage = transactionData.pagination.currentPage;
          this.totalPages = transactionData.pagination.totalPages;
          this.totalTransactions = transactionData.pagination.totalTransactions;
          this.hasNextPage = transactionData.pagination.hasNextPage;
          this.hasPrevPage = transactionData.pagination.hasPrevPage;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error reloading transactions:', error);
        }
      });
  }

  updateFilteredClubs() {
    if (this.selectedSeason === 'All') {
      this.filteredClubs = [...this.allClubs].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Filter clubs that have transactions in the selected season
      const clubsInSeason = new Set<string>();
      
      this.allTransactions
        .filter(transaction => transaction.seasonName === this.selectedSeason)
        .forEach(transaction => {
          clubsInSeason.add(transaction.clubName);
        });
      
      this.filteredClubs = this.allClubs
        .filter(club => clubsInSeason.has(club.name))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  onSeasonChange() {
    this.updateFilteredClubs();
    // Reset club selection when season changes
    this.selectedClub = 'All';
    this.applyFilters();
  }

  onClubChange() {
    // Check if the selected club is still available in the filtered list
    if (this.selectedClub !== 'All' && !this.filteredClubs.some(club => club.name === this.selectedClub)) {
      this.selectedClub = 'All';
    }
    this.applyFilters();
  }

  applyFilters() {
    let filteredTransactions = [...this.allTransactions];

    // Filter by season
    if (this.selectedSeason !== 'All') {
      filteredTransactions = filteredTransactions.filter(
        transaction => transaction.seasonName === this.selectedSeason
      );
    }

    // Filter by club
    if (this.selectedClub !== 'All') {
      filteredTransactions = filteredTransactions.filter(
        transaction => transaction.clubName === this.selectedClub
      );
    }

    // Sort by date (newest first)
    filteredTransactions = filteredTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Limit to 5 transactions in preview mode
    if (this.isPreview) {
      this.transactions = filteredTransactions.slice(0, 5);
    } else {
      this.transactions = filteredTransactions;
    }
  }

  getTransactionIcon(transactionType: string): string {
    return transactionType === 'sign' ? 'fas fa-plus-circle' : 'fas fa-minus-circle';
  }

  getTransactionClass(transactionType: string): string {
    return transactionType === 'sign' ? 'text-green-500' : 'text-red-500';
  }

  getTransactionText(transactionType: string): string {
    return transactionType === 'sign' ? 'Signed' : 'Released';
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Pagination methods
  loadPage(page: number) {
    this.currentPage = page;
    this.loading = true;
    
    this.transactionsService.getTransactions(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactionData) => {
          this.allTransactions = transactionData.transactions;
          this.currentPage = transactionData.pagination.currentPage;
          this.totalPages = transactionData.pagination.totalPages;
          this.totalTransactions = transactionData.pagination.totalTransactions;
          this.hasNextPage = transactionData.pagination.hasNextPage;
          this.hasPrevPage = transactionData.pagination.hasPrevPage;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading page:', error);
          this.error = 'Failed to load page';
          this.loading = false;
        }
      });
  }

  nextPage() {
    if (this.hasNextPage) {
      this.loadPage(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.hasPrevPage) {
      this.loadPage(this.currentPage - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadPage(page);
    }
  }

  // Helper methods for template
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getClubLogoUrl(clubName: string): string {
    const club = this.allClubs.find(c => c.name === clubName);
    if (club?.logoUrl) {
      // Use ImageUrlService logic for consistent URL handling
      if (club.logoUrl.startsWith('data:')) {
        return club.logoUrl; // Base64 data URL
      }
      if (club.logoUrl.startsWith('http')) {
        return club.logoUrl; // Full URL
      }
      if (club.logoUrl.startsWith('assets/')) {
        return club.logoUrl; // Local asset
      }
      if (club.logoUrl.startsWith('/uploads/')) {
        return `https://ice-tilt-backend.onrender.com${club.logoUrl}`;
      }
      if (club.logoUrl.match(/^\d{13}-\d+-.+\.(png|jpg|jpeg|gif)$/)) {
        return `https://ice-tilt-backend.onrender.com/uploads/${club.logoUrl}`;
      }
      return club.logoUrl;
    }
    return 'assets/images/1ithlwords.png'; // Default fallback
  }

  onLogoError(event: any): void {
    console.log('Logo failed to load, URL:', event.target.src);
    event.target.src = 'assets/images/1ithlwords.png';
  }

}
