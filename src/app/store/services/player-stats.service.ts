import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MatchService, EashlMatch, PlayerMatchStats } from './match.service';
import { PlayerStats } from '../models/models/player-stats.interface';

@Injectable({
  providedIn: 'root'
})
export class PlayerStatsService {
  constructor(
    private matchService: MatchService,
    private http: HttpClient
  ) {}

  getPlayerStats(playerId: string, gamertag?: string): Observable<PlayerStats> {
    return this.matchService.getMatches().pipe(
      map(matches => this.calculatePlayerStats(matches, playerId, gamertag))
    );
  }

  private calculatePlayerStats(matches: EashlMatch[], playerId: string, gamertag?: string): PlayerStats {
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
      blockedShots: 0,
      passAttempts: 0,
      passes: 0,
      passPct: 0,
      playerScore: 0,
      possession: 0,
      toi: 0,
      otgPct: 0,
      savePercentage: 0,
      goalsAgainst: 0,
      gaa: 0,
      goalsAgainstAverage: 0,
      shutouts: 0,
      wins: 0,
      losses: 0,
      otl: 0
    };

    // Filter matches where the player participated (check eashlData.players)
    const playerMatches = matches.filter(match => {
      if (!match.eashlData || !match.eashlData.players) {
        return false;
      }
      
      // Check all clubs in the match for the player
      return Object.values(match.eashlData.players).some((clubPlayers: any) => {
        if (typeof clubPlayers === 'object' && clubPlayers !== null) {
          return Object.values(clubPlayers).some((playerData: any) => {
            // Look for player by gamertag if provided
            if (gamertag && playerData && playerData.playername === gamertag) {
              return true;
            }
            return false;
          });
        }
        return false;
      });
    });

    // If no matches found, return empty stats
    if (playerMatches.length === 0) {
      console.log('No matches found for player:', playerId, 'gamertag:', gamertag);
      return stats;
    }

    console.log('Found matches for player:', playerId, 'gamertag:', gamertag, 'Count:', playerMatches.length);

    // Calculate stats from the matches
    playerMatches.forEach(match => {
      if (!match.eashlData || !match.eashlData.players) {
        return;
      }

      // Find the player data in this match
      Object.values(match.eashlData.players).forEach((clubPlayers: any) => {
        if (typeof clubPlayers === 'object' && clubPlayers !== null) {
          Object.values(clubPlayers).forEach((playerData: any) => {
            if (gamertag && playerData && playerData.playername === gamertag) {
              console.log('Found player data:', playerData);
              console.log('Raw skater stats:', {
                skgoals: playerData.skgoals,
                skassists: playerData.skassists,
                skplusmin: playerData.skplusmin,
                skpim: playerData.skpim,
                skshots: playerData.skshots,
                skhits: playerData.skhits,
                sktakeaways: playerData.sktakeaways,
                skgiveaways: playerData.skgiveaways,
                skpassattempts: playerData.skpassattempts,
                skpasses: playerData.skpasses,
                skpasspct: playerData.skpasspct,
                score: playerData.score,
                skpossession: playerData.skpossession,
                toi: playerData.toi,
                toiseconds: playerData.toiseconds,
                skshotpct: playerData.skshotpct
              });
              
              // Extract skater stats
              stats.goals! += Number(playerData.skgoals) || 0;
              stats.assists! += Number(playerData.skassists) || 0;
              stats.plusMinus! += Number(playerData.skplusmin) || 0;
              stats.pim! += Number(playerData.skpim) || 0;
              stats.ppg! += Number(playerData.skppg) || 0;
              stats.shg! += Number(playerData.skshg) || 0;
              stats.gwg! += Number(playerData.skgwg) || 0;
              stats.shots! += Number(playerData.skshots) || 0;
              stats.hits! += Number(playerData.skhits) || 0;
              stats.takeaways! += Number(playerData.sktakeaways) || 0;
              stats.giveaways! += Number(playerData.skgiveaways) || 0;
              stats.blockedShots! += Number(playerData.skbs) || 0;
              
              // Extract pass statistics
              stats.passAttempts! += Number(playerData.skpassattempts) || 0;
              stats.passes! += Number(playerData.skpasses) || 0;
              stats.passPct = Number(playerData.skpasspct) || 0;
              
              // Extract player score, possession, and time on ice
              stats.playerScore! += Number(playerData.score) || 0;
              stats.possession! += Number(playerData.skpossession) || 0;
              stats.toi! += Number(playerData.toiseconds) || 0;
              
              // Extract goalie stats
              stats.savePercentage = Number(playerData.glsavepct) || 0;
              stats.goalsAgainst! += Number(playerData.glga) || 0;
              stats.goalsAgainstAverage = Number(playerData.glgaa) || 0;
              stats.shutouts! += Number(playerData.glsoperiods) || 0;
              
              // Calculate faceoff percentage
              if (playerData.skfow && playerData.skfol) {
                const totalFaceoffs = Number(playerData.skfow) + Number(playerData.skfol);
                stats.faceoffPct = totalFaceoffs > 0 ? (Number(playerData.skfow) / totalFaceoffs) * 100 : 0;
              }
              
              // Use the shooting percentage from EASHL data
              stats.shotPct = Number(playerData.skshotpct) || 0;
              
              // Determine win/loss based on team score vs opponent score
              const playerTeamScore = Number(playerData.score) || 0;
              const opponentScore = Number(playerData.opponentScore) || 0;
              
              if (playerTeamScore > opponentScore) {
                stats.wins! += 1;
              } else if (playerTeamScore < opponentScore) {
                stats.losses! += 1;
              }
            }
          });
        }
      });
    });

    // Calculate total points
    stats.points = stats.goals! + stats.assists!;
    stats.gamesPlayed = playerMatches.length;

    console.log('Calculated stats:', stats);
    return stats;
  }
} 