import { PlayerStats } from './player-stats.interface';

export interface Player {
    id: string;
    position: 'C' | 'LW' | 'RW' | 'LD' | 'RD' | 'G';
    number: string;
    psnId?: string;
    xboxGamertag?: string;
    country?: string;
    handedness?: 'Left' | 'Right';
    currentClubId?: string;
    currentClubName?: string;
    status: 'Free Agent' | 'Signed' | 'Pending';
    lastActive?: string;
    stats: PlayerStats;
    secondaryPositions?: string[];
    discordUsername?: string;
    discordId?: string;
    gamertag?: string;
    usernames?: { username: string; platform: 'PS5' | 'Xbox'; isPrimary: boolean; addedAt: Date }[];
    clubLogo?: string;
    platform?: 'PS5' | 'Xbox';
    
    // Additional fields used in various components
    name?: string;
    team?: string;
    saves?: number;
    shotsAgainst?: number;
    goalsAgainst?: number;
    shutout?: boolean;
    goals?: number;
    assists?: number;
    shots?: number;
    hits?: number;
    takeaways?: number;
    giveaways?: number;
    plusMinus?: number;
    timeOnIce?: number;
    playerProfile?: any; // For admin panel usage
} 