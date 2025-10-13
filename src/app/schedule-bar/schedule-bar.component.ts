import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EashlMatch, MatchService } from '../store/services/match.service';
import { ImageUrlService } from '../shared/services/image-url.service';

@Component({
  selector: 'app-schedule-bar',
  standalone: true,
  templateUrl: './schedule-bar.component.html',
  styleUrls: ['./schedule-bar.component.css'],
  imports: [CommonModule, RouterModule]
})
export class ScheduleBarComponent implements OnInit {
  matches: EashlMatch[] = [];
  upcomingMatches: EashlMatch[] = [];

  constructor(
    private matchService: MatchService,
    private imageUrlService: ImageUrlService
  ) {}

  ngOnInit() {
    this.matchService.getMatches().subscribe(data => {
      console.log('ScheduleBarComponent received matches:', data);
      this.matches = data;
      this.filterAllMatches();
    }, error => {
      console.error('Error fetching matches in ScheduleBarComponent:', error);
    });
  }

  filterAllMatches() {
    if (!this.matches) {
      this.upcomingMatches = [];
      return;
    }
    
    // Get current date and yesterday's date (start of day)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    console.log('ScheduleBarComponent filtering matches:', {
      totalMatches: this.matches.length,
      today: today.toISOString(),
      yesterday: yesterday.toISOString(),
      matchDates: this.matches.map(m => ({ 
        id: m.id, 
        date: m.date, 
        teams: `${m.homeTeam} vs ${m.awayTeam}`,
        hasEashlData: !!m.eashlData,
        eashlMatchId: m.eashlMatchId
      }))
    });
    
    // Filter matches to only include today and yesterday
    this.upcomingMatches = this.matches
      .filter(match => {
        const matchDate = new Date(match.date);
        matchDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
        
        // Include matches from today or yesterday
        return matchDate.getTime() === today.getTime() || matchDate.getTime() === yesterday.getTime();
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by oldest first
    
    console.log('ScheduleBarComponent filtered matches:', {
      upcomingCount: this.upcomingMatches.length,
      upcomingMatches: this.upcomingMatches.map(m => ({
        id: m.id,
        date: m.date,
        teams: `${m.homeTeam} vs ${m.awayTeam}`,
        hasEashlData: !!m.eashlData,
        eashlMatchId: m.eashlMatchId
      }))
    });
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
    
    // For games without EASHL data, only consider them final if they have actual scores (not just 0-0 defaults)
    // This handles cases where scores were manually entered
    return match.homeScore !== undefined && match.awayScore !== undefined && (match.homeScore > 0 || match.awayScore > 0);
  }
}
