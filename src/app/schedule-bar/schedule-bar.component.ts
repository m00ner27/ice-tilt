import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Match, MatchService } from '../store/services/match.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-schedule-bar',
  standalone: true,
  templateUrl: './schedule-bar.component.html',
  styleUrls: ['./schedule-bar.component.css'],
  imports: [CommonModule, RouterModule]
})
export class ScheduleBarComponent implements OnInit {
  matches: Match[] = [];
  upcomingMatches: Match[] = [];

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
    
    this.upcomingMatches = this.matches
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by earliest first
      .slice(0, 10); // Show the 10 most recent matches
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

  isFinal(match: Match): boolean {
    return !!match.eashlData;
  }
}
