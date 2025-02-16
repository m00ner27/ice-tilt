export interface FreeAgent {
  playerId: string;
  playerName: string;
  profilePic: string;
  position: string;
  seasonId: string;
  lastClubId?: string;
  teamLogo?: string;
  teamName?: string;
  dateAvailable: string;
  status: 'AVAILABLE' | 'PENDING_SIGNING' | 'SIGNED';
}

export interface FreeAgentsState {
  freeAgents: FreeAgent[];
  loading: boolean;
  error: string | null;
} 