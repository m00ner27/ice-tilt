export type Division = 'All Divisions' | 'Elite' | 'Sweat';

export interface PlayerStats {
  playerId: string;
  seasonId: string;
  playerName: string;
  profilePic: string;
  teamLogo: string;
  teamId: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  penaltyMinutes: number;
  gameWinningGoals: number;
  shotsTaken: number;
  timeOnIce: number; // in minutes
  hits: number;
  powerPlayGoals: number;
  shortHandedGoals: number;
  deviationFromGoal: number;
  drawPercentage: number;
  shotsAgainst: number;
  division: Division;
}

export interface GoalieStats {
  playerId: string;
  seasonId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  overtimeLosses: number;
  goalsAgainst: number;
  goalsAgainstAverage: number;
  savePercentage: number;
  shutouts: number;
  timeOnIce: number; // in minutes
}

export interface StatsState {
  playerStats: PlayerStats[];
  goalieStats: GoalieStats[];
  loading: boolean;
  error: string | null;
} 