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
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 6;
  
  constructor(
    private router: Router,
    private imageUrlService: ImageUrlService
  ) { }
  
  // Get sorted matches (most recent first)
  get sortedMatches(): EashlMatch[] {
    // Create a copy and sort by date (newest first)
    return [...this.matches].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
  }
  
  // Get paginated matches
  get paginatedMatches(): EashlMatch[] {
    const sorted = this.sortedMatches;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }
  
  // Get total number of pages
  get totalPages(): number {
    return Math.ceil(this.matches.length / this.itemsPerPage);
  }
  
  // Check if pagination is needed
  get needsPagination(): boolean {
    return this.matches.length > this.itemsPerPage;
  }
  
  // Navigate to previous page
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  
  // Navigate to next page
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  
  // Navigate to specific page
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  // Get page numbers for display
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Method to get the full image URL using the centralized service
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }
  
  // Navigate to match detail page
  navigateToMatchDetail(match: EashlMatch): void {
    const matchId = match.id || (match as any)._id;
    if (!matchId) {
      console.error('Match ID is undefined:', match);
      return;
    }
    this.router.navigate(['/match', matchId], { 
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
    // Handle forfeit games
    if (match.forfeit && match.forfeit !== 'none') {
      const isHomeTeam = match.homeTeam === this.teamName;
      return (isHomeTeam && match.forfeit === 'forfeit-home') || 
             (!isHomeTeam && match.forfeit === 'forfeit-away');
    }
    
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
    // Handle forfeit games
    if (match.forfeit && match.forfeit !== 'none') {
      const isHomeTeam = match.homeTeam === this.teamName;
      if ((isHomeTeam && match.forfeit === 'forfeit-home') || 
          (!isHomeTeam && match.forfeit === 'forfeit-away')) {
        return 1; // Forfeit win
      } else {
        return 0; // Forfeit loss
      }
    }
    return match.homeTeam === this.teamName ? match.homeScore : match.awayScore;
  }

  getOpponentScore(match: EashlMatch): number {
    // Handle forfeit games
    if (match.forfeit && match.forfeit !== 'none') {
      const isHomeTeam = match.homeTeam === this.teamName;
      if ((isHomeTeam && match.forfeit === 'forfeit-home') || 
          (!isHomeTeam && match.forfeit === 'forfeit-away')) {
        return 0; // Forfeit win
      } else {
        return 1; // Forfeit loss
      }
    }
    return match.homeTeam === this.teamName ? match.awayScore : match.homeScore;
  }
  
  // Get home/away label
  getLocationLabel(match: EashlMatch): string {
    return match.homeTeam === this.teamName ? 'Home' : 'Away';
  }
  
  // Check if match went to overtime
  isOvertime(match: EashlMatch): boolean {
    return match.isOvertime === true;
  }

  // Check if match went to shootout
  isShootout(match: EashlMatch): boolean {
    return match.isShootout === true;
  }

  // Get overtime indicator text
  getOvertimeIndicator(match: EashlMatch): string {
    if (match.isShootout) {
      return 'SO';
    } else if (match.isOvertime) {
      return 'OT';
    }
    return '';
  }

  // Expose Math.min for template
  Math = Math;

  // Handle image load errors by hiding the broken image
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }
} 