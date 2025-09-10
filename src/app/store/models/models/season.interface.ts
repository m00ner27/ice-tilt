export interface Season {
  _id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  divisions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Division {
  _id: string;
  name: string;
  seasonId: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
