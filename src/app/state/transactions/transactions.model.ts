export interface Transaction {
  id: string;
  type: 'SIGNING' | 'RELEASE' | 'PROMOTION';
  playerId: string;
  fromClubId?: string;
  toClubId?: string;
  date: string;
  seasonId: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
} 