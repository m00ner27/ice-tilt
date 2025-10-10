import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EashlMatch, MatchService } from '../store/services/match.service';
import { TransactionsComponent } from '../transactions/transactions.component';
import { ScheduleComponent } from '../schedule/schedule.component';
import { ImageUrlService } from '../shared/services/image-url.service';
import { AdSenseComponent, AdSenseConfig } from '../components/adsense/adsense.component';

interface AggregatedPlayer {
  playerId: number;
  name: string;
  team: string;
  teamLogo: string;
  number: number;
  position: string;
  goals: number;
  assists: number;
  points: number;
  saves: number;
  shotsAgainst: number;
  goalsAgainst: number;
  shutouts: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [CommonModule, RouterModule, TransactionsComponent, ScheduleComponent, AdSenseComponent]
})
export class HomeComponent implements OnInit {
  topGoals: AggregatedPlayer[] = [];
  topAssists: AggregatedPlayer[] = [];
  topPoints: AggregatedPlayer[] = [];
  topSavePct: any[] = [];
  isLoading: boolean = true;

  // AdSense configurations
  bannerAdConfig: AdSenseConfig = {
    adSlot: '8840984486', // Your actual banner ad unit ID
    adFormat: 'auto',
    responsive: true,
    className: 'banner-ad'
  };

  rectangleAdConfig: AdSenseConfig = {
    adSlot: '8840984486', // Using same ad unit for now - you can create another later
    adFormat: 'rectangle',
    adStyle: {
      display: 'block',
      width: '300px',
      height: '250px'
    },
    responsive: true,
    className: 'rectangle-ad'
  };

  constructor(
    private matchService: MatchService,
    private imageUrlService: ImageUrlService
  ) {}

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl, 'assets/images/1ithlwords.png');
  }

  ngOnInit() {
    this.matchService.getMatches().subscribe(matches => {
      if (!matches) {
        this.isLoading = false;
        return;
      }
      
      const playerMap: { [id: number]: AggregatedPlayer } = {};
      const teamLogoMap = new Map<string, string>();
      
      // Build team logo map from club data
      matches.forEach(match => {
        if (match.homeTeam) teamLogoMap.set(match.homeTeam, this.getImageUrl(match.homeClub?.logoUrl));
        if (match.awayTeam) teamLogoMap.set(match.awayTeam, this.getImageUrl(match.awayClub?.logoUrl));
      });
      
      // Aggregate stats across ALL matches (all-time leaders)
      matches.forEach((match, index) => {
        if (match.eashlData?.players) {
          // EASHL data structure: players are stored by club ID, not by home/away
          Object.keys(match.eashlData.players).forEach(clubId => {
            const clubPlayers = match.eashlData.players[clubId];
            
            Object.entries(clubPlayers).forEach(([playerId, player]: [string, any]) => {
              // Use the playerId from the object key, which is more reliable
              const numericPlayerId = parseInt(playerId);
              const playerName = player.playername || player.name || `Player ${playerId}`;
              

              // Determine team name by matching club ID to home/away club
              let teamName = 'Unknown';
              if (match.homeClub?.eashlClubId === clubId) {
                teamName = match.homeTeam;
              } else if (match.awayClub?.eashlClubId === clubId) {
                teamName = match.awayTeam;
              } else {
                // Fallback for cases where eashlClubId doesn't match
                teamName = match.homeTeam;
              }
              
              if (!playerMap[numericPlayerId]) {
                playerMap[numericPlayerId] = {
                  playerId: numericPlayerId,
                  name: playerName,
                  team: teamName,
                  teamLogo: teamLogoMap.get(teamName) || this.getImageUrl('assets/images/1ithlwords.png'),
                  number: player.jerseynum || player.number || 0,
                  position: player.position || 'Unknown',
                  goals: 0,
                  assists: 0,
                  points: 0,
                  saves: 0,
                  shotsAgainst: 0,
                  goalsAgainst: 0,
                  shutouts: 0
                };
              }
              
              // Aggregate skater stats using correct field names
              const currentPlayer = playerMap[numericPlayerId];
              if (currentPlayer) {
                if (player.skgoals !== undefined) currentPlayer.goals += parseInt(player.skgoals) || 0;
                if (player.skassists !== undefined) currentPlayer.assists += parseInt(player.skassists) || 0;
                
                // Aggregate goalie stats using correct field names
                if (player.glsaves !== undefined) currentPlayer.saves += parseInt(player.glsaves) || 0;
                if (player.glshots !== undefined) currentPlayer.shotsAgainst += parseInt(player.glshots) || 0;
                if (player.glga !== undefined) currentPlayer.goalsAgainst += parseInt(player.glga) || 0;
                if (player.glso !== undefined) currentPlayer.shutouts += parseInt(player.glso) || 0;
              }
            });
          });
        }
      });
      

      
      // Calculate points for skaters
      Object.values(playerMap).forEach(p => {
        p.points = (p.goals || 0) + (p.assists || 0);
      });
      
      // Top 5 goals (all-time leaders)
      this.topGoals = Object.values(playerMap)
        .filter(p => p.position !== 'goalie' && p.goals > 0)
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 5);
      
      // Top 5 assists (all-time leaders)
      this.topAssists = Object.values(playerMap)
        .filter(p => p.position !== 'goalie' && p.assists > 0)
        .sort((a, b) => b.assists - a.assists)
        .slice(0, 5);
      
      // Top 5 points (all-time leaders)
      this.topPoints = Object.values(playerMap)
        .filter(p => p.position !== 'goalie' && p.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
      
      // Check for goalies
      const allGoalies = Object.values(playerMap).filter(p => p.position === 'goalie');
      
      
      // Top 5 save percentage (all-time leaders, minimum 1 shot against)
      this.topSavePct = Object.values(playerMap)
        .filter(p => p.position === 'goalie' && (p.shotsAgainst || 0) >= 1)
        .map(g => ({
          ...g,
          savePercentage: ((g.saves || 0) / (g.shotsAgainst || 1)).toFixed(3)
        }))
        .sort((a, b) => parseFloat(b.savePercentage) - parseFloat(a.savePercentage))
        .slice(0, 5);
      
      this.isLoading = false;
    });
  }
}