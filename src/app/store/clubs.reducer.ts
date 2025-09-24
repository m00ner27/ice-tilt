import { createReducer, on } from '@ngrx/store';
import { Club } from './models/models/club.interface';
import * as ClubsActions from './clubs.actions';

export interface ClubsState {
  clubs: Club[];
  selectedClub: Club | null;
  clubRosters: { [clubId: string]: any[] };
  globalRosters: { [clubId: string]: any[] };
  loading: boolean;
  error: any;
  uploadLoading: boolean;
  uploadError: any;
}

export const initialState: ClubsState = {
  clubs: [],
  selectedClub: null,
  clubRosters: {},
  globalRosters: {},
  loading: false,
  error: null,
  uploadLoading: false,
  uploadError: null,
};

export const clubsReducer = createReducer(
  initialState,

  // Load Clubs
  on(ClubsActions.loadClubs, (state) => ({ ...state, loading: true, error: null })),
  on(ClubsActions.loadClubsSuccess, (state, { clubs }) => ({ 
    ...state, 
    clubs, 
    loading: false, 
    error: null 
  })),
  on(ClubsActions.loadClubsFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Single Club
  on(ClubsActions.loadClub, (state) => ({ ...state, loading: true, error: null })),
  on(ClubsActions.loadClubSuccess, (state, { club }) => ({ 
    ...state, 
    selectedClub: club, 
    loading: false, 
    error: null 
  })),
  on(ClubsActions.loadClubFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Load Clubs by Season
  on(ClubsActions.loadClubsBySeason, (state) => ({ ...state, loading: true, error: null })),
  on(ClubsActions.loadClubsBySeasonSuccess, (state, { clubs }) => ({ 
    ...state, 
    clubs, 
    loading: false, 
    error: null 
  })),
  on(ClubsActions.loadClubsBySeasonFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Create Club
  on(ClubsActions.createClub, (state) => ({ ...state, loading: true, error: null })),
  on(ClubsActions.createClubSuccess, (state, { club }) => ({ 
    ...state, 
    clubs: [...state.clubs, club], 
    loading: false, 
    error: null 
  })),
  on(ClubsActions.createClubFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Update Club
  on(ClubsActions.updateClub, (state) => ({ ...state, loading: true, error: null })),
  on(ClubsActions.updateClubSuccess, (state, { club }) => ({ 
    ...state, 
    clubs: state.clubs.map(c => c._id === club._id ? club : c),
    selectedClub: state.selectedClub?._id === club._id ? club : state.selectedClub,
    loading: false, 
    error: null 
  })),
  on(ClubsActions.updateClubFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Delete Club
  on(ClubsActions.deleteClub, (state) => ({ ...state, loading: true, error: null })),
  on(ClubsActions.deleteClubSuccess, (state, { clubId }) => ({ 
    ...state, 
    clubs: state.clubs.filter(c => c._id !== clubId),
    selectedClub: state.selectedClub?._id === clubId ? null : state.selectedClub,
    loading: false, 
    error: null 
  })),
  on(ClubsActions.deleteClubFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Club Roster
  on(ClubsActions.loadClubRoster, (state) => ({ ...state, loading: true, error: null })),
  on(ClubsActions.loadClubRosterSuccess, (state, { clubId, roster }) => ({ 
    ...state, 
    clubRosters: { ...state.clubRosters, [clubId]: roster },
    loading: false, 
    error: null 
  })),
  on(ClubsActions.loadClubRosterFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Global Roster
  on(ClubsActions.loadClubGlobalRoster, (state) => ({ ...state, loading: true, error: null })),
  on(ClubsActions.loadClubGlobalRosterSuccess, (state, { clubId, roster }) => ({ 
    ...state, 
    globalRosters: { ...state.globalRosters, [clubId]: roster },
    loading: false, 
    error: null 
  })),
  on(ClubsActions.loadClubGlobalRosterFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Add Player to Club
  on(ClubsActions.addPlayerToClub, (state) => ({ ...state, loading: true, error: null })),
  on(ClubsActions.addPlayerToClubSuccess, (state, { clubId, userId, seasonId }) => ({ 
    ...state, 
    loading: false, 
    error: null 
  })),
  on(ClubsActions.addPlayerToClubFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Remove Player from Club
  on(ClubsActions.removePlayerFromClub, (state) => ({ ...state, loading: true, error: null })),
  on(ClubsActions.removePlayerFromClubSuccess, (state, { clubId, userId, seasonId }) => ({ 
    ...state, 
    loading: false, 
    error: null 
  })),
  on(ClubsActions.removePlayerFromClubFailure, (state, { error }) => ({ 
    ...state, 
    loading: false, 
    error 
  })),

  // Upload Club Logo
  on(ClubsActions.uploadClubLogo, (state) => ({ ...state, uploadLoading: true, uploadError: null })),
  on(ClubsActions.uploadClubLogoSuccess, (state, { logoUrl }) => ({ 
    ...state, 
    uploadLoading: false, 
    uploadError: null 
  })),
  on(ClubsActions.uploadClubLogoFailure, (state, { error }) => ({ 
    ...state, 
    uploadLoading: false, 
    uploadError: error 
  })),

  // Clear Actions
  on(ClubsActions.clearClubs, (state) => ({ ...state, clubs: [], selectedClub: null })),
  on(ClubsActions.clearSelectedClub, (state) => ({ ...state, selectedClub: null })),
  on(ClubsActions.clearClubRoster, (state, { clubId }) => {
    const newClubRosters = { ...state.clubRosters };
    delete newClubRosters[clubId];
    return { ...state, clubRosters: newClubRosters };
  }),
  on(ClubsActions.clearAllRosters, (state) => ({ ...state, clubRosters: {}, globalRosters: {} }))
);
