import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../store/services/api.service';
import { ImageUrlService } from '../../shared/services/image-url.service';

@Component({
  selector: 'app-tournament-standings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tournament-standings.component.html'
})
export class TournamentStandingsComponent implements OnInit {
  tournamentId: string | null = null;
  tournamentName = '';
  standings: any[] = [];
  games: any[] = [];
  loading = true;
  error: string | null = null;
  activeTab: 'standings' | 'games' = 'standings';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private imageUrlService: ImageUrlService
  ) {}

  ngOnInit() {
    this.tournamentId = this.route.snapshot.paramMap.get('id');
    if (!this.tournamentId) {
      this.error = 'Tournament ID missing';
      this.loading = false;
      return;
    }
    this.api.getTournamentById(this.tournamentId).subscribe({
      next: (t) => {
        this.tournamentName = t?.name || 'Tournament';
      },
      error: () => {}
    });
    this.api.getTournamentStandings(this.tournamentId).subscribe({
      next: (data) => {
        this.standings = data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load standings';
        this.loading = false;
      }
    });
  }

  loadGames() {
    if (!this.tournamentId || this.games.length > 0) return;
    this.api.getGamesByTournament(this.tournamentId).subscribe({
      next: (data) => (this.games = data || []),
      error: () => {}
    });
  }

  getImageUrl(url: string | undefined): string {
    return this.imageUrlService.getImageUrl(url);
  }

  onImageError(event: any) {
    if (event?.target?.src && !event.target.src.includes('square-default.png')) {
      event.target.src = '/assets/images/square-default.png';
    }
  }

  backToTournaments() {
    this.router.navigate(['/tournaments']);
  }
}
