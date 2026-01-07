import { PlayerStats } from './player-stats.interface';

export interface PlayerProfile {
  name: string;
  position: 'Forward' | 'Defense' | 'Goalie';
  secondaryPositions?: string[];
  handedness?: 'Left' | 'Right';
  location?: string;
  region?: string;
  psnId?: string;
  xboxGamertag?: string;
  bio?: string;
  status: 'Signed' | 'Free Agent' | 'Pending';
  currentClubId?: string | null;
  stats?: PlayerStats;
  number?: string;
  country?: string;
}
