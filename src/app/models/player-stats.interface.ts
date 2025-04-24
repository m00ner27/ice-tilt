export interface PlayerStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number;
  ppg: number;
  shg: number;
  gwg: number;
  shots: number;
  shotPct: number;
  hits: number;
  takeaways: number;
  giveaways: number;
  faceoffPct?: number;  // Optional as not all players take faceoffs
  blocked: number;
  
  // Goalie stats (optional, only for goalies)
  saves?: number;
  goalsAgainst?: number;
  gaa?: number;  // Goals Against Average
  savePercentage?: number;
  shutouts?: number;
  wins?: number;
  losses?: number;
  otl?: number;  // Overtime Losses
} 