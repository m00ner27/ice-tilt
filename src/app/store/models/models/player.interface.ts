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
    clubLogo?: string;
    platform?: 'PS5' | 'Xbox';
} 