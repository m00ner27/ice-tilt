export interface PlayerStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number;
  ppg: number;
  gwg: number;
  shg: number;
  deflections?: number;
  hits: number;
  penaltiesDrawn?: number;
  shots: number;
  shotAttempts?: number;
  shotPct?: number;
  blockedShots?: number;
  giveaways: number;
  takeaways: number;
  interceptions?: number;
  faceoffsWon?: number;
  faceoffsLost?: number;
  faceoffPct?: number;
  passAttempts?: number;
  passes?: number;
  passPct?: number;
  playerScore?: number;
  possession?: number;
  pkClearZone?: number;
  toi?: number;
  hatTricks?: number;
  otgPct?: number;

  // Goalie stats (optional, only for goalies)
  saves?: number;
  goalsAgainst?: number;
  gaa?: number;  // Goals Against Average
  savePercentage?: number;
  shutouts?: number;
  wins?: number;
  losses?: number;
  otl?: number;  // Overtime Losses
  goalsAgainstAverage?: number;
  playerId?: number | string;
} 