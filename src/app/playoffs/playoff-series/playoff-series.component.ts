import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { Observable, Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as PlayoffsActions from '../../store/playoffs/playoffs.actions';
import * as PlayoffsSelectors from '../../store/playoffs/playoffs.selectors';
import { ImageUrlService } from '../../shared/services/image-url.service';

@Component({
  selector: 'app-playoff-series',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './playoff-series.component.html',
  styleUrl: './playoff-series.component.css'
})
export class PlayoffSeriesComponent implements OnInit, OnDestroy {
  series$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  seriesId: string | null = null;
  bracketId: string | null = null;
  private destroy$ = new Subject<void>();
  private lastUpdateTime: string | null = null;

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    public router: Router,
    private imageUrlService: ImageUrlService
  ) {
    this.series$ = this.store.select(PlayoffsSelectors.selectCurrentPlayoffSeries);
    this.loading$ = this.store.select(PlayoffsSelectors.selectPlayoffsLoading);
    this.error$ = this.store.select(PlayoffsSelectors.selectPlayoffsError);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.seriesId = params['id'] || null;
      this.route.queryParams.subscribe(queryParams => {
        this.bracketId = queryParams['bracketId'] || null;
        if (this.seriesId && this.bracketId) {
          this.loadSeries();
        }
      });
    });

    // Listen for storage events (cross-tab updates)
    window.addEventListener('storage', (event) => {
      if (event.key === 'admin-data-updated') {
        this.refreshSeries();
      }
    });

    // Poll for localStorage updates (same-tab updates)
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      const updateTime = localStorage.getItem('admin-data-updated');
      if (updateTime && updateTime !== this.lastUpdateTime) {
        this.lastUpdateTime = updateTime;
        this.refreshSeries();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSeries() {
    if (this.seriesId && this.bracketId) {
      this.store.dispatch(PlayoffsActions.loadPlayoffSeriesById({ 
        seriesId: this.seriesId, 
        bracketId: this.bracketId 
      }));
    }
  }

  private refreshSeries() {
    console.log('Refreshing playoff series data...');
    this.loadSeries();
  }

  navigateToGame(gameId: string) {
    this.router.navigate(['/match', gameId]);
  }

  getSeriesScore(series: any): string {
    if (series.status === 'bye') {
      return 'BYE';
    }
    return `${series.homeWins || 0} - ${series.awayWins || 0}`;
  }

  getWinner(series: any): string | null {
    if (series.winnerClubId) {
      if (series.homeClubId?._id === series.winnerClubId || series.homeClub === series.winnerClubId) {
        return series.homeClub?.name || series.homeClubId?.name || 'Unknown';
      }
      if (series.awayClubId?._id === series.winnerClubId || series.awayClub === series.winnerClubId) {
        return series.awayClub?.name || series.awayClubId?.name || 'Unknown';
      }
    }
    return null;
  }

  getImageUrl(logoUrl?: string): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  isWinner(series: any, clubId: any): boolean {
    if (!series.winnerClubId || !clubId) return false;
    const clubIdValue = typeof clubId === 'object' && clubId !== null ? clubId._id : clubId;
    return series.winnerClubId === clubIdValue;
  }
}

