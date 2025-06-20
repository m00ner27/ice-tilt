import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Player } from '../store/models/models/player.interface';
import { PlayerStats } from '../store/models/models/player-stats.interface';
import { PlayerStatsService } from '../store/services/player-stats.service';
import { ApiService } from '../store/services/api.service';

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
    private apiService: ApiService,
    private playerStatsService: PlayerStatsService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const playerId = params['id'];
      this.loadPlayerData(playerId);
    });
  }

  private loadPlayerData(playerId: string) {
    // Fetch player from backend
    this.apiService.getUsers().subscribe({
      next: (users) => {
        const user = users.find((u: any) => (u._id || u.id) === playerId);
        if (user) {
          const profile = user.playerProfile || {};
          this.player = {
            id: user._id || user.id,
            name: profile.name || user.name || '',
            position: profile.position || 'Forward',
            number: profile.number || '',
            psnId: profile.psnId || user.psnId || '',
            xboxGamertag: profile.xboxGamertag || user.xboxGamertag || '',
            country: profile.location || '',
            handedness: profile.handedness || 'Left',
            currentClubId: profile.currentClubId || '',
            currentClubName: profile.currentClubName || '',
            status: profile.status || 'Free Agent',
            lastActive: user.lastActive || '',
            stats: user.stats || {},
            secondaryPositions: profile.secondaryPositions || [],
          };
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

  getTeamLogo(team: string): string {
    if (!team) return 'assets/images/square-default.png';
    const teamMap: { [key: string]: string } = {
      'roosters': 'square-iserlohnroosters.png',
      // Add more mappings as needed
    };
    const key = team.replace(/\s+/g, '').toLowerCase();
    if (teamMap[key]) {
      return 'assets/images/' + teamMap[key];
    }
    return 'assets/images/square-' + key + '.png';
  }
} 