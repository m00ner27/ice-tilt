import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../store/services/api.service';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { timeout } from 'rxjs/operators';
import { RosterUpdateService } from '../store/services/roster-update.service';
import { Subscription } from 'rxjs';

interface FreeAgent {
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

interface Club {
  _id: string;
  name: string;
  logoUrl?: string;
  seasons?: any[];
  roster?: any[]; // Array of user IDs in the club roster
}

interface RosterPlayer {
  _id: string;
  discordUsername: string;
  playerProfile?: {
    position?: string;
    secondaryPositions?: string[];
  };
  currentClubId?: string;
  currentClubName?: string;
}

@Component({
  selector: 'app-manager-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-view.component.html',
  styleUrls: ['./manager-view.component.css']
})
export class ManagerViewComponent implements OnInit, OnDestroy {
  freeAgents: FreeAgent[] = [];
  rosterPlayers: RosterPlayer[] = [];
  managerClubs: Club[] = [];
  allClubs: Club[] = []; // Store all clubs for testing
  selectedClub: Club | null = null;
  selectedClubId: string = '';
  selectedSeason: string = '';
  seasons: any[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  notification: { type: 'success' | 'error', message: string } | null = null;
  searchTerm: string = '';
  selectedFreeAgents: string[] = [];
  
  managerUserId: string | undefined;
  private rosterUpdateSubscription: Subscription | undefined;

  constructor(
    private apiService: ApiService,
    private auth: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private rosterUpdateService: RosterUpdateService
  ) {}

  ngOnInit(): void {
    this.auth.user$.pipe(
      switchMap(user => {
        if (user?.sub) {
          this.managerUserId = user.sub.split('|')[1];
          return this.loadManagerData();
        }
        return of(null);
      })
    ).subscribe({
      next: () => {
        // Handle completion
      },
      error: (error) => {
        console.error('Error loading manager data:', error);
        this.isLoading = false;
        this.error = 'Failed to load manager data.';
      }
    });
    
    // Subscribe to roster updates to refresh data when needed
    this.rosterUpdateSubscription = this.rosterUpdateService.rosterUpdates$.subscribe(event => {
      console.log('Roster update received in manager view:', event);
      if (event.action === 'sign' && event.clubId) {
        // Refresh the club data if it's the currently selected club
        if (this.selectedClub && this.selectedClub._id === event.clubId) {
          console.log('Refreshing club data due to roster update');
          this.loadClubData();
        }
        // Also refresh the free agents list by reloading club data
        this.loadClubData();
      }
    });
  }

  loadManagerData() {
    this.isLoading = true;
    
    // Load seasons first
    return this.apiService.getSeasons().pipe(
      switchMap(seasons => {
        this.seasons = seasons;
        console.log('Loaded seasons:', seasons.map(s => ({ name: s.name, id: s._id })));
        
        // Auto-select the first season if none is selected
        if (seasons.length > 0 && !this.selectedSeason) {
          this.selectedSeason = seasons[0].name;
          console.log('Auto-selected first season:', this.selectedSeason);
        }
        
        return this.loadManagerClubs();
      })
    );
  }

  loadManagerClubs() {
    console.log('=== loadManagerClubs CALLED ===');
    console.log('Method entry - selectedSeason:', this.selectedSeason);
    
    // Check if we have a selected season
    if (!this.selectedSeason) {
      console.error('No season selected, cannot load clubs');
      this.isLoading = false;
      this.error = 'Please select a season first.';
      return of(null);
    }
    
    // Always reload clubs from the API to ensure fresh data
    return this.apiService.getClubs().pipe(
      switchMap(clubs => {
        console.log('=== loadManagerClubs DEBUG ===');
        console.log('selectedSeason:', this.selectedSeason);
        console.log('selectedSeason type:', typeof this.selectedSeason);
        console.log('Available seasons:', this.seasons);
        console.log('All clubs loaded:', clubs.length);
        console.log('All clubs:', clubs.map(c => ({ name: c.name, seasons: c.seasons })));
        
        // Store all clubs for testing
        this.allClubs = [...clubs];
        
        // Find the current season object
        const currentSeason = this.seasons.find(s => s.name === this.selectedSeason);
        console.log('Current season object:', currentSeason);
        
        if (!currentSeason) {
          console.error('Season not found:', this.selectedSeason);
          this.managerClubs = [];
          this.isLoading = false;
          this.error = `Season "${this.selectedSeason}" not found.`;
          return of(null);
        }
        
        this.managerClubs = clubs.filter(club => {
          if (!club.seasons || !Array.isArray(club.seasons)) {
            console.log(`Club ${club.name} has no seasons`);
            return false;
          }
          
          const hasSeason = club.seasons.some((s: any) => {
            console.log(`Club ${club.name}: comparing season ${s.seasonId} with selected season ${currentSeason._id}`);
            // Handle both object and string seasonId formats
            if (typeof s.seasonId === 'object' && s.seasonId._id) {
              return s.seasonId._id === currentSeason._id;
            } else if (typeof s.seasonId === 'string') {
              return s.seasonId === currentSeason._id;
            }
            return false;
          });
          
          console.log(`Club ${club.name} has season ${this.selectedSeason}:`, hasSeason);
          return hasSeason;
        });
        
        console.log('Filtered clubs for season', this.selectedSeason, ':', this.managerClubs.map(c => c.name));
        console.log('=== END DEBUG ===');
        
        // Manually trigger change detection to ensure UI updates
        this.cdr.detectChanges();
        
        // Reset selected club if it's not in the filtered list
        if (this.selectedClub && !this.managerClubs.find(club => club._id === this.selectedClub?._id)) {
          this.selectedClub = null;
          this.selectedClubId = '';
        }
        
        if (this.managerClubs.length > 0) {
          // Set the first club as selected if none is currently selected
          if (!this.selectedClub) {
            this.selectedClub = this.managerClubs[0];
            this.selectedClubId = this.selectedClub._id;
          }
          return this.loadClubData();
        } else {
          this.isLoading = false;
          this.error = `No clubs found for season "${this.selectedSeason}".`;
          return of(null);
        }
      })
    );
  }

  loadClubData() {
    if (!this.selectedClub) return of(null);

    console.log('=== LOAD CLUB DATA DEBUG ===');
    console.log('Selected club:', this.selectedClub?.name);
    console.log('Selected club ID:', this.selectedClub?._id);
    console.log('Selected season:', this.selectedSeason);
    
    // Get the current season ID
    const currentSeasonId = this.seasons.find(season => season.name === this.selectedSeason)?._id;
    if (!currentSeasonId) {
      console.error('Current season ID not found');
      return of(null);
    }
    
    console.log('Current season ID:', currentSeasonId);
    console.log('About to call getClubRoster with:', {
      clubId: this.selectedClub._id,
      seasonId: currentSeasonId
    });
    
    // Load the club's roster for the specific season using the new API
    // Simplified RxJS chain to prevent hanging
    this.apiService.getClubRoster(this.selectedClub._id, currentSeasonId).subscribe({
      next: (roster) => {
        console.log('=== ROSTER LOADED FROM API ===');
        console.log('Raw roster response:', roster);
        console.log('Roster type:', typeof roster);
        console.log('Roster length:', roster?.length || 0);
        console.log('Roster players:', roster?.map((p: any) => ({
          id: p._id,
          username: p.discordUsername,
          position: p.playerProfile?.position
        })) || []);
        
        // Set the roster players
        this.rosterPlayers = roster || [];
        console.log('Updated this.rosterPlayers:', this.rosterPlayers);
        
        // Load free agents for the current season
        console.log('About to load free agents for season:', currentSeasonId);
        this.apiService.getFreeAgentsForSeason(currentSeasonId).subscribe({
          next: (freeAgents) => {
            console.log('=== FREE AGENTS LOADED ===');
            console.log('Free agents response:', freeAgents);
            console.log('Free agents length:', freeAgents?.length || 0);
            console.log('Free agent usernames:', freeAgents?.map((u: any) => u.discordUsername) || []);
            
            // Set the free agents
            this.freeAgents = freeAgents || [];
            
            console.log('=== END LOAD CLUB DATA DEBUG ===');
            console.log('Final rosterPlayers count:', this.rosterPlayers.length);
            console.log('Final freeAgents count:', this.freeAgents.length);
            this.isLoading = false;
          },
          error: (error) => {
            console.error('=== ERROR LOADING FREE AGENTS ===');
            console.error('Error:', error);
            this.isLoading = false;
            this.error = `Failed to load free agents: ${error.message || 'Unknown error'}`;
          }
        });
      },
      error: (error) => {
        console.error('=== ERROR IN LOAD CLUB DATA ===');
        console.error('Error loading club data:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error response:', error.error);
        
        this.isLoading = false;
        this.error = `Failed to load club data: ${error.message || 'Unknown error'}`;
      }
    });
    
    return of(null); // Return immediately since we're using subscribe
  }

  onSeasonChange() {
    console.log('=== SEASON CHANGE DEBUG ===');
    console.log('Previous season:', this.selectedClub ? this.selectedClub.name : 'None');
    console.log('New season selected:', this.selectedSeason);
    console.log('Current managerClubs before change:', this.managerClubs.map(c => c.name));
    
    this.selectedClub = null;
    this.selectedClubId = '';
    
    console.log('About to call loadManagerClubs...');
    // Force a reload of the clubs for the new season
    this.loadManagerClubs().subscribe({
      next: () => {
        console.log('Season change completed successfully');
      },
      error: (error) => {
        console.error('Error during season change:', error);
      }
    });
  }

  setSeason(seasonName: string) {
    console.log('Setting season to:', seasonName);
    this.selectedSeason = seasonName;
    this.selectedClub = null;
    this.selectedClubId = '';
    this.loadManagerClubs();
  }

  onClubChange() {
    console.log('=== ON CLUB CHANGE DEBUG ===');
    console.log('selectedClubId:', this.selectedClubId);
    console.log('managerClubs:', this.managerClubs.map(c => ({ id: c._id, name: c.name })));
    
    if (this.selectedClubId) {
      this.selectedClub = this.managerClubs.find(club => club._id === this.selectedClubId) || null;
      console.log('Selected club:', this.selectedClub);
      
      if (this.selectedClub) {
        console.log('About to load club data for:', this.selectedClub.name);
        this.loadClubData();
      } else {
        console.log('Club not found in managerClubs');
      }
    } else {
      console.log('No club ID selected');
      this.selectedClub = null;
    }
    console.log('=== END ON CLUB CHANGE DEBUG ===');
  }

  refreshData() {
    console.log('Refresh data called');
    this.isLoading = true;
    this.loadManagerData().subscribe({
      next: () => {
        console.log('Refresh data completed successfully');
      },
      error: (error) => {
        console.error('Error during refresh:', error);
        this.isLoading = false;
      }
    });
  }
  
  refreshFreeAgents() {
    if (this.selectedClub && this.selectedClub._id) {
      // Get the current season ID
      const currentSeasonId = this.seasons.find(season => season.name === this.selectedSeason)?._id;
      if (currentSeasonId) {
        this.apiService.getFreeAgentsForSeason(currentSeasonId).subscribe({
          next: (freeAgents) => {
            this.freeAgents = freeAgents || [];
            console.log('Free agents list refreshed:', this.freeAgents.length);
          },
          error: (error) => {
            console.error('Error refreshing free agents:', error);
          }
        });
      }
    }
  }

  getAvailableClubsText(): string {
    if (!this.managerClubs || this.managerClubs.length === 0) {
      return 'None';
    }
    return this.managerClubs.map(c => c.name).join(', ');
  }

  checkPlayerOfferStatus(playerId: string): string {
    // This would ideally check the backend for existing offers
    // For now, we'll just show a generic message
    return 'Unknown';
  }

  testSeasonFiltering() {
    console.log('=== TESTING SEASON FILTERING ===');
    console.log('Current selectedSeason:', this.selectedSeason);
    console.log('Available seasons:', this.seasons);
    console.log('All clubs available:', this.allClubs.map(c => c.name));
    
    // Test filtering for each season
    this.seasons.forEach(season => {
      console.log(`\nTesting season: ${season.name}`);
      const filteredClubs = this.allClubs?.filter(club => 
        club.seasons?.some((s: any) => s.seasonId === season._id)
      ) || [];
      console.log(`Clubs for ${season.name}:`, filteredClubs.map(c => c.name));
    });
  }

  getFilteredFreeAgents(): FreeAgent[] {
    return this.freeAgents.filter(agent =>
      agent.discordUsername?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  toggleFreeAgentSelection(agentId: string) {
    const index = this.selectedFreeAgents.indexOf(agentId);
    if (index > -1) {
      this.selectedFreeAgents.splice(index, 1);
    } else {
      this.selectedFreeAgents.push(agentId);
    }
  }

  sendSigningRequests() {
    if (!this.selectedClub || this.selectedFreeAgents.length === 0) {
      this.showNotification('error', 'Please select a club and at least one free agent.');
      return;
    }

    if (!this.managerUserId) {
      this.showNotification('error', 'Could not identify the manager. Please log in again.');
      return;
    }

    // Get the MongoDB user ID for the manager
    this.auth.getAccessTokenSilently({
      authorizationParams: { audience: environment.apiAudience }
    }).pipe(
      switchMap(token => 
        this.http.post(
          `${environment.apiUrl}/api/users/auth0-sync`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ),
      switchMap((dbUser: any) => {
        const managerMongoId = dbUser._id;
        
        const requests = this.selectedFreeAgents.map(agentId => {
          const agent = this.freeAgents.find(a => a._id === agentId);
          const request = {
            clubId: this.selectedClub!._id,
            clubName: this.selectedClub!.name,
            clubLogoUrl: this.selectedClub!.logoUrl,
            userId: agentId,
            playerName: agent?.discordUsername || 'Unknown Player',
            seasonId: this.seasons.find(s => s.name === this.selectedSeason)?._id,
            seasonName: this.selectedSeason,
            sentBy: managerMongoId
          };
          
          console.log('Sending signing request:', request);
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
                  this.showNotification('success', `Successfully sent ${completed} signing request(s)!`);
                  this.selectedFreeAgents = [];
                  this.loadClubData(); // Refresh data
                } else {
                  this.showNotification('error', `Sent ${completed} requests, but ${errors} failed.`);
                }
              }
            },
            error: (error) => {
              errors++;
              console.error('Error sending offer:', error);
              
              // Check for specific error types and show appropriate messages
              if (error.status === 400) {
                const agent = this.freeAgents.find(a => a._id === request.userId);
                const agentName = agent?.discordUsername || 'Unknown Player';
                
                if (error.error?.message?.includes('already has a pending offer from this club')) {
                  console.log(`Player ${agentName} already has a pending offer from this club for this season`);
                  this.showNotification('error', `${agentName} already has a pending offer from this club.`);
                } else if (error.error?.message?.includes('already signed to a club')) {
                  console.log(`Player ${agentName} is already signed to a club for this season`);
                  this.showNotification('error', `${agentName} is already signed to a club for this season.`);
                } else if (error.error?.message?.includes('too many pending offers')) {
                  console.log(`Player ${agentName} already has too many pending offers`);
                  this.showNotification('error', `${agentName} already has too many pending offers.`);
                } else {
                  console.log(`Bad request error: ${error.error?.message}`);
                  this.showNotification('error', `Failed to send offer to ${agentName}: ${error.error?.message || 'Unknown error'}`);
                }
              } else {
                const agent = this.freeAgents.find(a => a._id === request.userId);
                const agentName = agent?.discordUsername || 'Unknown Player';
                this.showNotification('error', `Failed to send offer to ${agentName}: ${error.message || 'Unknown error'}`);
              }
              
              if (completed + errors === requests.length) {
                if (errors === 0) {
                  this.showNotification('success', `Successfully sent ${completed} signing request(s)!`);
                  // Clear selected free agents on success
                  this.selectedFreeAgents = [];
                } else {
                  const successMessage = completed > 0 ? `Successfully sent ${completed} request(s). ` : '';
                  const errorMessage = `${errors} request(s) failed. Check notifications for details.`;
                  this.showNotification('error', successMessage + errorMessage);
                }
                
                // Refresh the free agents list to show current state
                this.refreshFreeAgents();
              }
            }
          });
        });

        return of(null);
      })
    ).subscribe({
      error: (error) => {
        console.error('Error getting manager ID:', error);
        this.showNotification('error', 'Failed to identify manager. Please try again.');
      }
    });
  }

