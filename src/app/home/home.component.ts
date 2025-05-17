import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  imports: [CommonModule, RouterModule]
})
export class HomeComponent implements OnInit {
  topGoals: AggregatedPlayer[] = [];
  topAssists: AggregatedPlayer[] = [];
  topPoints: AggregatedPlayer[] = [];
  topSavePct: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('assets/data/mock_matches.json').subscribe(matches => {
      const playerMap: { [id: number]: AggregatedPlayer } = {};
      // Aggregate stats
      matches.forEach(match => {
        match.playerStats.forEach((stat: any) => {
          if (!playerMap[stat.playerId]) {
            playerMap[stat.playerId] = {
              playerId: stat.playerId,
              name: stat.name,
              team: stat.team,
              number: stat.number,
              position: stat.position,
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
          if (stat.goals !== undefined) playerMap[stat.playerId].goals += stat.goals;
          if (stat.assists !== undefined) playerMap[stat.playerId].assists += stat.assists;
          // Aggregate goalie stats
          if (stat.saves !== undefined) playerMap[stat.playerId].saves! += stat.saves;
          if (stat.shotsAgainst !== undefined) playerMap[stat.playerId].shotsAgainst! += stat.shotsAgainst;
          if (stat.goalsAgainst !== undefined) playerMap[stat.playerId].goalsAgainst! += stat.goalsAgainst;
          if (stat.shutout !== undefined) playerMap[stat.playerId].shutouts! += stat.shutout;
        });
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