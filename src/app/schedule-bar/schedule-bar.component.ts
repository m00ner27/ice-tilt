import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EashlMatch, MatchService } from '../store/services/match.service';
import { environment } from '../../environments/environment';

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

  constructor(private matchService: MatchService) {}

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
    
    console.log('ScheduleBarComponent filtering matches:', {
      totalMatches: this.matches.length,
      matchDates: this.matches.map(m => ({ 
        id: m.id, 
        date: m.date, 
        teams: `${m.homeTeam} vs ${m.awayTeam}`,
        hasEashlData: !!m.eashlData,
        eashlMatchId: m.eashlMatchId
      }))
    });
    
    this.upcomingMatches = this.matches
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by oldest first
      .slice(-10); // Take the last 10 games (most recent on the right)
    
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

  // Method to get the full image URL
  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/square-default.png';
    }
    
    // If it's already a full URL, return as is
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // If it's a relative path starting with /uploads, prepend the API URL
    if (logoUrl.startsWith('/uploads/')) {
      return `${environment.apiUrl}${logoUrl}`;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }

  isFinal(match: EashlMatch): boolean {
    // A game is final if it has EASHL data OR if it's a merged game with scores
    return !!match.eashlData || (!!match.eashlMatchId && match.eashlMatchId.includes('+') && match.homeScore !== undefined && match.awayScore !== undefined);
  }
}