  releasePlayer(playerId: string) {
    if (!this.selectedClub) {
      this.showNotification('error', 'No club selected.');
      return;
    }

    // Get the current season ID
    const currentSeasonId = this.seasons.find(season => season.name === this.selectedSeason)?._id;
    if (!currentSeasonId) {
      this.showNotification('error', 'Season not found.');
      return;
    }

    this.apiService.removePlayerFromClub(this.selectedClub._id, playerId, currentSeasonId).subscribe({
      next: () => {
        this.showNotification('success', 'Player released successfully!');
        // Refresh the club data to show updated roster
        this.loadClubData();
      },
      error: (error) => {
        console.error('Error releasing player:', error);
        this.showNotification('error', 'Failed to release player.');
      }
    });
  }

  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/square-default.png';
    }
    
    // If it's already a full URL, return as is
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // If it's a relative path starting with /uploads, prepend the API URL
    if (logoUrl.startsWith('/uploads/')) {
      return `${environment.apiUrl}${logoUrl}`;
    }
    
    // If it's a filename that looks like an upload (has timestamp pattern), add /uploads/ prefix
    if (logoUrl.match(/^\d{13}-\d+-.+\.(png|jpg|jpeg|gif)$/)) {
      return `${environment.apiUrl}/uploads/${logoUrl}`;
    }
    
    // If it starts with 'uploads/' (no leading slash), add the API URL
    if (logoUrl.startsWith('uploads/')) {
      return `${environment.apiUrl}/${logoUrl}`;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }

  // Test method to directly test the Petosen Pallo roster endpoint
  testPetosenPalloEndpoint() {
    console.log('=== TESTING PETOSEN PALLO ENDPOINT DIRECTLY ===');
    
    const clubId = '68768d41ab18f6cd40f8d8c5';
    const seasonId = '687649d7ab18f6cd40f8d83d';
    
    console.log('Testing with:');
    console.log('  Club ID:', clubId);
    console.log('  Season ID:', seasonId);
    
    // Test the endpoint directly
    this.apiService.testPetosenPalloRoster().subscribe({
      next: (response) => {
        console.log('✅ Direct endpoint test SUCCESS:', response);
        this.showNotification('success', 'Direct endpoint test successful!');
      },
      error: (error) => {
        console.error('❌ Direct endpoint test FAILED:', error);
        this.showNotification('error', `Direct endpoint test failed: ${error.message}`);
      }
    });
  }

  showNotification(type: 'success' | 'error', message: string) {
    this.notification = { type, message };
    setTimeout(() => this.notification = null, 5000);
  }
  
  ngOnDestroy(): void {
    if (this.rosterUpdateSubscription) {
      this.rosterUpdateSubscription.unsubscribe();
    }
  }
}
