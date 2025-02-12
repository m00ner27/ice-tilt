import { createReducer, on } from '@ngrx/store';
import { ScheduleState } from './schedule.model';
import * as ScheduleActions from './schedule.actions';

export const initialState: ScheduleState = {
  games: [],
  loading: false,
  error: null
};

export const scheduleReducer = createReducer(
  initialState,
  
  // Load Schedule
  on(ScheduleActions.loadSchedule, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ScheduleActions.loadScheduleSuccess, (state, { games }) => ({
    ...state,
    games,
    loading: false
  })),
  
  on(ScheduleActions.loadScheduleFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  // Generate Schedule
  on(ScheduleActions.generateSchedule, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ScheduleActions.generateScheduleSuccess, (state, { games }) => ({
    ...state,
    games: [...state.games, ...games],
    loading: false
  })),
  
  on(ScheduleActions.generateScheduleFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  // Update Game
  on(ScheduleActions.updateScheduledGameSuccess, (state, { game }) => ({
    ...state,
    games: state.games.map(g => g.id === game.id ? game : g)
  })),
  
  // Generate Playoff Schedule
  on(ScheduleActions.generatePlayoffSchedule, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ScheduleActions.generatePlayoffScheduleSuccess, (state, { games }) => ({
    ...state,
    games: [...state.games, ...games],
    loading: false
  })),
  
  on(ScheduleActions.generatePlayoffScheduleFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  }))
); 