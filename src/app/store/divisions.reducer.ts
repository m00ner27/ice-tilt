import { createReducer, on } from '@ngrx/store';
import { Division } from './divisions.actions';
import * as DivisionsActions from './divisions.actions';

export interface DivisionsState {
  divisions: Division[];
  loading: boolean;
  error: any;
}

export const initialState: DivisionsState = {
  divisions: [],
  loading: false,
  error: null,
};

export const divisionsReducer = createReducer(
  initialState,

  // Load Divisions
  on(DivisionsActions.loadDivisions, (state) => ({ ...state, loading: true, error: null })),
  on(DivisionsActions.loadDivisionsSuccess, (state, { divisions }) => ({ 
    ...state, 
    divisions, 
    loading: false, 
    error: null 
  })),
  on(DivisionsActions.loadDivisionsFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Divisions by Season
  on(DivisionsActions.loadDivisionsBySeason, (state) => ({ ...state, loading: true, error: null })),
  on(DivisionsActions.loadDivisionsBySeasonSuccess, (state, { divisions }) => ({ 
    ...state, 
    divisions, 
    loading: false, 
    error: null 
  })),
  on(DivisionsActions.loadDivisionsBySeasonFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Create Division
  on(DivisionsActions.createDivision, (state) => ({ ...state, loading: true, error: null })),
  on(DivisionsActions.createDivisionSuccess, (state, { division }) => ({ 
    ...state, 
    divisions: [...state.divisions, division], 
    loading: false, 
    error: null 
  })),
  on(DivisionsActions.createDivisionFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Update Division
  on(DivisionsActions.updateDivision, (state) => ({ ...state, loading: true, error: null })),
  on(DivisionsActions.updateDivisionSuccess, (state, { division }) => ({ 
    ...state, 
    divisions: state.divisions.map(d => d._id === division._id ? division : d),
    loading: false, 
    error: null 
  })),
  on(DivisionsActions.updateDivisionFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Delete Division
  on(DivisionsActions.deleteDivision, (state) => ({ ...state, loading: true, error: null })),
  on(DivisionsActions.deleteDivisionSuccess, (state, { divisionId }) => ({ 
    ...state, 
    divisions: state.divisions.filter(d => d._id !== divisionId),
    loading: false, 
    error: null 
  })),
  on(DivisionsActions.deleteDivisionFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Clear Actions
  on(DivisionsActions.clearDivisions, (state) => ({ ...state, divisions: [] }))
);
