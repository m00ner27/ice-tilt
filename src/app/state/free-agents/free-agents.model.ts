export interface FreeAgent {
  playerId: string;
  seasonId: string;
  lastClubId?: string;
  dateAvailable: string;
  status: 'AVAILABLE' | 'PENDING_SIGNING' | 'SIGNED';
}

export interface FreeAgentsState {
  freeAgents: FreeAgent[];
  loading: boolean;
  error: string | null;
} 