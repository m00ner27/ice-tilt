import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Match } from '../../services/match.service';

@Component({
  selector: 'app-match-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-history.component.html',
  styleUrls: ['./match-history.component.css']
})
export class MatchHistoryComponent implements OnInit {
  @Input() matches: Match[] = [];
  @Input() teamName: string = '';
  
  // Track team's record
  wins: number = 0;
  losses: number = 0;
  
  constructor(private router: Router) { }
  
  ngOnInit(): void {
    this.calculateRecord();
  }
  
  // Calculate the team's win/loss record
  calculateRecord(): void {
    this.wins = 0;
    this.losses = 0;
    
    this.matches.forEach(match => {
      const isHomeTeam = match.homeTeam === this.teamName;
      const homeWins = match.homeScore > match.awayScore;
      
      if ((isHomeTeam && homeWins) || (!isHomeTeam && !homeWins)) {
        this.wins++;
      } else {
        this.losses++;
      }
    });
  }
  
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
  
  // Get score display with team score first
  getScoreDisplay(match: Match): string {
    if (match.homeTeam === this.teamName) {
      return `${match.homeScore} - ${match.awayScore}`;
    } else {
      return `${match.awayScore} - ${match.homeScore}`;
    }
  }
  
  // Get home/away label
  getLocationLabel(match: Match): string {
    return match.homeTeam === this.teamName ? 'Home' : 'Away';
  }
} 