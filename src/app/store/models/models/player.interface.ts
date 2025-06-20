import { PlayerStats } from './player-stats.interface';

export interface Player {
    id: string;
    name: string;
    position: 'Forward' | 'Defense' | 'Goalie';
    number: string;
    psnId?: string;
    xboxGamertag?: string;
    country?: string;
    handedness?: 'Left' | 'Right';
    currentClubId?: string;
    currentClubName?: string;
    status: 'Signed' | 'Free Agent' | 'Pending';
    lastActive?: string;
    stats: PlayerStats;
    secondaryPositions?: string[];
} 