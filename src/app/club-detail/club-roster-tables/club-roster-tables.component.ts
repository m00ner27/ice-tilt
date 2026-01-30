import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PositionPillComponent } from '../../components/position-pill/position-pill.component';
import { Player } from '../../store/models/models/player.interface';

// Keep these stats interfaces as they're specific to this component
interface SkaterStats {
  playerId: number;
  name: string;
  number: number;
  position: string;
  gamesPlayed: number;
  wins?: number;
  losses?: number;
  otLosses?: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots?: number;
  shotPercentage?: number;
  hits?: number;
  blockedShots?: number;
  pim?: number;
  penaltyAssists?: number;
  penaltyPercentage?: number;
  ppg?: number;
  shg?: number;
  gwg?: number;
  takeaways?: number;
  giveaways?: number;
  passes?: number;
  passAttempts?: number;
  passPercentage?: number;
  faceoffsWon?: number;
  faceoffsLost?: number;
  faceoffPercentage?: number;
  interceptions?: number;
  playerScore?: number;
  penaltyKillCorsiZone?: number;
  isSigned?: boolean;
}

interface GoalieStats {
  playerId: number;
  name: string;
  number: number;
  position: string;
  gamesPlayed: number;
  wins?: number;
  losses?: number;
  otl?: number;
  otLosses?: number;
  saves?: number;
  shotsAgainst?: number;
  savePercentage: number;
  goalsAgainstAverage: number;
  shutouts: number;
  isSigned?: boolean;
}

@Component({
  selector: 'app-club-roster-tables',
  standalone: true,
  imports: [CommonModule, PositionPillComponent],
  templateUrl: './club-roster-tables.component.html'
})
export class ClubRosterTablesComponent {
  @Input() signedPlayers: Player[] = [];
  @Input() skaterStats: SkaterStats[] = [];
  @Input() goalieStats: GoalieStats[] = [];
  @Input() selectedSeasonId: string | null = null;
  @Input() rosterLoading: boolean = false;

  getPrimaryUsername(player: Player): string {
    if (player.usernames && Array.isArray(player.usernames) && player.usernames.length > 0) {
      const primary = player.usernames.find(u => u.isPrimary);
      return primary?.username || player.usernames[0]?.username || player.gamertag || 'Unknown';
    }
    return player.gamertag || 'Unknown';
  }

  getPrimaryPlatform(player: Player): string {
    if (player.usernames && Array.isArray(player.usernames) && player.usernames.length > 0) {
      const primary = player.usernames.find(u => u.isPrimary);
      return primary?.platform || player.usernames[0]?.platform || player.platform || 'PS5';
    }
    return player.platform || 'PS5';
  }
}
