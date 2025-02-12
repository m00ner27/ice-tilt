export interface TeamRecord {
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    overtimeLosses: number;
    points: number;
    gamesPlayed: number;
    goalsFor: number;
    goalsAgainst: number;
  }
  
  export interface SeasonStandings {
    seasonId: string;
    seasonName: string;
    teams: TeamRecord[];
  }