import { Injectable } from '@angular/core';
import { PlayerSeasonStats, GameStats } from '../interfaces/profile.interface';

@Injectable({
  providedIn: 'root'
})
export class StatsCalculationService {

  /**
   * Calculate shot percentage from goals and shots
   * @param goals - Number of goals
   * @param shots - Number of shots
   * @returns Shot percentage as a number
   */
  calculateShotPercentage(goals: number, shots: number): number {
    if (shots === 0) return 0;
    return parseFloat(((goals / shots) * 100).toFixed(1));
  }

  /**
   * Calculate faceoff percentage from faceoffs won and lost
   * @param faceoffsWon - Number of faceoffs won
   * @param faceoffsLost - Number of faceoffs lost
   * @returns Faceoff percentage as a number
   */
  calculateFaceoffPercentage(faceoffsWon: number, faceoffsLost: number): number {
    const total = faceoffsWon + faceoffsLost;
    if (total === 0) return 0;
    return parseFloat(((faceoffsWon / total) * 100).toFixed(1));
  }

  /**
   * Format time on ice from seconds to MM:SS format
   * @param seconds - Time in seconds
   * @returns Formatted time string
   */
  formatTimeOnIce(seconds: number): string {
    if (!seconds || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get game result (W/L/T) from team and opponent scores
   * @param teamScore - Team's score
   * @param opponentScore - Opponent's score
   * @returns Game result string
   */
  getGameResult(teamScore: number, opponentScore: number): string {
    if (teamScore > opponentScore) {
      return 'W';
    } else if (teamScore < opponentScore) {
      return 'L';
    } else {
      return 'T';
    }
  }

  /**
   * Calculate totals from an array of player stats
   * @param statsArray - Array of player stats objects
   * @returns Aggregated totals
   */
  calculatePlayerStatsTotals(statsArray: any[]): PlayerSeasonStats {
    return statsArray.reduce((acc: PlayerSeasonStats, stats: any) => {
      acc.gamesPlayed += stats.gamesPlayed || 0;
      acc.wins += stats.wins || 0;
      acc.losses += stats.losses || 0;
      acc.goals += stats.goals || 0;
      acc.assists += stats.assists || 0;
      acc.points += stats.points || 0;
      acc.plusMinus += stats.plusMinus || 0;
      acc.pim += stats.pim || 0;
      acc.shots += stats.shots || 0;
      acc.hits += stats.hits || 0;
      acc.ppg += stats.ppg || 0;
      acc.shg += stats.shg || 0;
      acc.gwg += stats.gwg || 0;
      acc.faceoffsWon += stats.faceoffsWon || 0;
      acc.faceoffsLost += stats.faceoffsLost || 0;
      acc.blockedShots += stats.blockedShots || 0;
      acc.interceptions += stats.interceptions || 0;
      acc.takeaways += stats.takeaways || 0;
      acc.giveaways += stats.giveaways || 0;
      acc.deflections += stats.deflections || 0;
      acc.penaltiesDrawn += stats.penaltiesDrawn || 0;
      acc.shotAttempts += stats.shotAttempts || 0;
      acc.passAttempts += stats.passAttempts || 0;
      acc.toi += stats.toi || 0;
      acc.savePercentage = (acc.savePercentage || 0) + (stats.savePercentage || 0);
      acc.goalsAgainst = (acc.goalsAgainst || 0) + (stats.goalsAgainst || 0);
      acc.shutouts = (acc.shutouts || 0) + (stats.shutouts || 0);
      return acc;
    }, this.getEmptyPlayerStats());
  }

  /**
   * Get empty player stats object with all values initialized to 0
   * @returns Empty PlayerSeasonStats object
   */
  getEmptyPlayerStats(): PlayerSeasonStats {
    return {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      goals: 0,
      assists: 0,
      points: 0,
      plusMinus: 0,
      pim: 0,
      shots: 0,
      hits: 0,
      ppg: 0,
      shg: 0,
      gwg: 0,
      faceoffsWon: 0,
      faceoffsLost: 0,
      blockedShots: 0,
      interceptions: 0,
      takeaways: 0,
      giveaways: 0,
      deflections: 0,
      penaltiesDrawn: 0,
      shotAttempts: 0,
      shotPct: 0,
      passAttempts: 0,
      passesCompleted: 0,
      toi: 0,
      savePercentage: 0,
      goalsAgainst: 0,
      shutouts: 0
    };
  }

  /**
   * Sort seasons by date (newest first)
   * @param seasons - Array of season objects
   * @returns Sorted array of seasons
   */
  sortSeasonsByDate(seasons: any[]): any[] {
    return seasons.sort((a, b) => {
      return b.seasonName.localeCompare(a.seasonName);
    });
  }

  /**
   * Format game date to a readable format
   * @param dateString - Date string
   * @returns Formatted date string
   */
  formatGameDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    });
  }
}
