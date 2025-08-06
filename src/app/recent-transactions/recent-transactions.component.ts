import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionsService } from '../store/services/transactions.service';
import { ApiService } from '../store/services/api.service';
import { Transaction } from '../store/models/models/transaction.interface';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recent-transactions.component.html',
  styleUrls: ['./recent-transactions.component.css']
})
export class RecentTransactionsComponent implements OnInit {
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

  constructor(
    private transactionsService: TransactionsService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loadSeasons();
    this.loadClubs();
    this.loadTransactions();
  }

  loadSeasons() {
    this.apiService.getSeasons().subscribe({
      next: (seasons) => {
        this.seasons = seasons;
      },
      error: (error) => {
        console.error('Error loading seasons:', error);
      }
    });
  }

  loadClubs() {
    this.apiService.getClubs().subscribe({
      next: (clubs) => {
        this.allClubs = clubs;
        this.updateFilteredClubs();
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
      }
    });
  }

  updateFilteredClubs() {
    if (this.selectedSeason === 'All') {
      // If "All Seasons" is selected, show all clubs
      this.filteredClubs = this.allClubs;
    } else {
      // Filter clubs based on the selected season
      this.filteredClubs = this.allClubs.filter(club => {
        if (!club.seasons || !Array.isArray(club.seasons)) {
          return false;
        }
        
        // Check if the club has the selected season
        return club.seasons.some((season: any) => {
          const seasonInDb = this.seasons.find(s => s._id === season.seasonId);
          return seasonInDb && seasonInDb.name === this.selectedSeason;
        });
      });
    }

    // Reset club selection if the currently selected club is not in the filtered list
    if (this.selectedClub !== 'All' && !this.filteredClubs.find(club => club.name === this.selectedClub)) {
      this.selectedClub = 'All';
    }
  }

  loadTransactions() {
    this.loading = true;
    this.transactionsService.getTransactions().subscribe({
      next: (transactions: Transaction[]) => {
        this.allTransactions = transactions;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading transactions:', error);
        this.error = 'Failed to load transactions';
        this.loading = false;
      }
    });
  }

  applyFilters() {
    let filteredTransactions = this.allTransactions;

    // Apply season filter
    if (this.selectedSeason !== 'All') {
      filteredTransactions = filteredTransactions.filter(
        transaction => transaction.seasonName === this.selectedSeason
      );
    }

    // Apply club filter
    if (this.selectedClub !== 'All') {
      filteredTransactions = filteredTransactions.filter(
        transaction => transaction.clubName === this.selectedClub
      );
    }

    // Sort by date (most recent first)
    filteredTransactions = filteredTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Limit based on preview mode
    if (this.isPreview) {
      this.transactions = filteredTransactions.slice(0, 10); // Show only 10 for preview
    } else {
      this.transactions = filteredTransactions.slice(0, 50); // Show up to 50 for full page
    }
  }

  onSeasonChange() {
    this.updateFilteredClubs();
    this.applyFilters();
  }

  onClubChange() {
    this.applyFilters();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  }

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
}

