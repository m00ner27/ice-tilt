import { Injectable } from '@angular/core';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataPrefetchService {
  private prefetchedRoutes = new Set<string>();
  
  constructor(
    private ngrxApiService: NgRxApiService,
    private router: Router
  ) {
    this.setupRoutePrefetching();
  }

  private setupRoutePrefetching() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.prefetchDataForRoute(event.url);
      });
  }

  private prefetchDataForRoute(url: string) {
    // Prefetch data based on route
    if (url.includes('/standings') && !this.prefetchedRoutes.has('standings')) {
      this.prefetchStandingsData();
      this.prefetchedRoutes.add('standings');
    }
    
    if (url.includes('/players') && !this.prefetchedRoutes.has('players')) {
      this.prefetchPlayersData();
      this.prefetchedRoutes.add('players');
    }
    
    if (url.includes('/club-detail') && !this.prefetchedRoutes.has('club-detail')) {
      this.prefetchClubDetailData();
      this.prefetchedRoutes.add('club-detail');
    }
  }

  private prefetchStandingsData() {
    // Prefetch matches for standings (most critical data)
    this.ngrxApiService.loadMatches();
  }

  private prefetchPlayersData() {
    // Prefetch users and matches for players page
    this.ngrxApiService.loadUsers();
    this.ngrxApiService.loadMatches();
  }

  private prefetchClubDetailData() {
    // Prefetch matches for club detail pages
    this.ngrxApiService.loadMatches();
  }

  // Prefetch data for next likely route
  prefetchNextRoute(currentRoute: string) {
    const routePrefetchMap: { [key: string]: string[] } = {
      '/home': ['/standings', '/players'],
      '/standings': ['/players', '/schedule'],
      '/players': ['/standings', '/club-detail'],
      '/schedule': ['/standings', '/players']
    };

    const nextRoutes = routePrefetchMap[currentRoute] || [];
    nextRoutes.forEach(route => {
      if (route.includes('standings') && !this.prefetchedRoutes.has('standings')) {
        this.prefetchStandingsData();
        this.prefetchedRoutes.add('standings');
      }
      if (route.includes('players') && !this.prefetchedRoutes.has('players')) {
        this.prefetchPlayersData();
        this.prefetchedRoutes.add('players');
      }
    });
  }
}
