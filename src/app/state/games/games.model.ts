export interface GameSummary {
  id: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINAL';
  homeScore: number;
  awayScore: number;
  playerStats: {
    playerId: string;
    goals: number;
    assists: number;
    plusMinus: number;
  }[];
  goalieStats: {
    playerId: string;
    saves: number;
    goalsAgainst: number;
    shutout: boolean;
  }[];
} 