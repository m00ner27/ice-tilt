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
  ppg?: number;
  shg?: number;
  gwg?: number;
  takeaways?: number;
  giveaways?: number;
  passes?: number;
  passAttempts?: number;
  passPercentage?: number;
  faceoffsWon?: number;
  faceoffPercentage?: number;
  playerScore?: number;
  penaltyKillCorsiZone?: number;
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
  saves?: number;
  shotsAgainst?: number;
  savePercentage: number;
  goalsAgainstAverage: number;
  shutouts: number;
}

@Component({
  selector: 'app-club-roster-tables',
  standalone: true,
  imports: [CommonModule, PositionPillComponent],
  templateUrl: './club-roster-tables.component.html',
  styleUrls: ['./club-roster-tables.component.css']
})
export class ClubRosterTablesComponent {
  @Input() signedPlayers: Player[] = [];
  @Input() skaterStats: SkaterStats[] = [];
  @Input() goalieStats: GoalieStats[] = [];
  @Input() selectedSeasonId: string | null = null;
}
