import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MatchService, Match, PlayerMatchStats } from './match.service';
import { PlayerStats } from '../models/models/player-stats.interface';

@Injectable({
  providedIn: 'root'
})
export class PlayerStatsService {
  constructor(
    private matchService: MatchService,
    private http: HttpClient
  ) {}

  getPlayerStats(playerId: string): Observable<PlayerStats> {
    return this.matchService.getMatches().pipe(
      map(matches => this.calculatePlayerStats(matches, playerId))
    );
  }

  private calculatePlayerStats(matches: Match[], playerId: string): PlayerStats {
    // Initialize stats object
    const stats: PlayerStats = {
      playerId: playerId,
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      points: 0,
      plusMinus: 0,
      pim: 0,
      ppg: 0,
      shg: 0,
      gwg: 0,
      shots: 0,
      shotPct: 0,
      hits: 0,
      takeaways: 0,
      giveaways: 0,
      faceoffPct: 0,
      blocked: 0,
      savePercentage: 0,
      goalsAgainst: 0,
      gaa: 0,
      goalsAgainstAverage: 0,
      shutouts: 0,
      wins: 0,
      losses: 0,
      otl: 0
    };

    // Filter matches where the player participated
    const playerMatches = matches.filter(match => 
      match.playerStats.some(ps => ps.playerId.toString() === playerId)
    );

    // If no matches found, return empty stats
    if (playerMatches.length === 0) {
      return stats;
    }

    // Get the first match stats to determine player position
    const firstMatchStats = playerMatches[0].playerStats.find(ps => 
      ps.playerId.toString() === playerId
    );

    if (!firstMatchStats) {
      return stats;
    }

    // Update games played
    stats.gamesPlayed = playerMatches.length;

    if (['Goalie', 'G'].includes(firstMatchStats.position)) {
      // Calculate goalie stats
      let totalSaves = 0;
      let totalShotsAgainst = 0;
      let totalGoalsAgainst = 0;
      let shutoutCount = 0;

      playerMatches.forEach(match => {
        const matchStats = match.playerStats.find(ps => ps.playerId.toString() === playerId);
        if (matchStats) {
          if (matchStats.saves && matchStats.shotsAgainst) {
            totalSaves += matchStats.saves;
            totalShotsAgainst += matchStats.shotsAgainst;
          }
          if (matchStats.goalsAgainst !== undefined) {
            totalGoalsAgainst += matchStats.goalsAgainst;
          }
          if (matchStats.shutout) {
            shutoutCount += matchStats.shutout;
          }
        }
      });

      // Calculate save percentage and GAA
      stats.savePercentage = totalShotsAgainst > 0 ? 
        totalSaves / totalShotsAgainst : 0;
      stats.goalsAgainstAverage = stats.gamesPlayed > 0 ? 
        totalGoalsAgainst / stats.gamesPlayed : 0;
      stats.shutouts = shutoutCount;
    } else {
      // Calculate skater stats
      playerMatches.forEach(match => {
        const matchStats = match.playerStats.find(ps => ps.playerId.toString() === playerId);
        if (matchStats) {
          stats.goals! += matchStats.goals || 0;
          stats.assists! += matchStats.assists || 0;
          stats.plusMinus! += matchStats.plusMinus || 0;
        }
      });

      // Calculate total points
      stats.points = stats.goals! + stats.assists!;
    }

    return stats;
  }
} 