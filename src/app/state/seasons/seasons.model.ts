export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  isPlayoffs: boolean;
  playoffRounds?: number;
  teamsPerPlayoffRound?: number;
  regularSeasonGames: number;
  currentRound?: number;
}

export interface SeasonsState {
  seasons: Season[];
  currentSeason: Season | null;
  loading: boolean;
  error: string | null;
} 