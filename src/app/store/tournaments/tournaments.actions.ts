import { createAction, props } from '@ngrx/store';

export interface Tournament {
  _id?: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TournamentBracket {
  _id?: string;
  tournamentId: string;
  name: string;
  logoUrl?: string;
  format?: 'single-elimination' | 'placement-bracket' | 'double-elimination' | 'round-robin';
  manualMatchups?: boolean;
  status: 'setup' | 'active' | 'completed';
  numTeams: number;
  numRounds: number;
  order?: number; // Display order for brackets within a tournament
  rounds: Array<{
    name: string;
    bestOf: number;
    order: number;
  }>;
  seedings: Array<{
    clubId: string;
    seed: number;
  }>;
  series: Array<{
    _id?: string;
    roundId: string;
    roundOrder: number;
    homeClubId?: string;
    awayClubId?: string;
    homeSeed?: number;
    awaySeed?: number;
    status: 'pending' | 'in-progress' | 'completed' | 'bye';
    homeWins: number;
    awayWins: number;
    winnerClubId?: string;
    nextRoundSeriesId?: string;
    games: string[];
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TournamentSeries {
  _id: string;
  roundId: string;
  roundOrder: number;
  homeClubId?: string;
  awayClubId?: string;
  homeSeed?: number;
  awaySeed?: number;
  status: 'pending' | 'in-progress' | 'completed' | 'bye';
  homeWins: number;
  awayWins: number;
  winnerClubId?: string;
  nextRoundSeriesId?: string;
  games: string[];
  homeClub?: any;
  awayClub?: any;
  winnerClub?: any;
  gameDetails?: any[];
}

// Load Tournaments Actions
export const loadTournaments = createAction('[Tournaments] Load Tournaments');
export const loadTournamentsSuccess = createAction(
  '[Tournaments] Load Tournaments Success',
  props<{ tournaments: Tournament[] }>()
);
export const loadTournamentsFailure = createAction(
  '[Tournaments] Load Tournaments Failure',
  props<{ error: any }>()
);

// Load Single Tournament Actions
export const loadTournament = createAction(
  '[Tournaments] Load Tournament',
  props<{ tournamentId: string }>()
);
export const loadTournamentSuccess = createAction(
  '[Tournaments] Load Tournament Success',
  props<{ tournament: Tournament }>()
);
export const loadTournamentFailure = createAction(
  '[Tournaments] Load Tournament Failure',
  props<{ error: any }>()
);

// Load Brackets Actions
export const loadTournamentBrackets = createAction(
  '[Tournaments] Load Brackets',
  props<{ tournamentId?: string; status?: string }>()
);
export const loadTournamentBracketsSuccess = createAction(
  '[Tournaments] Load Brackets Success',
  props<{ brackets: TournamentBracket[] }>()
);
export const loadTournamentBracketsFailure = createAction(
  '[Tournaments] Load Brackets Failure',
  props<{ error: any }>()
);

// Load Single Bracket Actions
export const loadTournamentBracket = createAction(
  '[Tournaments] Load Bracket',
  props<{ bracketId: string }>()
);
export const loadTournamentBracketSuccess = createAction(
  '[Tournaments] Load Bracket Success',
  props<{ bracket: TournamentBracket }>()
);
export const loadTournamentBracketFailure = createAction(
  '[Tournaments] Load Bracket Failure',
  props<{ error: any }>()
);

// Create Bracket Actions
export const createTournamentBracket = createAction(
  '[Tournaments] Create Bracket',
  props<{ bracketData: Partial<TournamentBracket> }>()
);
export const createTournamentBracketSuccess = createAction(
  '[Tournaments] Create Bracket Success',
  props<{ bracket: TournamentBracket }>()
);
export const createTournamentBracketFailure = createAction(
  '[Tournaments] Create Bracket Failure',
  props<{ error: any }>()
);

// Update Bracket Actions
export const updateTournamentBracket = createAction(
  '[Tournaments] Update Bracket',
  props<{ bracketId: string; bracketData: Partial<TournamentBracket> }>()
);
export const updateTournamentBracketSuccess = createAction(
  '[Tournaments] Update Bracket Success',
  props<{ bracket: TournamentBracket }>()
);
export const updateTournamentBracketFailure = createAction(
  '[Tournaments] Update Bracket Failure',
  props<{ error: any }>()
);

// Generate Matchups Actions
export const generateTournamentMatchups = createAction(
  '[Tournaments] Generate Matchups',
  props<{ bracketId: string }>()
);
export const generateTournamentMatchupsSuccess = createAction(
  '[Tournaments] Generate Matchups Success',
  props<{ bracket: TournamentBracket }>()
);
export const generateTournamentMatchupsFailure = createAction(
  '[Tournaments] Generate Matchups Failure',
  props<{ error: any }>()
);

// Load Series Actions
export const loadTournamentSeries = createAction(
  '[Tournaments] Load Series',
  props<{ bracketId: string }>()
);
export const loadTournamentSeriesSuccess = createAction(
  '[Tournaments] Load Series Success',
  props<{ series: TournamentSeries[] }>()
);
export const loadTournamentSeriesFailure = createAction(
  '[Tournaments] Load Series Failure',
  props<{ error: any }>()
);

// Load Single Series Actions
export const loadTournamentSeriesById = createAction(
  '[Tournaments] Load Series By Id',
  props<{ seriesId: string; bracketId: string }>()
);
export const loadTournamentSeriesByIdSuccess = createAction(
  '[Tournaments] Load Series By Id Success',
  props<{ series: TournamentSeries }>()
);
export const loadTournamentSeriesByIdFailure = createAction(
  '[Tournaments] Load Series By Id Failure',
  props<{ error: any }>()
);

// Advance Series Actions
export const advanceTournamentSeries = createAction(
  '[Tournaments] Advance Series',
  props<{ seriesId: string; bracketId: string }>()
);
export const advanceTournamentSeriesSuccess = createAction(
  '[Tournaments] Advance Series Success',
  props<{ bracket: TournamentBracket }>()
);
export const advanceTournamentSeriesFailure = createAction(
  '[Tournaments] Advance Series Failure',
  props<{ error: any }>()
);

// Load Tournament Stats Actions
export const loadTournamentPlayerStats = createAction(
  '[Tournaments] Load Player Stats',
  props<{ bracketId?: string; tournamentId?: string; clubId?: string }>()
);
export const loadTournamentPlayerStatsSuccess = createAction(
  '[Tournaments] Load Player Stats Success',
  props<{ stats: any }>()
);
export const loadTournamentPlayerStatsFailure = createAction(
  '[Tournaments] Load Player Stats Failure',
  props<{ error: any }>()
);

export const loadTournamentGoalieStats = createAction(
  '[Tournaments] Load Goalie Stats',
  props<{ bracketId?: string; tournamentId?: string; clubId?: string }>()
);
export const loadTournamentGoalieStatsSuccess = createAction(
  '[Tournaments] Load Goalie Stats Success',
  props<{ stats: any }>()
);
export const loadTournamentGoalieStatsFailure = createAction(
  '[Tournaments] Load Goalie Stats Failure',
  props<{ error: any }>()
);

// Delete Bracket Actions
export const deleteTournamentBracket = createAction(
  '[Tournaments] Delete Bracket',
  props<{ bracketId: string }>()
);
export const deleteTournamentBracketSuccess = createAction(
  '[Tournaments] Delete Bracket Success',
  props<{ bracketId: string }>()
);
export const deleteTournamentBracketFailure = createAction(
  '[Tournaments] Delete Bracket Failure',
  props<{ error: any }>()
);

// Update Round Matchups Actions
export const updateTournamentRoundMatchups = createAction(
  '[Tournaments] Update Round Matchups',
  props<{ bracketId: string; roundOrder: number; matchups: any[] }>()
);
export const updateTournamentRoundMatchupsSuccess = createAction(
  '[Tournaments] Update Round Matchups Success',
  props<{ bracket: TournamentBracket }>()
);
export const updateTournamentRoundMatchupsFailure = createAction(
  '[Tournaments] Update Round Matchups Failure',
  props<{ error: any }>()
);

// Clear Actions
export const clearTournamentBrackets = createAction('[Tournaments] Clear Brackets');
export const clearCurrentTournamentBracket = createAction('[Tournaments] Clear Current Bracket');

