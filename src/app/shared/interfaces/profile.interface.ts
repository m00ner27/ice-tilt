export interface ExtendedMatch {
  id: string;
  _id?: string;
  season: string;
  seasonId?: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  isOvertime?: boolean;
  isShootout?: boolean;
  eashlData?: {
    players: any;
    manualEntry?: boolean;
  };
  homeClub?: {
    eashlClubId: string;
  };
  awayClub?: {
    eashlClubId: string;
  };
  playerStats?: any[];
  goalieStats?: any[];
  hasStats?: boolean;
}

export interface GameStats {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  team: string;
  opponent: string;
  teamLogoUrl: string;
  opponentLogoUrl: string;
  result: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots: number;
  hits: number;
  pim: number;
  ppg: number;
  shg: number;
  gwg: number;
  faceoffsWon: number;
  faceoffsLost: number;
  blockedShots: number;
  interceptions: number;
  takeaways: number;
  giveaways: number;
  deflections: number;
  penaltiesDrawn: number;
  shotAttempts: number;
  shotPercentage: number;
  passAttempts: number;
  passes: number;
  timeOnIce: number;
  position: string;
}

export interface CareerSeasonStats {
  seasonName: string;
  clubName: string;
  clubLogo: string;
  seasonId: string;
  stats: PlayerSeasonStats;
}

export interface PlayerSeasonStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  overtimeLosses: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number;
  shots: number;
  hits: number;
  ppg: number;
  shg: number;
  gwg: number;
  faceoffsWon: number;
  faceoffsLost: number;
  blockedShots: number;
  interceptions: number;
  takeaways: number;
  giveaways: number;
  deflections: number;
  penaltiesDrawn: number;
  shotAttempts: number;
  shotPct: number;
  passAttempts: number;
  passesCompleted: number;
  toi: number;
  savePercentage?: number;
  goalsAgainst?: number;
  shutouts?: number;
}

export interface ProfileState {
  player: any | null;
  careerStats: CareerSeasonStats[];
  careerTotals: PlayerSeasonStats;
  gameByGameStats: GameStats[];
  allClubs: any[];
  loading: boolean;
  loadingCareerStats: boolean;
  loadingGameStats: boolean;
  error: string | null;
}
