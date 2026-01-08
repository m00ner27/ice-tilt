import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../store/services/api.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { AdSenseComponent, AdSenseConfig } from '../components/adsense/adsense.component';

interface Champion {
  bracketId: string;
  bracketName: string;
  seasonId: string;
  seasonName: string;
  clubId: string;
  clubName: string;
  clubLogoUrl?: string;
  roster: any[];
}

@Component({
  selector: 'app-champions',
  standalone: true,
  imports: [CommonModule, RouterModule, AdSenseComponent],
  templateUrl: './champions.component.html',
  styleUrls: ['./champions.component.css']
})
export class ChampionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  champions: Champion[] = [];
  loading: boolean = false;
  error: string | null = null;
  
  // AdSense configuration
  bannerAdConfig: AdSenseConfig = {
    adSlot: '8840984486',
    adFormat: 'auto',
    responsive: true,
    className: 'banner-ad'
  };

  constructor(
    private apiService: ApiService,
    private imageUrlService: ImageUrlService
  ) {}

  ngOnInit() {
    this.loadChampions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadChampions() {
    this.loading = true;
    this.error = null;
    
    // Get all playoff brackets (not just completed status - check for completed final series)
    // This handles cases where bracket status isn't set but final series is completed
    this.apiService.getPlayoffBrackets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (brackets) => {
          try {
            console.log('Loaded all brackets:', brackets.length);
            const championsData: Champion[] = [];
            
            // Process each bracket - fetch full details to get populated series
            for (const bracket of brackets) {
              try {
                // Fetch full bracket details to get populated series data
                const fullBracket = await this.apiService.getPlayoffBracket(bracket._id).toPromise();
                console.log('Processing bracket:', fullBracket.name, 'Series count:', fullBracket.series?.length);
                
                // Find the final series (highest roundOrder with status completed)
                const finalSeries = this.findFinalSeries(fullBracket);
                console.log('Final series found:', finalSeries);
                
                if (finalSeries && finalSeries.winnerClubId) {
                  const winnerClubId = typeof finalSeries.winnerClubId === 'object' 
                    ? finalSeries.winnerClubId._id || finalSeries.winnerClubId
                    : finalSeries.winnerClubId;
                  
                  const seasonId = typeof fullBracket.seasonId === 'object'
                    ? fullBracket.seasonId._id || fullBracket.seasonId
                    : fullBracket.seasonId;
                  
                  // Get club details
                  const club = await this.apiService.getClubById(winnerClubId).toPromise();
                  
                  // Get season name
                  const seasons = await this.apiService.getSeasons().toPromise();
                  const season = seasons?.find((s: any) => s._id === seasonId);
                  const seasonName = season?.name || 'Unknown Season';
                  
                  // Get club roster for that season
                  let roster: any[] = [];
                  try {
                    roster = await this.apiService.getClubRoster(winnerClubId, seasonId).toPromise() || [];
                  } catch (error) {
                    console.warn(`Could not load roster for club ${club?.name} in season ${seasonName}:`, error);
                    roster = [];
                  }
                  
                  championsData.push({
                    bracketId: fullBracket._id,
                    bracketName: fullBracket.name,
                    seasonId: seasonId,
                    seasonName: seasonName,
                    clubId: winnerClubId,
                    clubName: club?.name || 'Unknown Club',
                    clubLogoUrl: club?.logoUrl,
                    roster: roster || []
                  });
                }
              } catch (error) {
                console.error(`Error processing bracket ${bracket._id}:`, error);
                // Continue with next bracket
              }
            }
            
            // Sort by season date (newest first)
            const seasons = await this.apiService.getSeasons().toPromise();
            championsData.sort((a, b) => {
              const seasonA = seasons?.find((s: any) => s._id === a.seasonId);
              const seasonB = seasons?.find((s: any) => s._id === b.seasonId);
              
              const dateA = seasonA?.endDate ? new Date(seasonA.endDate).getTime() : 0;
              const dateB = seasonB?.endDate ? new Date(seasonB.endDate).getTime() : 0;
              
              // If no endDate, use startDate
              const finalDateA = dateA || (seasonA?.startDate ? new Date(seasonA.startDate).getTime() : 0);
              const finalDateB = dateB || (seasonB?.startDate ? new Date(seasonB.startDate).getTime() : 0);
              
              return finalDateB - finalDateA; // Newest first
            });
            
            this.champions = championsData;
            this.loading = false;
          } catch (error: any) {
            console.error('Error processing champions:', error);
            this.error = error.message || 'Failed to load champions';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading playoff brackets:', error);
          this.error = error.message || 'Failed to load champions';
          this.loading = false;
        }
      });
  }

  private findFinalSeries(bracket: any): any {
    if (!bracket.series || bracket.series.length === 0) {
      console.log('No series found in bracket:', bracket.name);
      return null;
    }
    
    console.log('Bracket series:', bracket.series.map((s: any) => ({
      roundOrder: s.roundOrder,
      status: s.status,
      winnerClubId: s.winnerClubId,
      homeClubId: s.homeClubId,
      awayClubId: s.awayClubId
    })));
    
    // Find the highest roundOrder
    const maxRoundOrder = Math.max(...bracket.series.map((s: any) => s.roundOrder || 0));
    console.log('Max round order:', maxRoundOrder);
    
    // Find completed series in the final round
    const finalRoundSeries = bracket.series.filter((s: any) => {
      const isFinalRound = s.roundOrder === maxRoundOrder;
      const isCompleted = s.status === 'completed';
      const hasWinner = s.winnerClubId;
      
      // Handle winnerClubId as object or string
      const winnerId = typeof s.winnerClubId === 'object' && s.winnerClubId !== null
        ? s.winnerClubId._id || s.winnerClubId
        : s.winnerClubId;
      
      const matches = isFinalRound && isCompleted && winnerId;
      console.log('Series check:', {
        roundOrder: s.roundOrder,
        isFinalRound,
        isCompleted,
        hasWinner: !!winnerId,
        winnerId,
        matches
      });
      
      return matches;
    });
    
    console.log('Final round series found:', finalRoundSeries.length);
    
    if (finalRoundSeries.length > 0) {
      // Return the first completed series (should only be one in finals)
      return finalRoundSeries[0];
    }
    
    return null;
  }

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  onImageError(event: any): void {
    if (event.target.src.includes('square-default.png')) {
      return;
    }
    event.target.src = '/assets/images/square-default.png';
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
}

