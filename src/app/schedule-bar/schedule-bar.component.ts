import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EashlMatch, MatchService } from '../store/services/match.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ApiService } from '../store/services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoggerService } from '../shared/services/logger.service';

@Component({
  selector: 'app-schedule-bar',
  standalone: true,
  templateUrl: './schedule-bar.component.html',
  styleUrls: ['./schedule-bar.component.css'],
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleBarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  matches: EashlMatch[] = [];
  upcomingMatches: EashlMatch[] = [];
  isLoading = true;

  constructor(
    private matchService: MatchService,
    private imageUrlService: ImageUrlService,
    private apiService: ApiService,
    private logger: LoggerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Delay loading to improve initial page load performance
    // Only load when component is actually visible (lazy loading)
    // Use IntersectionObserver to detect when schedule bar comes into view
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.setupLazyLoading();
    } else {
      // Fallback: delay by 2 seconds for older browsers
      setTimeout(() => {
        this.loadMatches();
      }, 2000);
    }
  }

  private setupLazyLoading(): void {
    // Wait a bit for the component to render, then check visibility
    setTimeout(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
      this.loadMatches();
            observer.disconnect(); // Only load once
          }
        });
      }, {
        rootMargin: '100px' // Start loading 100px before it comes into view
      });

      // Try to observe the component element
      const element = document.querySelector('app-schedule-bar');
      if (element) {
        observer.observe(element);
      } else {
        // Fallback if element not found
        setTimeout(() => this.loadMatches(), 1000);
      }
    }, 500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMatches() {
    this.isLoading = true;
    this.cdr.markForCheck();
    
    // Load only matches from yesterday, today, and next 7 days
    // This is much more efficient than loading ALL games
    this.apiService.getGames()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (games) => {
          // Transform games to EashlMatch format and filter for recent dates only
          this.matches = this.transformAndFilterGames(games || []);
          this.filterUpcomingMatches();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error fetching matches in ScheduleBarComponent:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  transformAndFilterGames(games: any[]): EashlMatch[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000));
    const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    // Set time boundaries: yesterday through next 7 days
    // This limits the dataset significantly compared to loading ALL games
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const nextWeekEnd = new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 23, 59, 59, 999);
    
    const filteredGames = games.filter(game => {
      if (!game || !game.date) return false;
      const gameDate = new Date(game.date);
      return gameDate >= yesterdayStart && gameDate <= nextWeekEnd;
    });
    
    // Limit to maximum 50 games to prevent UI slowdown
    const limitedGames = filteredGames.slice(0, 50);
    
    return limitedGames.map(game => this.transformGameData(game));
  }

  private transformGameData(game: any): EashlMatch {
    // Determine scores using the same logic as MatchService
    let homeScore = game.homeTeamScore || 0;
    let awayScore = game.awayTeamScore || 0;

    if (game.eashlData?.clubs) {
      const homeEashlClubId = game.homeClubId?.eashlClubId;
      const awayEashlClubId = game.awayClubId?.eashlClubId;

      // Get home team score
      if (homeEashlClubId && game.eashlData.clubs[homeEashlClubId]) {
        homeScore = parseInt(game.eashlData.clubs[homeEashlClubId].score) || 0;
      }
      
      // Get away team score
      if (awayEashlClubId) {
        // Method 1: Try to get away team's own score
        const awayClubData = game.eashlData.clubs[awayEashlClubId];
        if (awayClubData && awayClubData.score) {
          awayScore = parseInt(awayClubData.score) || 0;
        }
        // Method 2: If not available, get from home club's opponent score
        else if (homeEashlClubId && game.eashlData.clubs[homeEashlClubId]) {
          const homeClubData = game.eashlData.clubs[homeEashlClubId];
          if (homeClubData && homeClubData.opponentClubId === awayEashlClubId && homeClubData.opponentScore) {
            awayScore = parseInt(homeClubData.opponentScore) || 0;
          }
        }
      }
    }

    return {
      id: game._id,
      date: game.date,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeScore: homeScore,
      awayScore: awayScore,
      homeClub: game.homeClubId,
      awayClub: game.awayClubId,
      isOvertime: game.isOvertime || false,
      isShootout: game.isShootout || false,
      seasonId: game.seasonId,
      eashlMatchId: game.eashlMatchId,
      eashlData: game.eashlData,
      playerStats: game.playerStats || []
    };
  }

  filterUpcomingMatches() {
    if (!this.matches || this.matches.length === 0) {
      this.upcomingMatches = [];
      return;
    }
    
    // Since we already filtered by date in transformAndFilterGames, 
    // we just need to sort the matches by date
    this.upcomingMatches = [...this.matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Method to get the full image URL using the centralized service
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  isFinal(match: EashlMatch): boolean {
    // A game is final if it has actual EASHL data (not just the default object)
    if (match.eashlData && match.eashlData.matchId) {
      return true;
    }
    
    // A game is final if it's a merged game with EASHL match ID (indicates it was linked to EASHL data)
    if (!!match.eashlMatchId && match.eashlMatchId.includes('+')) {
      return true;
    }
    
    // A game is final if it's a forfeit game
    if (match.forfeit && match.forfeit !== 'none') {
      return true;
    }
    
    // For games without EASHL data, only consider them final if they have actual scores (not just 0-0 defaults)
    // This handles cases where scores were manually entered
    return match.homeScore !== undefined && match.awayScore !== undefined && (match.homeScore > 0 || match.awayScore > 0);
  }

  getHomeScore(match: EashlMatch): number {
    // Handle forfeit games
    if (match.forfeit && match.forfeit !== 'none') {
      return match.forfeit === 'forfeit-home' ? 1 : 0;
    }
    return match.homeScore || 0;
  }

  getAwayScore(match: EashlMatch): number {
    // Handle forfeit games
    if (match.forfeit && match.forfeit !== 'none') {
      return match.forfeit === 'forfeit-away' ? 1 : 0;
    }
    return match.awayScore || 0;
  }
}
