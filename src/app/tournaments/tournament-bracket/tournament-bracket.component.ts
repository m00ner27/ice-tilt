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
    
    // Subscribe to bracket changes and load stats
    this.subscriptions.add(
      this.bracket$.subscribe(bracket => {
        if (bracket && bracket._id) {
          this.loadStatsForBracket(bracket._id);
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
      } else {
        // Wait for brackets and tournaments to load, then select the first one
        combineLatest([
          this.store.select(TournamentsSelectors.selectTournamentsLoading).pipe(filter(loading => !loading)),
          this.store.select(TournamentsSelectors.selectAllTournamentBrackets)
        ]).pipe(
          filter(([_, brackets]) => brackets !== null && brackets !== undefined),
          take(1)
        ).subscribe(([_, brackets]) => {
          if (brackets && brackets.length > 0) {
            // Sort brackets: active first, then by creation date (newest first)
            const sortedBrackets = this.getSortedBrackets(brackets);
            const bracketToLoad = sortedBrackets[0];
            
            if (bracketToLoad && bracketToLoad._id) {
              this.bracketId = bracketToLoad._id;
              this.selectedBracketId = bracketToLoad._id;
              
              // Set selected tournament based on bracket
              const tournamentId = typeof bracketToLoad.tournamentId === 'object' && bracketToLoad.tournamentId !== null
                ? (bracketToLoad.tournamentId as any)._id
                : bracketToLoad.tournamentId;
              if (tournamentId) {
                this.selectedTournamentId = tournamentId;
                this.selectedTournamentId$.next(tournamentId);
              }
              
              this.store.dispatch(TournamentsActions.loadTournamentBracket({ bracketId: bracketToLoad._id }));
            }
          }
        });
      }
    });
    
    // Also subscribe to filteredBrackets$ to auto-select when brackets become available
    this.subscriptions.add(
      this.filteredBrackets$.pipe(
        filter(brackets => brackets && brackets.length > 0),
        take(1)
      ).subscribe(filteredBrackets => {
        // Only auto-select if no bracket is currently selected
        if (!this.selectedBracketId && filteredBrackets.length > 0) {
          const sortedBrackets = this.getSortedBrackets(filteredBrackets);
          const bracketToLoad = sortedBrackets[0];
          
          if (bracketToLoad && bracketToLoad._id && !this.bracketId) {
            this.bracketId = bracketToLoad._id;
            this.selectedBracketId = bracketToLoad._id;
            this.store.dispatch(TournamentsActions.loadTournamentBracket({ bracketId: bracketToLoad._id }));
          }
        }
      })
    );
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  loadStatsForBracket(bracketId: string) {
    this.store.dispatch(TournamentsActions.loadTournamentPlayerStats({ bracketId }));
    this.store.dispatch(TournamentsActions.loadTournamentGoalieStats({ bracketId }));
  }

  getSeriesByRound(series: any[], roundOrder: number): any[] {
    return series.filter(s => s.roundOrder === roundOrder);
  }

  getRoundName(rounds: any[], roundOrder: number): string {
    const round = rounds.find(r => r.order === roundOrder);
    return round ? round.name : `Round ${roundOrder}`;
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
    // Reverse so final round appears first (left side)
    // But we need to map round order to series roundOrder
    return rounds.reverse();
  }

  // Map display round order to series roundOrder
  // Rounds have order: 3, 2, 1 (for display)
  // Series have roundOrder: 1, 2, 3 (actual round numbers)
  getSeriesRoundOrder(displayRoundOrder: number, numRounds: number): number {
    // displayRoundOrder is 3, 2, 1 (from reversed getRoundNumbers)
    // We need to convert to series roundOrder: 1, 2, 3
    return numRounds - displayRoundOrder + 1;
  }

  navigateToSeries(seriesId: string) {
    if (this.bracketId) {
      this.router.navigate(['/tournaments/series', seriesId], { queryParams: { bracketId: this.bracketId } });
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
    
    // If a tournament is selected, load the first bracket for that tournament
    if (tournamentIdValue) {
      this.filteredBrackets$.pipe(take(1)).subscribe(brackets => {
        if (brackets && brackets.length > 0) {
          const sortedBrackets = this.getSortedBrackets(brackets);
          const bracketToLoad = sortedBrackets[0];
          
          if (bracketToLoad && bracketToLoad._id) {
            this.onBracketChange(bracketToLoad._id);
          }
        }
      });
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

