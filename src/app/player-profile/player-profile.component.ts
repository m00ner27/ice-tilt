import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Player } from '../models/player.interface';
import { PlayerStats } from '../models/player-stats.interface';
import { PlayerStatsService } from '../store/services/player-stats.service';

@Component({
  selector: 'app-player-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.css']
})
export class PlayerProfileComponent implements OnInit {
  player: Player | null = null;
  playerStats: PlayerStats | null = null;
  error: string | null = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private playerStatsService: PlayerStatsService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const playerId = params['id'];
      this.loadPlayerData(playerId);
    });
  }

  private loadPlayerData(playerId: string) {
    // First load the player data
    this.http.get<{players: Player[]}>('/assets/data/mock_all_players.json')
      .subscribe({
        next: (data) => {
          const player = data.players.find(p => p.id === playerId);
          if (player) {
            this.player = player;
            this.loadPlayerStats(playerId);
          } else {
            this.error = 'Player not found';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading player:', error);
          this.error = 'Error loading player data';
          this.loading = false;
        }
      });
  }

  private loadPlayerStats(playerId: string) {
    // Load real player statistics from matches
    this.playerStatsService.getPlayerStats(playerId).subscribe({
      next: (stats) => {
        this.playerStats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading player stats:', error);
        this.error = 'Error loading player statistics';
        this.loading = false;
      }
    });
  }
} 