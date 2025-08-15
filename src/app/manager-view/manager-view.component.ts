import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../store/services/api.service';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

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
export class ManagerViewComponent implements OnInit {
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

  constructor(
    private apiService: ApiService,
    private auth: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
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
  }

  loadManagerData() {
    this.isLoading = true;
    
    // Load seasons first
    return this.apiService.getSeasons().pipe(
      switchMap(seasons => {
        this.seasons = seasons;
        console.log('Loaded seasons:', seasons.map(s => ({ name: s.name, id: s._id })));
        
        // Don't auto-select the first season, let user choose
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
          return of(null);
        }
        
        this.managerClubs = clubs.filter(club => {
          if (!club.seasons || !Array.isArray(club.seasons)) {
            console.log(`Club ${club.name} has no seasons`);
            return false;
          }
          
          const hasSeason = club.seasons.some((s: any) => {
            console.log(`Club ${club.name}: comparing season ${s.seasonId} with selected season ${currentSeason._id}`);
            return s.seasonId === currentSeason._id;
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
          this.error = 'No clubs found for the selected season.';
          return of(null);
        }
      })
    );
  }

  loadClubData() {
    if (!this.selectedClub) return of(null);

    // Load roster players
    return this.apiService.getUsers().pipe(
      switchMap(users => {
        console.log('=== LOAD CLUB DATA DEBUG ===');
        console.log('Selected club:', this.selectedClub?.name);
        console.log('Selected season:', this.selectedSeason);
        console.log('Total users loaded:', users.length);
        
        // Get roster players for the selected club in the selected season
        this.rosterPlayers = users.filter((user: any) => {
          // Check if user is on this club's roster for the current season
          const seasonEntry = user.seasons?.find((s: any) => 
            s.seasonId === this.seasons.find(season => season.name === this.selectedSeason)?._id
          );
          return seasonEntry && seasonEntry.clubId === this.selectedClub?._id;
        });
        console.log('Roster players found:', this.rosterPlayers.length);
        
        // Load free agents for the CURRENT SEASON
        // A user is a free agent for a season if they're not on any club's roster for that season
        this.freeAgents = users.filter((user: any) => {
          // Check if user is already on a club's roster for the current season
          const seasonId = this.seasons.find(season => season.name === this.selectedSeason)?._id;
          const seasonEntry = user.seasons?.find((s: any) => s.seasonId === seasonId);
          
          // User is a free agent if they don't have a season entry or their status is 'Free Agent'
          const isFreeAgent = !seasonEntry || seasonEntry.status === 'Free Agent';
          
          console.log(`User ${user.discordUsername}: seasonEntry=${seasonEntry ? 'Yes' : 'No'}, isFreeAgent=${isFreeAgent}`);
          return isFreeAgent;
        });
        
        console.log('Free agents found for season:', this.freeAgents.length);
        console.log('Free agent usernames:', this.freeAgents.map(u => u.discordUsername));
        console.log('=== END LOAD CLUB DATA DEBUG ===');
        
        this.isLoading = false;
        return of(null);
      })
    );
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
    if (this.selectedClubId) {
      this.selectedClub = this.managerClubs.find(club => club._id === this.selectedClubId) || null;
      this.loadClubData();
    }
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
      authorizationParams: { audience: 'http://localhost:3000' }
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
                if (error.error?.message?.includes('already has a pending offer from this club')) {
                  console.log(`Player ${agent?.discordUsername} already has a pending offer from this club for this season`);
                } else if (error.error?.message?.includes('too many pending offers')) {
                  console.log(`Player ${agent?.discordUsername} already has too many pending offers`);
                } else {
                  console.log(`Bad request error: ${error.error?.message}`);
                }
              }
              
              if (completed + errors === requests.length) {
                this.showNotification('error', `Sent ${completed} requests, but ${errors} failed.`);
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

    this.apiService.removePlayerFromClub(this.selectedClub._id, playerId, this.selectedSeason).subscribe({
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
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }

  showNotification(type: 'success' | 'error', message: string) {
    this.notification = { type, message };
    setTimeout(() => this.notification = null, 5000);
  }
}
