import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Match, MatchService } from '../store/services/match.service';
import { RecentTransactionsComponent } from '../recent-transactions/recent-transactions.component';

interface AggregatedPlayer {
  playerId: number;
  name: string;
  team: string;
  number: number;
  position: string;
  goals: number;
  assists: number;
  points: number;
  saves?: number;
  shotsAgainst?: number;
  goalsAgainst?: number;
  shutouts?: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  imports: [CommonModule, RouterModule, RecentTransactionsComponent]
})
export class HomeComponent implements OnInit {
  topGoals: AggregatedPlayer[] = [];
  topAssists: AggregatedPlayer[] = [];
  topPoints: AggregatedPlayer[] = [];
  topSavePct: any[] = [];

  constructor(private matchService: MatchService) {}

  ngOnInit() {
    this.matchService.getMatches().subscribe(matches => {
      if (!matches) {
        return;
      }
      const playerMap: { [id: number]: AggregatedPlayer } = {};
      // Aggregate stats
      matches.forEach(match => {
        if (match.eashlData?.players) {
          const homePlayers = match.eashlData.players.home ? Object.values(match.eashlData.players.home) : [];
          const awayPlayers = match.eashlData.players.away ? Object.values(match.eashlData.players.away) : [];
          const allPlayers = [...homePlayers, ...awayPlayers];
          
          allPlayers.forEach((stat: any) => {
            if (!stat.details) return; // Skip if player details are missing

            if (!playerMap[stat.player_id]) {
              playerMap[stat.player_id] = {
                playerId: stat.player_id,
                name: stat.details.name,
                team: stat.details.team,
                number: stat.details.number,
                position: stat.details.pos,
                goals: 0,
                assists: 0,
                points: 0,
                saves: 0,
                shotsAgainst: 0,
                goalsAgainst: 0,
                shutouts: 0
              };
            }
            // Aggregate skater stats
            if (stat.goals !== undefined) playerMap[stat.player_id].goals += stat.goals;
            if (stat.assists !== undefined) playerMap[stat.player_id].assists += stat.assists;
            // Aggregate goalie stats
            if (stat.saves !== undefined) playerMap[stat.player_id].saves! += stat.saves;
            if (stat.shots_against !== undefined) playerMap[stat.player_id].shotsAgainst! += stat.shots_against;
            if (stat.goals_against !== undefined) playerMap[stat.player_id].goalsAgainst! += stat.goals_against;
            if (stat.shutouts !== undefined) playerMap[stat.player_id].shutouts! += stat.shutouts;
          });
        }
      });
      // Calculate points for skaters
      Object.values(playerMap).forEach(p => {
        p.points = (p.goals || 0) + (p.assists || 0);
      });
      // Top 5 goals
      this.topGoals = Object.values(playerMap)
        .filter(p => p.position !== 'G')
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 5);
      // Top 5 assists
      this.topAssists = Object.values(playerMap)
        .filter(p => p.position !== 'G')
        .sort((a, b) => b.assists - a.assists)
        .slice(0, 5);
      // Top 5 points
      this.topPoints = Object.values(playerMap)
        .filter(p => p.position !== 'G')
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
      // Top 5 save percentage (goalies)
      this.topSavePct = Object.values(playerMap)
        .filter(p => p.position === 'G' && p.shotsAgainst! > 0)
        .map(g => ({
          ...g,
          savePercentage: (g.saves! / g.shotsAgainst!).toFixed(3)
        }))
        .sort((a, b) => parseFloat(b.savePercentage) - parseFloat(a.savePercentage))
        .slice(0, 5);
    });
  }

  getTeamLogo(team: string | undefined): string {
    if (!team) return 'assets/images/square-default.png';
    const teamMap: { [key: string]: string } = {
      'roosters': 'square-iserlohnroosters.png',
      // Add more mappings as needed
    };
    const key = team?.replace(/\s+/g, '').toLowerCase().replace(/^[^a-z0-9]+/, '') || '';
    if (teamMap[key]) {
      return 'assets/images/' + teamMap[key];
    }
    return 'assets/images/square-' + key + '.png';
  }
}