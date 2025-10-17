import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EashlMatch, MatchService } from '../store/services/match.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { AdSenseComponent, AdSenseConfig } from '../components/adsense/adsense.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [CommonModule, RouterModule, AdSenseComponent]
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  topGoals: AggregatedPlayer[] = [];
  topAssists: AggregatedPlayer[] = [];
  topPoints: AggregatedPlayer[] = [];
  topSavePct: any[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  
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
    private imageUrlService: ImageUrlService
  ) {}

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl, 'assets/images/1ithlwords.png');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    // Delay player stats loading to improve initial page load
    setTimeout(() => {
      this.loadPlayerStats();
    }, 500);
    this.setupProgressiveLoading();
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
          
          // Limit to recent matches for better performance (last 30 days)
          const recentMatches = this.getRecentMatches(matches);
          this.calculatePlayerStats(recentMatches);
        },
        error: (error) => {
          console.error('Error loading matches for player stats:', error);
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  getRecentMatches(matches: EashlMatch[]): EashlMatch[] {
    // Only get matches from the last 3 days for better performance
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return matches.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate >= threeDaysAgo;
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
              shutouts: 0
            };
          }
          
          // Aggregate stats (optimized)
          const currentPlayer = playerMap[numericPlayerId];
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
    
    // Top 5 goals
    this.topGoals = allPlayers
      .filter(p => p.position !== 'goalie' && p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
    
    // Top 5 assists
    this.topAssists = allPlayers
      .filter(p => p.position !== 'goalie' && p.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 5);
    
    // Top 5 points
    this.topPoints = allPlayers
      .filter(p => p.position !== 'goalie' && p.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
    
    // Top 5 save percentage (goalies only)
    this.topSavePct = allPlayers
      .filter(p => p.position === 'goalie' && (p.shotsAgainst || 0) >= 1)
      .map(g => ({
        ...g,
        savePercentage: ((g.saves || 0) / (g.shotsAgainst || 1)).toFixed(3)
      }))
      .sort((a, b) => parseFloat(b.savePercentage) - parseFloat(a.savePercentage))
      .slice(0, 5);
    
    this.isLoading = false;
  }
}