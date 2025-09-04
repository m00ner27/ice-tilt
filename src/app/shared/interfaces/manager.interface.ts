export interface FreeAgent {
  _id: string;
  discordUsername: string;
  playerProfile?: {
    position?: string;
    secondaryPositions?: string[];
    stats?: any;
  };
  currentClubId?: string;
  currentClubName?: string;
}

export interface ManagerClub {
  _id: string;
  name: string;
  logoUrl?: string;
  seasons?: any[];
  roster?: any[];
}

export interface RosterPlayer {
  _id: string;
  discordUsername: string;
  playerProfile?: {
    position?: string;
    secondaryPositions?: string[];
  };
  currentClubId?: string;
  currentClubName?: string;
}

export interface ContractOfferRequest {
  clubId: string;
  clubName: string;
  clubLogoUrl?: string;
  userId: string;
  playerName: string;
  seasonId?: string;
  seasonName?: string;
  sentBy: string;
}

export interface ManagerState {
  freeAgents: FreeAgent[];
  rosterPlayers: RosterPlayer[];
  managerClubs: ManagerClub[];
  allClubs: ManagerClub[];
  selectedClub: ManagerClub | null;
  selectedClubId: string;
  selectedSeason: string;
  seasons: any[];
  selectedFreeAgents: string[];
  searchTerm: string;
  isLoading: boolean;
  error: string | null;
  notification: NotificationState | null;
}

export interface NotificationState {
  type: 'success' | 'error';
  message: string;
}
