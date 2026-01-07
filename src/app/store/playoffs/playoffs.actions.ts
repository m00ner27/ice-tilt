import { createAction, props } from '@ngrx/store';

export interface PlayoffBracket {
  _id?: string;
  seasonId: string;
  divisionId?: string;
  name: string;
  logoUrl?: string;
  status: 'setup' | 'active' | 'completed';
  numTeams: number;
  numRounds: number;
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

export interface PlayoffSeries {
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

// Load Brackets Actions
export const loadPlayoffBrackets = createAction(
  '[Playoffs] Load Brackets',
  props<{ seasonId?: string; divisionId?: string; status?: string }>()
);
export const loadPlayoffBracketsSuccess = createAction(
  '[Playoffs] Load Brackets Success',
  props<{ brackets: PlayoffBracket[] }>()
);
export const loadPlayoffBracketsFailure = createAction(
  '[Playoffs] Load Brackets Failure',
  props<{ error: any }>()
);

// Load Single Bracket Actions
export const loadPlayoffBracket = createAction(
  '[Playoffs] Load Bracket',
  props<{ bracketId: string }>()
);
export const loadPlayoffBracketSuccess = createAction(
  '[Playoffs] Load Bracket Success',
  props<{ bracket: PlayoffBracket }>()
);
export const loadPlayoffBracketFailure = createAction(
  '[Playoffs] Load Bracket Failure',
  props<{ error: any }>()
);

// Create Bracket Actions
export const createPlayoffBracket = createAction(
  '[Playoffs] Create Bracket',
  props<{ bracketData: Partial<PlayoffBracket> }>()
);
export const createPlayoffBracketSuccess = createAction(
  '[Playoffs] Create Bracket Success',
  props<{ bracket: PlayoffBracket }>()
);
export const createPlayoffBracketFailure = createAction(
  '[Playoffs] Create Bracket Failure',
  props<{ error: any }>()
);

// Update Bracket Actions
export const updatePlayoffBracket = createAction(
  '[Playoffs] Update Bracket',
  props<{ bracketId: string; bracketData: Partial<PlayoffBracket> }>()
);
export const updatePlayoffBracketSuccess = createAction(
  '[Playoffs] Update Bracket Success',
  props<{ bracket: PlayoffBracket }>()
);
export const updatePlayoffBracketFailure = createAction(
  '[Playoffs] Update Bracket Failure',
  props<{ error: any }>()
);

// Generate Matchups Actions
export const generatePlayoffMatchups = createAction(
  '[Playoffs] Generate Matchups',
  props<{ bracketId: string }>()
);
export const generatePlayoffMatchupsSuccess = createAction(
  '[Playoffs] Generate Matchups Success',
  props<{ bracket: PlayoffBracket }>()
);
export const generatePlayoffMatchupsFailure = createAction(
  '[Playoffs] Generate Matchups Failure',
  props<{ error: any }>()
);

// Load Series Actions
export const loadPlayoffSeries = createAction(
  '[Playoffs] Load Series',
  props<{ bracketId: string }>()
);
export const loadPlayoffSeriesSuccess = createAction(
  '[Playoffs] Load Series Success',
  props<{ series: PlayoffSeries[] }>()
);
export const loadPlayoffSeriesFailure = createAction(
  '[Playoffs] Load Series Failure',
  props<{ error: any }>()
);

// Load Single Series Actions
export const loadPlayoffSeriesById = createAction(
  '[Playoffs] Load Series By Id',
  props<{ seriesId: string; bracketId: string }>()
);
export const loadPlayoffSeriesByIdSuccess = createAction(
  '[Playoffs] Load Series By Id Success',
  props<{ series: PlayoffSeries }>()
);
export const loadPlayoffSeriesByIdFailure = createAction(
  '[Playoffs] Load Series By Id Failure',
  props<{ error: any }>()
);

// Advance Series Actions
export const advancePlayoffSeries = createAction(
  '[Playoffs] Advance Series',
  props<{ seriesId: string; bracketId: string }>()
);
export const advancePlayoffSeriesSuccess = createAction(
  '[Playoffs] Advance Series Success',
  props<{ bracket: PlayoffBracket }>()
);
export const advancePlayoffSeriesFailure = createAction(
  '[Playoffs] Advance Series Failure',
  props<{ error: any }>()
);

// Load Playoff Stats Actions
export const loadPlayoffPlayerStats = createAction(
  '[Playoffs] Load Player Stats',
  props<{ bracketId?: string; seasonId?: string; clubId?: string }>()
);
export const loadPlayoffPlayerStatsSuccess = createAction(
  '[Playoffs] Load Player Stats Success',
  props<{ stats: any }>()
);
export const loadPlayoffPlayerStatsFailure = createAction(
  '[Playoffs] Load Player Stats Failure',
  props<{ error: any }>()
);

export const loadPlayoffGoalieStats = createAction(
  '[Playoffs] Load Goalie Stats',
  props<{ bracketId?: string; seasonId?: string; clubId?: string }>()
);
export const loadPlayoffGoalieStatsSuccess = createAction(
  '[Playoffs] Load Goalie Stats Success',
  props<{ stats: any }>()
);
export const loadPlayoffGoalieStatsFailure = createAction(
  '[Playoffs] Load Goalie Stats Failure',
  props<{ error: any }>()
);

// Delete Bracket Actions
export const deletePlayoffBracket = createAction(
  '[Playoffs] Delete Bracket',
  props<{ bracketId: string }>()
);
export const deletePlayoffBracketSuccess = createAction(
  '[Playoffs] Delete Bracket Success',
  props<{ bracketId: string }>()
);
export const deletePlayoffBracketFailure = createAction(
  '[Playoffs] Delete Bracket Failure',
  props<{ error: any }>()
);

// Update Round Matchups Actions
export const updateRoundMatchups = createAction(
  '[Playoffs] Update Round Matchups',
  props<{ bracketId: string; roundOrder: number; matchups: any[] }>()
);
export const updateRoundMatchupsSuccess = createAction(
  '[Playoffs] Update Round Matchups Success',
  props<{ bracket: PlayoffBracket }>()
);
export const updateRoundMatchupsFailure = createAction(
  '[Playoffs] Update Round Matchups Failure',
  props<{ error: any }>()
);

// Clear Actions
export const clearPlayoffBrackets = createAction('[Playoffs] Clear Brackets');
export const clearCurrentPlayoffBracket = createAction('[Playoffs] Clear Current Bracket');

