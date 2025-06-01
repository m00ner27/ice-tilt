export interface PlayerMatchStats {
  playerId: number | string;
  name?: string;
  team: string;
  teamId?: string;
  number?: number;
  position: string;
  goals?: number;
  assists?: number;
  plusMinus?: number;
  shots?: number;
  timeOnIce?: string;
  saves?: number;
  shotsAgainst?: number;
  goalsAgainst?: number;
  shutout?: number;
  savePercentage?: number;
}

export interface TeamScore {
  id: string;
  name: string;
  score: number;
}

export interface Match {
  id: string;
  season: string;
  date: string;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  status: string;
  isOvertime?: boolean;
  isShootout?: boolean;
  playerStats: PlayerMatchStats[];
  goalieStats?: PlayerMatchStats[];
}

export interface TeamInfo {
  name: string;
  logo: string;
} 