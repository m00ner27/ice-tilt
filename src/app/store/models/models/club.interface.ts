import { Player } from './player.interface';

export interface ClubStats {
    wins: number;
    losses: number;
    otLosses: number;
    points: number;
    gamesPlayed: number;
}

export interface CalculatedClubStats {
    wins: number;
    losses: number;
    otLosses: number;
    points: number;
    gamesPlayed: number;
    goalsFor: number;
    goalsAgainst: number;
    winPercentage: number;
    goalDifferential: number;
    streakCount: number;
    streakType: 'W' | 'L' | 'OTL' | '-';
    lastTen: Array<'W' | 'L' | 'OTL'>;
}

export interface Club {
    // Current fields (maintaining compatibility)
    clubName: string;
    image: string;
    manager: string;
    colour: string;
    roster: Player[];
    
    // Make stats required and use the CalculatedClubStats interface
    stats: CalculatedClubStats;
    
    // Other optional fields
    id?: string;
    managerId?: string;
    division?: string;
    isActive?: boolean;
    _id: string;
    name: string;
    eashlClubId?: string;
    logoUrl?: string;
    
    // Season-specific data
    seasons?: Array<{
        seasonId: string | { _id: string; name: string };
        roster?: string[];
        [key: string]: any;
    }>;
} 