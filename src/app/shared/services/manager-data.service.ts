import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../store/services/api.service';
import { NgRxApiService } from '../../store/services/ngrx-api.service';
import { ImageUrlService } from './image-url.service';
import { 
  ManagerState, 
  FreeAgent, 
  ManagerClub, 
  RosterPlayer, 
  ContractOfferRequest,
  NotificationState 
} from '../interfaces/manager.interface';

@Injectable({
  providedIn: 'root'
})
export class ManagerDataService {
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private ngrxApiService: NgRxApiService,
    private imageUrlService: ImageUrlService
  ) {}

  /**
   * Load manager data including seasons and clubs
   * @param managerUserId - Manager's user ID
   * @returns Observable of manager state
   */
  loadManagerData(managerUserId: string): Observable<ManagerState> {
    const state: ManagerState = {
      freeAgents: [],
      rosterPlayers: [],
      managerClubs: [],
      allClubs: [],
      selectedClub: null,
      selectedClubId: '',
      selectedSeason: '',
      seasons: [],
      selectedFreeAgents: [],
      searchTerm: '',
      isLoading: true,
      error: null,
      notification: null
    };

    return this.apiService.getSeasons().pipe(
      switchMap(seasons => {
        state.seasons = seasons;
        
        // Auto-select the first season if none is selected
        if (seasons.length > 0 && !state.selectedSeason) {
          state.selectedSeason = seasons[0].name;
        }
        
        return this.loadManagerClubs(state);
      })
    );
  }

  /**
   * Load clubs for the selected season
   */
  loadManagerClubs(state: ManagerState): Observable<ManagerState> {
    if (!state.selectedSeason) {
      state.error = 'Please select a season first.';
      state.isLoading = false;
      return of(state);
    }
    
    return this.apiService.getClubs().pipe(
      switchMap(clubs => {
        state.allClubs = [...clubs];
        
        const currentSeason = state.seasons.find(s => s.name === state.selectedSeason);
        if (!currentSeason) {
          state.managerClubs = [];
          state.error = `Season "${state.selectedSeason}" not found.`;
          state.isLoading = false;
          return of(state);
        }
        
        state.managerClubs = clubs.filter(club => {
          if (!club.seasons || !Array.isArray(club.seasons)) {
            return false;
          }
          
          return club.seasons.some((s: any) => {
            if (typeof s.seasonId === 'object' && s.seasonId._id) {
              return s.seasonId._id === currentSeason._id;
            } else if (typeof s.seasonId === 'string') {
              return s.seasonId === currentSeason._id;
            }
            return false;
          });
        });
        
        // Set the first club as selected if none is currently selected
        if (state.managerClubs.length > 0 && !state.selectedClub) {
          state.selectedClub = state.managerClubs[0];
          state.selectedClubId = state.selectedClub._id;
        }
        
        if (state.managerClubs.length > 0) {
          return this.loadClubData(state);
        } else {
          state.error = `No clubs found for season "${state.selectedSeason}".`;
          state.isLoading = false;
          return of(state);
        }
      })
    );
  }

  /**
   * Load club data including roster and free agents
   */
  loadClubData(state: ManagerState): Observable<ManagerState> {
    if (!state.selectedClub) {
      return of(state);
    }

    const currentSeasonId = state.seasons.find(season => season.name === state.selectedSeason)?._id;
    if (!currentSeasonId) {
      state.error = 'Current season ID not found';
      return of(state);
    }
    
    return new Observable(observer => {
      // Load the club's roster for the specific season
      this.apiService.getClubRoster(state.selectedClub!._id, currentSeasonId).subscribe({
        next: (roster) => {
          state.rosterPlayers = roster || [];
          
          // Load free agents for the current season
          this.apiService.getFreeAgentsForSeason(currentSeasonId).subscribe({
            next: (freeAgents) => {
              state.freeAgents = freeAgents || [];
              state.isLoading = false;
              observer.next(state);
            },
            error: (error) => {
              console.error('Error loading free agents:', error);
              state.error = `Failed to load free agents: ${error.message || 'Unknown error'}`;
              state.isLoading = false;
              observer.next(state);
            }
          });
        },
        error: (error) => {
          console.error('Error loading club data:', error);
          state.error = `Failed to load club data: ${error.message || 'Unknown error'}`;
          state.isLoading = false;
          observer.next(state);
        }
      });
    });
  }

  /**
   * Send contract offers to selected free agents
   */
  sendContractOffers(
    state: ManagerState, 
    managerUserId: string,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ): void {
    if (!state.selectedClub || state.selectedFreeAgents.length === 0) {
      onError('Please select a club and at least one free agent.');
      return;
    }

    if (!managerUserId) {
      onError('Could not identify the manager. Please log in again.');
      return;
    }

    const requests = state.selectedFreeAgents.map(agentId => {
      const agent = state.freeAgents.find(a => a._id === agentId);
      const request: ContractOfferRequest = {
        clubId: state.selectedClub!._id,
        clubName: state.selectedClub!.name,
        clubLogoUrl: state.selectedClub!.logoUrl,
        userId: agentId,
        playerName: agent?.discordUsername || 'Unknown Player',
        seasonId: state.seasons.find(s => s.name === state.selectedSeason)?._id,
        seasonName: state.selectedSeason,
        sentBy: managerUserId
      };
      
      return request;
    });

    // Send each request
    let completed = 0;
    let errors = 0;

    requests.forEach(request => {
      this.apiService.sendContractOffer(request).subscribe({
        next: () => {
          completed++;
          if (completed + errors === requests.length) {
            if (errors === 0) {
              onSuccess(`Successfully sent ${completed} signing request(s)!`);
              state.selectedFreeAgents = [];
            } else {
              onError(`Sent ${completed} requests, but ${errors} failed.`);
            }
          }
        },
        error: (error) => {
          errors++;
          console.error('Error sending offer:', error);
          
          const agent = state.freeAgents.find(a => a._id === request.userId);
          const agentName = agent?.discordUsername || 'Unknown Player';
          
          let errorMessage = '';
          if (error.status === 400) {
            if (error.error?.message?.includes('already has a pending offer from this club')) {
              errorMessage = `${agentName} already has a pending offer from this club.`;
            } else if (error.error?.message?.includes('already signed to a club')) {
              errorMessage = `${agentName} is already signed to a club for this season.`;
            } else if (error.error?.message?.includes('too many pending offers')) {
              errorMessage = `${agentName} already has too many pending offers.`;
            } else {
              errorMessage = `Failed to send offer to ${agentName}: ${error.error?.message || 'Unknown error'}`;
            }
          } else {
            errorMessage = `Failed to send offer to ${agentName}: ${error.message || 'Unknown error'}`;
          }
          
          onError(errorMessage);
          
          if (completed + errors === requests.length) {
            if (errors === 0) {
              onSuccess(`Successfully sent ${completed} signing request(s)!`);
              state.selectedFreeAgents = [];
            } else {
              const successMessage = completed > 0 ? `Successfully sent ${completed} request(s). ` : '';
              const finalErrorMessage = `${errors} request(s) failed. Check notifications for details.`;
              onError(successMessage + finalErrorMessage);
            }
          }
        }
      });
    });
  }

  /**
   * Release a player from the club
   */
  releasePlayer(
    state: ManagerState, 
    playerId: string,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ): void {
    if (!state.selectedClub) {
      onError('No club selected.');
      return;
    }

    const currentSeasonId = state.seasons.find(season => season.name === state.selectedSeason)?._id;
    if (!currentSeasonId) {
      onError('Season not found.');
      return;
    }

    this.apiService.removePlayerFromClub(state.selectedClub._id, playerId, currentSeasonId).subscribe({
      next: () => {
        onSuccess('Player released successfully!');
      },
      error: (error) => {
        console.error('Error releasing player:', error);
        onError('Failed to release player.');
      }
    });
  }

  /**
   * Filter free agents by search term
   */
  getFilteredFreeAgents(freeAgents: FreeAgent[], searchTerm: string): FreeAgent[] {
    return freeAgents.filter(agent =>
      agent.discordUsername?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Toggle free agent selection
   */
  toggleFreeAgentSelection(selectedFreeAgents: string[], agentId: string): string[] {
    const index = selectedFreeAgents.indexOf(agentId);
    if (index > -1) {
      selectedFreeAgents.splice(index, 1);
    } else {
      selectedFreeAgents.push(agentId);
    }
    return selectedFreeAgents;
  }

  /**
   * Get available clubs text for display
   */
  getAvailableClubsText(managerClubs: ManagerClub[]): string {
    if (!managerClubs || managerClubs.length === 0) {
      return 'None';
    }
    return managerClubs.map(c => c.name).join(', ');
  }

  /**
   * Check player offer status (placeholder for future implementation)
   */
  checkPlayerOfferStatus(playerId: string): string {
    // This would ideally check the backend for existing offers
    return 'Unknown';
  }

  /**
   * Test specific endpoint (for debugging)
   */
  testPetosenPalloEndpoint(
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ): void {
    this.apiService.testPetosenPalloRoster().subscribe({
      next: (response) => {
        console.log('✅ Direct endpoint test SUCCESS:', response);
        onSuccess('Direct endpoint test successful!');
      },
      error: (error) => {
        console.error('❌ Direct endpoint test FAILED:', error);
        onError(`Direct endpoint test failed: ${error.message}`);
      }
    });
  }

  /**
   * Show notification
   */
  showNotification(type: 'success' | 'error', message: string): NotificationState {
    return { type, message };
  }

  /**
   * Clean up subscriptions
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
