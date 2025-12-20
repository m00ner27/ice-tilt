import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { Observable, Subscription, combineLatest, BehaviorSubject } from 'rxjs';
import { map, take, filter, switchMap } from 'rxjs/operators';
import * as TournamentsActions from '../../store/tournaments/tournaments.actions';
import * as TournamentsSelectors from '../../store/tournaments/tournaments.selectors';
import { ImageUrlService } from '../../shared/services/image-url.service';
import { AdSenseComponent, AdSenseConfig } from '../../components/adsense/adsense.component';

@Component({
  selector: 'app-tournament-bracket',
  standalone: true,
  imports: [CommonModule, RouterModule, AdSenseComponent],
  templateUrl: './tournament-bracket.component.html',
  styleUrl: './tournament-bracket.component.css'
})
export class TournamentBracketComponent implements OnInit, OnDestroy {
  bracket$: Observable<any>;
  allBrackets$: Observable<any[]>;
  tournaments$: Observable<any[]>;
  filteredBrackets$: Observable<any[]>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  playerStats$: Observable<any>;
  goalieStats$: Observable<any>;
  statsLoading$: Observable<boolean>;
  bracketId: string | null = null;
  selectedBracketId: string | null = null;
  selectedTournamentId: string | null = null;
  private selectedTournamentId$ = new BehaviorSubject<string | null>(null);
  allBracketsForTournament: any[] = [];
  
  playerStats: any[] = [];
  goalieStats: any[] = [];
  sortedPlayerStats: any[] = [];
  sortedGoalieStats: any[] = [];
  playerSortColumn: string = 'points';
  playerSortDirection: 'asc' | 'desc' = 'desc';
  goalieSortColumn: string = 'savePercentage';
  goalieSortDirection: 'asc' | 'desc' = 'desc';
  
  // AdSense configuration
  bannerAdConfig: AdSenseConfig = {
    adSlot: '8840984486',
    adFormat: 'auto',
    responsive: true,
    className: 'banner-ad'
  };
  
