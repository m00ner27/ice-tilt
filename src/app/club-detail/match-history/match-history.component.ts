import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EashlMatch, ClubInfo } from '../../store/services/match.service';
import { ImageUrlService } from '../../shared/services/image-url.service';

@Component({
  selector: 'app-match-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-history.component.html',
  styleUrls: ['./match-history.component.css']
})
export class MatchHistoryComponent {
  @Input() matches: EashlMatch[] = [];
  @Input() teamName: string = '';
  
  constructor(
    private router: Router,
    private imageUrlService: ImageUrlService
  ) { }

  // Method to get the full image URL using the centralized service
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }
  
  // Navigate to match detail page
  navigateToMatchDetail(match: EashlMatch): void {
    this.router.navigate(['/match', match.id], { 
      state: { 
        match: match,
        teamName: this.teamName
      } 
    });
  }
  
  // Format the date to a more readable format
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Determine if the team won the match
  didTeamWin(match: EashlMatch): boolean {
    const isHomeTeam = match.homeTeam === this.teamName;
    return isHomeTeam ? 
      match.homeScore > match.awayScore : 
      match.awayScore > match.homeScore;
  }
  
  // Get opponent name for a match
  getOpponent(match: EashlMatch): string {
    return match.homeTeam === this.teamName ? match.awayTeam : match.homeTeam;
  }

  getOurClub(match: EashlMatch): ClubInfo | undefined {
    return match.homeTeam === this.teamName ? match.homeClub : match.awayClub;
  }

  getOpponentClub(match: EashlMatch): ClubInfo | undefined {
    return match.homeTeam === this.teamName ? match.awayClub : match.homeClub;
  }

  getOurScore(match: EashlMatch): number {
    return match.homeTeam === this.teamName ? match.homeScore : match.awayScore;
  }

  getOpponentScore(match: EashlMatch): number {
    return match.homeTeam === this.teamName ? match.awayScore : match.homeScore;
  }
  
  // Get home/away label
  getLocationLabel(match: EashlMatch): string {
    return match.homeTeam === this.teamName ? 'Home' : 'Away';
  }
} 