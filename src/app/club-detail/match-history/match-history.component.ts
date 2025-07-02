import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Match, ClubInfo } from '../../store/services/match.service';

@Component({
  selector: 'app-match-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-history.component.html',
  styleUrls: ['./match-history.component.css']
})
export class MatchHistoryComponent {
  @Input() matches: Match[] = [];
  @Input() teamName: string = '';
  
  constructor(private router: Router) { }
  
  // Navigate to match detail page
  navigateToMatchDetail(match: Match): void {
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
  didTeamWin(match: Match): boolean {
    const isHomeTeam = match.homeTeam === this.teamName;
    return isHomeTeam ? 
      match.homeScore > match.awayScore : 
      match.awayScore > match.homeScore;
  }
  
  // Get opponent name for a match
  getOpponent(match: Match): string {
    return match.homeTeam === this.teamName ? match.awayTeam : match.homeTeam;
  }

  getOurClub(match: Match): ClubInfo | undefined {
    return match.homeTeam === this.teamName ? match.homeClub : match.awayClub;
  }

  getOpponentClub(match: Match): ClubInfo | undefined {
    return match.homeTeam === this.teamName ? match.awayClub : match.homeClub;
  }

  getOurScore(match: Match): number {
    return match.homeTeam === this.teamName ? match.homeScore : match.awayScore;
  }

  getOpponentScore(match: Match): number {
    return match.homeTeam === this.teamName ? match.awayScore : match.homeScore;
  }
  
  // Get home/away label
  getLocationLabel(match: Match): string {
    return match.homeTeam === this.teamName ? 'Home' : 'Away';
  }
} 