export interface ScheduleGame {
  id: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  time: string;
  round: number;
  isPlayoff: boolean;
  playoffRound?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';
  gameId?: string; // Reference to the actual game once it's created
}

export interface ScheduleState {
  games: ScheduleGame[];
  loading: boolean;
  error: string | null;
}

export interface GenerateScheduleParams {
  seasonId: string;
  startDate: string;
  regularSeasonGames: number;
  teamsIds: string[];
} 