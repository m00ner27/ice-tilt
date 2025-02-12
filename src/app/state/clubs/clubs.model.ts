export interface Club {
  id: string;
  name: string;
  shortName?: string;
  location: string;
  founded?: number;
  logo?: string;
}

export interface ClubsResponse {
  clubs: Club[];
  total: number;
} 