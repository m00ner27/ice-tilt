export interface Player {
    id: string;
    name: string;
    position: string;
    teamId: string;
}

export interface SeasonPlayerStats {
    players: Player[];
    seasonId: string;
    total: number;
}

export interface PlayerStats {
    playerId: string;
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
}