  private subscriptions = new Subscription();

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private router: Router,
    private imageUrlService: ImageUrlService
  ) {
    this.bracket$ = this.store.select(TournamentsSelectors.selectCurrentTournamentBracket);
    this.allBrackets$ = this.store.select(TournamentsSelectors.selectAllTournamentBrackets);
    this.tournaments$ = this.store.select(TournamentsSelectors.selectAllTournaments);
    this.loading$ = this.store.select(TournamentsSelectors.selectTournamentsLoading);
    this.error$ = this.store.select(TournamentsSelectors.selectTournamentsError);
    this.playerStats$ = this.store.select(TournamentsSelectors.selectTournamentPlayerStats);
    this.goalieStats$ = this.store.select(TournamentsSelectors.selectTournamentGoalieStats);
    this.statsLoading$ = this.store.select(TournamentsSelectors.selectTournamentStatsLoading);
    
    // Create filtered brackets observable based on selected tournament
    this.filteredBrackets$ = combineLatest([
      this.allBrackets$,
      this.selectedTournamentId$
    ]).pipe(
      map(([brackets, tournamentId]) => {
        if (!tournamentId) {
          return brackets;
        }
        return brackets.filter(bracket => {
          const bracketTournamentId = typeof bracket.tournamentId === 'object' && bracket.tournamentId !== null
            ? (bracket.tournamentId as any)._id
            : bracket.tournamentId;
          return bracketTournamentId === tournamentId;
        });
      })
    );
  }

  ngOnInit() {
    // Load tournaments and brackets
    this.store.dispatch(TournamentsActions.loadTournaments());
    this.store.dispatch(TournamentsActions.loadTournamentBrackets({}));
    
    // Auto-select most recent tournament immediately when tournaments load
    this.subscriptions.add(
      this.store.select(TournamentsSelectors.selectAllTournaments).pipe(
        filter(tournaments => tournaments !== null && tournaments !== undefined && tournaments.length > 0),
        take(1)
      ).subscribe(tournaments => {
        if (tournaments && tournaments.length > 0 && !this.selectedTournamentId) {
          // Sort tournaments by date (most recent first) and select the first one
          const sortedTournaments = [...tournaments].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // Most recent first
          });
          const mostRecentTournament = sortedTournaments[0];
          if (mostRecentTournament && mostRecentTournament._id) {
            this.selectedTournamentId = mostRecentTournament._id;
            this.selectedTournamentId$.next(mostRecentTournament._id);
            // Reload brackets for the selected tournament
            this.store.dispatch(TournamentsActions.loadTournamentBrackets({ tournamentId: mostRecentTournament._id }));
          }
        }
      })
    );
    
    // Subscribe to filtered brackets to track all brackets for selected tournament
    this.subscriptions.add(
      this.filteredBrackets$.subscribe(brackets => {
        this.allBracketsForTournament = brackets || [];
        // Load stats for the entire tournament when brackets are available
        if (this.selectedTournamentId && brackets.length > 0) {
          this.loadStatsForTournament(this.selectedTournamentId);
        }
      })
    );
    
    // Subscribe to player stats
    this.subscriptions.add(
      this.playerStats$.subscribe(stats => {
        this.playerStats = stats || [];
        this.sortPlayerStats();
      })
    );
    
    // Subscribe to goalie stats
    this.subscriptions.add(
      this.goalieStats$.subscribe(stats => {
        this.goalieStats = stats || [];
        this.sortGoalieStats();
      })
    );
    
    this.route.params.subscribe(params => {
      this.bracketId = params['id'] || null;
      if (this.bracketId) {
        // Load specific bracket from route
        this.selectedBracketId = this.bracketId;
        this.store.dispatch(TournamentsActions.loadTournamentBracket({ bracketId: this.bracketId }));
        
        // Set selected tournament based on bracket
        this.store.select(TournamentsSelectors.selectCurrentTournamentBracket).pipe(
          filter(bracket => bracket !== null && bracket._id === this.bracketId),
          take(1)
        ).subscribe(bracket => {
          if (bracket && bracket.tournamentId) {
            const tournamentId = typeof bracket.tournamentId === 'object' && bracket.tournamentId !== null
              ? (bracket.tournamentId as any)._id
              : bracket.tournamentId;
            this.selectedTournamentId = tournamentId;
            this.selectedTournamentId$.next(tournamentId);
          }
        });
      }
      // Note: Tournament auto-selection is handled in the ngOnInit subscription above
    });
    
    // Load all brackets for selected tournament (no need to load individual brackets anymore)
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  loadStatsForBracket(bracketId: string) {
    this.store.dispatch(TournamentsActions.loadTournamentPlayerStats({ bracketId }));
    this.store.dispatch(TournamentsActions.loadTournamentGoalieStats({ bracketId }));
  }

  loadStatsForTournament(tournamentId: string) {
    // Load combined stats for all brackets in the tournament
    this.store.dispatch(TournamentsActions.loadTournamentPlayerStats({ tournamentId }));
    this.store.dispatch(TournamentsActions.loadTournamentGoalieStats({ tournamentId }));
  }

  getSeriesByRound(series: any[], roundOrder: number): any[] {
    return series.filter(s => s.roundOrder === roundOrder);
  }

  getSeriesByRoundAndType(series: any[], roundOrder: number, placementBracketType: string): any[] {
    if (!series || series.length === 0) return [];
    const filtered = series.filter(s => {
      const matchesRound = s.roundOrder === roundOrder;
      // Check if placementBracketType matches, or if it's undefined and we need to infer
      const matchesType = s.placementBracketType === placementBracketType;
      return matchesRound && matchesType;
    });
    // If no series found with the type, and it's round 2 of placement bracket,
    // try to split by index (first 2 are winners, last 2 are losers)
    if (filtered.length === 0 && roundOrder === 2) {
      const round2Series = series.filter(s => s.roundOrder === roundOrder);
      if (round2Series.length === 4) {
        // First 2 are winners, last 2 are losers
        if (placementBracketType === 'winners') {
          return round2Series.slice(0, 2);
        } else if (placementBracketType === 'losers') {
          return round2Series.slice(2, 4);
        }
      }
    }
    return filtered;
  }

  isPlacementBracketRound2(bracket: any, roundOrder: number): boolean {
    return bracket.format === 'placement-bracket' && roundOrder === 2;
  }

  getRoundName(rounds: any[], roundOrder: number, bracket?: any): string {
    const round = rounds.find(r => r.order === roundOrder);
    if (!round) return `Round ${roundOrder}`;
    
    // For placement brackets, swap round names if they have the old order
    // Old order in DB: order 1 = "Final Placement", order 3 = "Initial Matchups"
    // New order we want: order 1 = "Initial Matchups" (left), order 3 = "Final Placement" (right)
    // When displaying rounds 1, 2, 3 from left to right:
    // - If round with order 1 has name "Final Placement", we're displaying it on the left but it should say "Initial Matchups"
    // - If round with order 3 has name "Initial Matchups", we're displaying it on the right but it should say "Final Placement"
    if (bracket?.format === 'placement-bracket' && bracket?.numRounds === 3) {
      // Check if this is the old order (order 1 = Final Placement)
      const round1 = rounds.find(r => r.order === 1);
      if (round1 && round1.name === 'Final Placement') {
        // This bracket has old order, swap the names
        if (roundOrder === 1) {
          return 'Initial Matchups'; // Display "Initial Matchups" for order 1 (left)
        }
        if (roundOrder === 3) {
          return 'Final Placement'; // Display "Final Placement" for order 3 (right)
        }
      }
    }
    
    return round.name;
  }

  getRoundBestOf(rounds: any[], roundOrder: number): number {
    const round = rounds.find(r => r.order === roundOrder);
    return round ? round.bestOf : 3;
  }

  getRoundNumbers(bracket: any): number[] {
    if (!bracket || !bracket.numRounds) return [];
    const rounds: number[] = [];
    for (let i = 1; i <= bracket.numRounds; i++) {
      rounds.push(i);
    }
    // Don't reverse - show rounds in order (1, 2, 3) with round 1 (Initial Matchups) on the left
    return rounds;
  }

  // Map display round order to series roundOrder
  // Now rounds are in order (1, 2, 3), so displayRoundOrder matches series roundOrder
  getSeriesRoundOrder(displayRoundOrder: number, numRounds: number): number {
    return displayRoundOrder;
  }

  navigateToSeries(seriesId: string) {
    // Find the bracket that contains this series
    const bracket = this.allBracketsForTournament.find(b => 
      b.series && b.series.some((s: any) => s._id === seriesId)
    );
    if (bracket && bracket._id) {
      this.router.navigate(['/tournaments/series', seriesId], { queryParams: { bracketId: bracket._id } });
    } else {
      // Fallback: navigate without bracketId
      this.router.navigate(['/tournaments/series', seriesId]);
    }
  }

  getSeriesScore(series: any): string {
    if (series.status === 'bye') {
      return 'BYE';
    }
    if (series.status === 'completed' && series.winnerClubId) {
      return `${series.homeWins}-${series.awayWins}`;
    }
    return `${series.homeWins || 0}-${series.awayWins || 0}`;
  }

  onTournamentChange(tournamentId: string) {
    const tournamentIdValue = tournamentId || null;
    this.selectedTournamentId = tournamentIdValue;
    this.selectedTournamentId$.next(tournamentIdValue);
    this.selectedBracketId = null;
    this.bracketId = null;
    
    // Reload brackets for the selected tournament to ensure fresh data with populated clubs
    if (tournamentIdValue) {
      this.store.dispatch(TournamentsActions.loadTournamentBrackets({ tournamentId: tournamentIdValue }));
      this.loadStatsForTournament(tournamentIdValue);
    } else {
      // Reload all brackets if no tournament selected
      this.store.dispatch(TournamentsActions.loadTournamentBrackets({}));
    }
  }
  
  onBracketChange(bracketId: string) {
    if (bracketId) {
      this.bracketId = bracketId;
      this.selectedBracketId = bracketId;
      this.store.dispatch(TournamentsActions.loadTournamentBracket({ bracketId }));
      // Update URL to include bracketId for shareable links
      this.router.navigate(['/tournaments', bracketId]);
      // Stats will be loaded automatically via bracket$ subscription
    }
  }
  
  getImageUrl(logoUrl?: string): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }
  
  sortPlayerStats() {
    this.sortedPlayerStats = [...this.playerStats].sort((a, b) => {
      const aVal = a[this.playerSortColumn] || 0;
      const bVal = b[this.playerSortColumn] || 0;
      
      if (this.playerSortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }
  
  sortGoalieStats() {
    this.sortedGoalieStats = [...this.goalieStats].sort((a, b) => {
      const aVal = a[this.goalieSortColumn] || 0;
      const bVal = b[this.goalieSortColumn] || 0;
      
      if (this.goalieSortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }
  
  onSortPlayerColumn(column: string) {
    if (this.playerSortColumn === column) {
      this.playerSortDirection = this.playerSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.playerSortColumn = column;
      this.playerSortDirection = 'desc';
    }
    this.sortPlayerStats();
  }
  
  onSortGoalieColumn(column: string) {
    if (this.goalieSortColumn === column) {
      this.goalieSortDirection = this.goalieSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.goalieSortColumn = column;
      this.goalieSortDirection = 'desc';
    }
    this.sortGoalieStats();
  }
  
  getPlayerSortClass(column: string): string {
    if (this.playerSortColumn !== column) return '';
    return this.playerSortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
  }
  
  getGoalieSortClass(column: string): string {
    if (this.goalieSortColumn !== column) return '';
    return this.goalieSortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
  }
  
  formatPosition(position: string): string {
    if (!position) return 'Unknown';
    const pos = position.toUpperCase();
    if (pos.includes('CENTER') || pos === 'C') return 'C';
    if (pos.includes('LEFT') || pos === 'LW') return 'LW';
    if (pos.includes('RIGHT') || pos === 'RW') return 'RW';
    if (pos.includes('DEFENSE') || pos === 'D') return 'D';
    if (pos.includes('GOALIE') || pos === 'G') return 'G';
    return position;
  }

  getBracketDisplayName(bracket: any): string {
    if (!bracket) return '';
    
    const tournamentName = this.getTournamentName(bracket.tournamentId);
    
    let displayName = bracket.name;
    if (tournamentName) {
      displayName += ` - ${tournamentName}`;
    }
    
    return displayName;
  }

  getTournamentName(tournamentId: any): string {
    if (!tournamentId) return '';
    
    // Handle both string and populated object
    const id = typeof tournamentId === 'object' && tournamentId !== null
      ? (tournamentId as any)._id || (tournamentId as any).name
      : tournamentId;
    
    // If it's already a name, return it
    if (typeof id === 'string' && !id.match(/^[0-9a-fA-F]{24}$/)) {
      return id;
    }
    
    // Otherwise, return the name if it's an object
    return typeof tournamentId === 'object' && tournamentId !== null && (tournamentId as any).name
      ? (tournamentId as any).name
      : '';
  }

  getSortedBrackets(brackets: any[]): any[] {
    return [...brackets].sort((a, b) => {
      // Priority: active > setup > completed
      const statusPriority: { [key: string]: number } = {
        'active': 1,
        'setup': 2,
        'completed': 3
      };
      
      const aPriority = statusPriority[a.status] || 99;
      const bPriority = statusPriority[b.status] || 99;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same status, sort by creation date (newest first)
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }
}

