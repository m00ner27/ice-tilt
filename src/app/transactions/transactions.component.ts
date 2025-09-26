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
      this.transactionsService.getTransactions()
    ]).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([seasons, clubs, transactions]) => {
        this.seasons = seasons;
        this.allClubs = clubs;
        this.allTransactions = transactions;
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
    this.transactionsService.getTransactions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          this.allTransactions = transactions;
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

}
