import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EashlMatch, MatchService } from '../store/services/match.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { AdSenseComponent, AdSenseConfig } from '../components/adsense/adsense.component';
import { ApiService } from '../store/services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Bootstrap will be available on window object

interface AggregatedPlayer {
  playerId: number;
  name: string;
  team: string;
  teamLogo: string;
  number: number;
  position: string;
  goals: number;
  assists: number;
  points: number;
  saves: number;
  shotsAgainst: number;
  goalsAgainst: number;
  shutouts: number;
  gamesPlayed: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [CommonModule, RouterModule, AdSenseComponent]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  @ViewChild('newsCarousel', { static: false }) carouselElement?: ElementRef;
  private carouselInstance: any;
  
  topGoals: AggregatedPlayer[] = [];
  topAssists: AggregatedPlayer[] = [];
  topPoints: AggregatedPlayer[] = [];
  topSavePct: any[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  
  // Articles for carousel
  articles: any[] = [];
  articlesLoading: boolean = true;
  articlesError: boolean = false;
  
  // Progressive loading flags
  showAds: boolean = false;

  // AdSense configurations
  bannerAdConfig: AdSenseConfig = {
    adSlot: '8840984486', // Your actual banner ad unit ID
    adFormat: 'auto',
    responsive: true,
    className: 'banner-ad'
  };

  rectangleAdConfig: AdSenseConfig = {
    adSlot: '8840984486', // Using same ad unit for now - you can create another later
    adFormat: 'rectangle',
    adStyle: {
      display: 'block',
      width: '300px',
      height: '250px'
    },
    responsive: true,
    className: 'rectangle-ad'
  };

  constructor(
    private matchService: MatchService,
    private imageUrlService: ImageUrlService,
    private apiService: ApiService
  ) {}

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl, 'assets/images/1ithlwords.png');
  }

  ngOnDestroy() {
    // Dispose of carousel instance
    if (this.carouselInstance) {
      try {
        this.carouselInstance.dispose();
      } catch (error) {
        console.error('Error disposing carousel:', error);
      }
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    // Load articles first (for carousel)
    this.loadArticles();
    
    // Delay player stats loading to improve initial page load
    setTimeout(() => {
      this.loadPlayerStats();
    }, 500);
    this.setupProgressiveLoading();
  }

  ngAfterViewInit() {
    // Initialize carousel after view is ready
    setTimeout(() => {
      this.initializeCarousel();
    }, 100);
  }

  initializeCarousel() {
    // Wait for Bootstrap to be available
    if (typeof window !== 'undefined' && (window as any).bootstrap) {
      const bootstrap = (window as any).bootstrap;
      if (this.carouselElement && this.articles.length > 0) {
        try {
          // Dispose of existing carousel instance if any
          if (this.carouselInstance) {
            this.carouselInstance.dispose();
          }
          // Initialize new carousel
          this.carouselInstance = new bootstrap.Carousel(this.carouselElement.nativeElement, {
            interval: 5000,
            ride: 'carousel',
            wrap: true
          });
          console.log('Carousel initialized successfully');
        } catch (error) {
          console.error('Error initializing carousel:', error);
        }
      }
    } else {
      // Retry after a short delay if Bootstrap isn't loaded yet
      setTimeout(() => {
        this.initializeCarousel();
      }, 100);
    }
  }

  loadArticles(): void {
    this.articlesLoading = true;
    this.articlesError = false;
    
    // Get only published articles, sorted by date (newest first)
    this.apiService.getArticles(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (articles) => {
          // Get the 3 latest articles
          this.articles = articles
            .filter(article => article.published)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);
          
          console.log('Loaded articles:', this.articles);
          this.articles.forEach(article => {
            console.log(`Article: ${article.title}, imageUrl: ${article.imageUrl}`);
          });
          
          this.articlesLoading = false;
          
          // Initialize carousel after articles are loaded
          setTimeout(() => {
            this.initializeCarousel();
          }, 200);
        },
        error: (error) => {
          console.error('Error loading articles:', error);
          this.articlesError = true;
          this.articlesLoading = false;
          // Fallback to empty array - carousel will show default items
          this.articles = [];
        }
      });
  }

  getArticleImageUrl(imageUrl?: string): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return 'assets/images/IMG_3840.jpg';
    }
    const processedUrl = this.imageUrlService.getImageUrl(imageUrl, 'assets/images/IMG_3840.jpg');
    console.log('Processing image URL:', { original: imageUrl, processed: processedUrl });
    return processedUrl;
  }

  onArticleImageError(event: any): void {
    console.log('Article image failed to load, URL was:', event.target.src);
    event.target.src = 'assets/images/IMG_3840.jpg';
  }

  onArticleImageLoad(event: any, article: any): void {
    console.log('Article image loaded successfully:', article.title, event.target.src);
  }

  formatArticleDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  setupProgressiveLoading() {
    // Load player stats first (highest priority)
    // Then progressively load other components using intersection observer
    
    // Use intersection observer for better performance
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    } else {
      // Fallback to timeouts for older browsers
      this.setupTimeoutLoading();
    }
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          if (target.id === 'ads-section') {
            this.showAds = true;
            observer.unobserve(target);
          }
        }
      });
    }, { rootMargin: '100px' });

    // Observe placeholder elements
    setTimeout(() => {
      const adsEl = document.getElementById('ads-section');
      if (adsEl) observer.observe(adsEl);
    }, 100);
  }

  setupTimeoutLoading() {
    // Fallback for older browsers
    setTimeout(() => this.showAds = true, 1000);
  }

  loadPlayerStats() {
    this.isLoading = true;
    this.hasError = false;
    
    this.matchService.getMatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matches) => {
          if (!matches || matches.length === 0) {
            this.isLoading = false;
            return;
          }
          
          // Use all matches to show all-time leaders
          this.calculatePlayerStats(matches);
        },
        error: (error) => {
          console.error('Error loading matches for player stats:', error);
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  calculatePlayerStats(matches: EashlMatch[]) {
    if (!matches || matches.length === 0) {
      this.isLoading = false;
      return;
    }
    
    const playerMap: { [id: number]: AggregatedPlayer } = {};
    const teamLogoMap = new Map<string, string>();
    
    // Build team logo map from club data (optimized)
    for (const match of matches) {
      if (match.homeTeam) teamLogoMap.set(match.homeTeam, this.getImageUrl(match.homeClub?.logoUrl));
      if (match.awayTeam) teamLogoMap.set(match.awayTeam, this.getImageUrl(match.awayClub?.logoUrl));
    }
    
    // Aggregate stats across recent matches (optimized processing)
    for (const match of matches) {
      if (!match.eashlData?.players) continue;
      
      // EASHL data structure: players are stored by club ID
      for (const [clubId, clubPlayers] of Object.entries(match.eashlData.players)) {
        for (const [playerId, player] of Object.entries(clubPlayers as any)) {
          const numericPlayerId = parseInt(playerId);
          if (isNaN(numericPlayerId)) continue;
          
          const playerData = player as any; // Type assertion for player data
          const playerName = playerData.playername || playerData.name || `Player ${playerId}`;
          
          // Determine team name by matching club ID to home/away club
          let teamName = 'Unknown';
          if (match.homeClub?.eashlClubId === clubId) {
            teamName = match.homeTeam;
          } else if (match.awayClub?.eashlClubId === clubId) {
            teamName = match.awayTeam;
          } else {
            teamName = match.homeTeam; // Fallback
          }
          
          if (!playerMap[numericPlayerId]) {
            playerMap[numericPlayerId] = {
              playerId: numericPlayerId,
              name: playerName,
              team: teamName,
              teamLogo: teamLogoMap.get(teamName) || this.getImageUrl('assets/images/1ithlwords.png'),
              number: playerData.jerseynum || playerData.number || 0,
              position: playerData.position || 'Unknown',
              goals: 0,
              assists: 0,
              points: 0,
              saves: 0,
              shotsAgainst: 0,
              goalsAgainst: 0,
              shutouts: 0,
              gamesPlayed: 0
            };
          }
          
          // Aggregate stats (optimized)
          const currentPlayer = playerMap[numericPlayerId];
          
          // Check if player has goalie stats in this match
          const hasGoalieStats = playerData.glsaves !== undefined || 
                                 playerData.glshots !== undefined || 
                                 playerData.glga !== undefined;
          
          // Check if player has skater stats in this match
          const hasSkaterStats = playerData.skgoals !== undefined || 
                                playerData.skassists !== undefined;
          
          // Track games played and position
          // If player has goalie stats, mark as goalie and count game
          if (hasGoalieStats) {
            currentPlayer.position = 'goalie';
            currentPlayer.gamesPlayed += 1;
          } else if (hasSkaterStats) {
            // If they have skater stats and aren't already marked as goalie, mark as skater
            if (currentPlayer.position !== 'goalie') {
              currentPlayer.position = 'skater';
            }
            // Count game for skaters (unless they're a goalie)
            if (currentPlayer.position !== 'goalie') {
              currentPlayer.gamesPlayed += 1;
            }
          }
          
          if (playerData.skgoals !== undefined) currentPlayer.goals += parseInt(playerData.skgoals) || 0;
          if (playerData.skassists !== undefined) currentPlayer.assists += parseInt(playerData.skassists) || 0;
          if (playerData.glsaves !== undefined) currentPlayer.saves += parseInt(playerData.glsaves) || 0;
          if (playerData.glshots !== undefined) currentPlayer.shotsAgainst += parseInt(playerData.glshots) || 0;
          if (playerData.glga !== undefined) {
            const goalsAgainst = parseInt(playerData.glga) || 0;
            currentPlayer.goalsAgainst += goalsAgainst;
            currentPlayer.shutouts += (goalsAgainst === 0) ? 1 : 0;
          }
        }
      }
    }
    
    // Calculate points for skaters
    for (const player of Object.values(playerMap)) {
      player.points = (player.goals || 0) + (player.assists || 0);
    }
    
    // Get top performers (optimized sorting)
    const allPlayers = Object.values(playerMap);
    
    // Top 5 goals (include anyone with goals - if they have goals, they're a skater)
    this.topGoals = allPlayers
      .filter(p => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
    
    // Top 5 assists (include anyone with assists - if they have assists, they're a skater)
    this.topAssists = allPlayers
      .filter(p => p.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 5);
    
    // Top 5 points (include anyone with points - if they have points, they're a skater)
    this.topPoints = allPlayers
      .filter(p => p.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
    
    // Top 5 save percentage (goalies only, minimum 10 GP)
    this.topSavePct = allPlayers
      .filter(p => p.position === 'goalie' && (p.shotsAgainst || 0) >= 1 && (p.gamesPlayed || 0) >= 10)
      .map(g => ({
        ...g,
        savePercentage: ((g.saves || 0) / (g.shotsAgainst || 1)).toFixed(3)
      }))
      .sort((a, b) => parseFloat(b.savePercentage) - parseFloat(a.savePercentage))
      .slice(0, 5);
    
    this.isLoading = false;
  }
}