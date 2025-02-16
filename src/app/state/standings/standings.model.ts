export interface TeamRecord {
    teamId: string;
    name: string;
    teamLogo: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    overtimeLosses: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifferential: number;
    lastTenGames: string;
    streak: string;
    division: string;
}

export interface SeasonStandings {
    seasonId: string;
    seasonName: string;
    teams: TeamRecord[];
}