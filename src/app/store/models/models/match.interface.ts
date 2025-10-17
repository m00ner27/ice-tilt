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

export interface Game {
  id: string;
  _id?: string; // MongoDB ID for compatibility
  season: string;
  seasonId?: string; // Alternative season reference
  date: string;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  homeTeamId?: string; // Alternative team reference
  awayTeamId?: string; // Alternative team reference
  status: string;
  isOvertime?: boolean;
  isShootout?: boolean;
  playerStats: PlayerMatchStats[];
  goalieStats?: PlayerMatchStats[];
  hasStats?: boolean; // Flag to indicate if stats are available
}

export interface TeamInfo {
  name: string;
  logo: string;
} 