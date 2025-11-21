import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import * as PlayoffsActions from '../../store/playoffs/playoffs.actions';
import * as PlayoffsSelectors from '../../store/playoffs/playoffs.selectors';
import { ImageUrlService } from '../../shared/services/image-url.service';
import { AdSenseComponent, AdSenseConfig } from '../../components/adsense/adsense.component';

@Component({
  selector: 'app-playoff-bracket',
  standalone: true,
  imports: [CommonModule, RouterModule, AdSenseComponent],
  templateUrl: './playoff-bracket.component.html',
  styleUrl: './playoff-bracket.component.css'
})
export class PlayoffBracketComponent implements OnInit, OnDestroy {
  bracket$: Observable<any>;
  allBrackets$: Observable<any[]>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  playerStats$: Observable<any>;
  goalieStats$: Observable<any>;
  statsLoading$: Observable<boolean>;
  bracketId: string | null = null;
  selectedBracketId: string | null = null;
  
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
    this.bracket$ = this.store.select(PlayoffsSelectors.selectCurrentPlayoffBracket);
    this.allBrackets$ = this.store.select(PlayoffsSelectors.selectAllPlayoffBrackets);
    this.loading$ = this.store.select(PlayoffsSelectors.selectPlayoffsLoading);
    this.error$ = this.store.select(PlayoffsSelectors.selectPlayoffsError);
    this.playerStats$ = this.store.select(PlayoffsSelectors.selectPlayoffPlayerStats);
    this.goalieStats$ = this.store.select(PlayoffsSelectors.selectPlayoffGoalieStats);
    this.statsLoading$ = this.store.select(PlayoffsSelectors.selectPlayoffStatsLoading);
  }

  ngOnInit() {
    // Load all brackets (no status filter)
    this.store.dispatch(PlayoffsActions.loadPlayoffBrackets({}));
    
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
        this.store.dispatch(PlayoffsActions.loadPlayoffBracket({ bracketId: this.bracketId }));
      } else {
        // Wait for brackets to load, then select the first one (prefer active, newest first)
        this.store.select(PlayoffsSelectors.selectPlayoffsLoading).pipe(
          filter(loading => !loading),
          take(1)
        ).subscribe(() => {
          this.store.select(PlayoffsSelectors.selectAllPlayoffBrackets).pipe(
            take(1)
          ).subscribe(brackets => {
            if (brackets && brackets.length > 0) {
              // Sort brackets: active first, then by creation date (newest first)
              const sortedBrackets = this.getSortedBrackets(brackets);
              const bracketToLoad = sortedBrackets[0];
              
              if (bracketToLoad && bracketToLoad._id) {
                this.bracketId = bracketToLoad._id;
                this.selectedBracketId = bracketToLoad._id;
                this.store.dispatch(PlayoffsActions.loadPlayoffBracket({ bracketId: bracketToLoad._id }));
              }
            }
          });
        });
      }
    });
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  loadStatsForBracket(bracketId: string) {
    this.store.dispatch(PlayoffsActions.loadPlayoffPlayerStats({ bracketId }));
    this.store.dispatch(PlayoffsActions.loadPlayoffGoalieStats({ bracketId }));
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
    return rounds;
  }

  navigateToSeries(seriesId: string) {
    if (this.bracketId) {
      this.router.navigate(['/playoffs/series', seriesId], { queryParams: { bracketId: this.bracketId } });
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

  onBracketChange(bracketId: string) {
    if (bracketId) {
      this.bracketId = bracketId;
      this.selectedBracketId = bracketId;
      this.store.dispatch(PlayoffsActions.loadPlayoffBracket({ bracketId }));
      // Update URL to include bracketId for shareable links
      this.router.navigate(['/playoffs', bracketId]);
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
    
    const seasonName = this.getSeasonName(bracket.seasonId);
    const divisionName = this.getDivisionName(bracket.divisionId);
    const status = bracket.status || 'setup';
    
    let displayName = bracket.name;
    if (seasonName) {
      displayName += ` - ${seasonName}`;
    }
    if (divisionName && divisionName !== 'All Divisions') {
      displayName += ` (${divisionName})`;
    }
    displayName += ` (${status})`;
    
    return displayName;
  }

  getSeasonName(seasonId: any): string {
    if (!seasonId) return '';
    
    // Handle both string and populated object
    const id = typeof seasonId === 'object' && seasonId !== null
      ? (seasonId as any)._id || (seasonId as any).name
      : seasonId;
    
    // If it's already a name, return it
    if (typeof id === 'string' && !id.match(/^[0-9a-fA-F]{24}$/)) {
      return id;
    }
    
    // Otherwise, we'd need to look it up, but for now return the ID or empty
    // In a full implementation, you'd want to load seasons and match them
    return typeof seasonId === 'object' && seasonId !== null && (seasonId as any).name
      ? (seasonId as any).name
      : '';
  }

  getDivisionName(divisionId: any): string {
    if (!divisionId) return 'All Divisions';
    
    // Handle both string and populated object
    if (typeof divisionId === 'object' && divisionId !== null) {
      return (divisionId as any).name || 'All Divisions';
    }
    
    return 'All Divisions';
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

