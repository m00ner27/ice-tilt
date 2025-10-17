export interface Transaction {
  _id?: string;
  clubId: string;
  clubName: string;
  clubLogoUrl?: string;
  playerId: string;
  playerName: string;
  transactionType: 'sign' | 'release';
  seasonId: string;
  seasonName: string;
  divisionId?: string;
  divisionName?: string;
  date: Date;
  createdBy?: string; // User who performed the action
} 