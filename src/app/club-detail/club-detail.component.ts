import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatchService, Match, PlayerMatchStats } from '../store/services/match.service';
import { ApiService } from '../store/services/api.service';
import { RosterUpdateService } from '../store/services/roster-update.service';
import { forkJoin } from 'rxjs';
import { MatchHistoryComponent } from './match-history/match-history.component';
import { ClubHeaderComponent } from './club-header/club-header.component';
import { ClubStatsGridComponent } from './club-stats-grid/club-stats-grid.component';
import { ClubRosterTablesComponent } from './club-roster-tables/club-roster-tables.component';
import { ClubStatLegendComponent } from './club-stat-legend/club-stat-legend.component';
import { Club, ClubStats } from '../store/models/models/club.interface';
import { Player } from '../store/models/models/player.interface';
import { PlayerStats } from '../store/models/models/player-stats.interface';
import { environment } from '../../environments/environment';
import { Subscription } from 'rxjs';

// Updated interface to match backend Club model
interface BackendClub {
  _id: string;
  name: string;
  logoUrl?: string;
  manager: string;
  primaryColour?: string;
  seasons?: any[];
  roster?: any[];
  eashlClubId?: string; // Added eashlClubId
}

// Season interface for the selector
interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
}

// Division interface
interface Division {
  _id: string;
  name: string;
  seasonId: string;
}

// Keep these stats interfaces as they're specific to this component
interface SkaterStats {
  playerId: number;
  name: string;
  number: number;
  position: string;
  gamesPlayed: number;
  wins?: number;
  losses?: number;
  otLosses?: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots?: number;
  shotPercentage?: number;
  hits?: number;
  blockedShots?: number;
  pim?: number;
  ppg?: number;
  shg?: number;
  gwg?: number;
  takeaways?: number;
  giveaways?: number;
  passes?: number;
  passAttempts?: number;
  passPercentage?: number;
  faceoffsWon?: number;
  faceoffPercentage?: number;
  playerScore?: number;
  penaltyKillCorsiZone?: number;
}

interface GoalieStats {
  playerId: number;
  name: string;
  number: number;
  position: string;
  gamesPlayed: number;
  wins?: number;
  losses?: number;
  otl?: number;
  saves?: number;
  shotsAgainst?: number;
  savePercentage: number;
  goalsAgainstAverage: number;
  shutouts: number;
}

// Update the stats interface to include more detailed statistics
interface CalculatedClubStats {
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  winPercentage: number;
  goalDifferential: number;
  streakCount: number;
  streakType: 'W' | 'L' | 'OTL' | '-';
  lastTen: Array<'W' | 'L' | 'OTL'>;
}

// Example mock player data structure
interface PlayerProfile {
    id: string;
    name: string;
    position: 'Forward' | 'Defense' | 'Goalie';
    number: string;
    psnId?: string;
    xboxGamertag?: string;
    country: string;
    handedness: 'Left' | 'Right';
    currentClubId?: string;
    currentClubName?: string;
    status: 'Signed' | 'Free Agent' | 'Pending';
    stats: PlayerStats;
    requestHistory: SigningRequest[];
}

interface SigningRequest {
    id: string;
    fromClubId: string;
    fromClubName: string;
    toPlayerId: string;
    status: 'Pending' | 'Accepted' | 'Rejected';
    timestamp: Date;
    message?: string;
}

// Example mock notification structure
interface Notification {
    id: string;
    type: 'SigningRequest' | 'RequestAccepted' | 'RequestRejected';
    fromId: string;
    toId: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

// Default stats for players with no recorded games
const DEFAULT_SKATER_STATS: SkaterStats = {
  playerId: 0,
  name: '',
  number: 0,
  position: '',
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  otLosses: 0,
  goals: 0,
  assists: 0,
  points: 0,
  plusMinus: 0,
  shots: 0,
  shotPercentage: 0,
  hits: 0,
  blockedShots: 0,
  pim: 0,
  ppg: 0,
  shg: 0,
  gwg: 0,
  takeaways: 0,
  giveaways: 0,
  passes: 0,
  passAttempts: 0,
  passPercentage: 0,
  faceoffsWon: 0,
  faceoffPercentage: 0,
  playerScore: 0,
  penaltyKillCorsiZone: 0
};

const DEFAULT_GOALIE_STATS: GoalieStats = {
  playerId: 0,
  name: '',
  number: 0,
  position: 'G',
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  otl: 0,
  saves: 0,
  shotsAgainst: 0,
  savePercentage: 0,
  goalsAgainstAverage: 0,
  shutouts: 0
};

@Component({
  selector: 'app-club-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatchHistoryComponent, ClubHeaderComponent, ClubStatsGridComponent, ClubRosterTablesComponent, ClubStatLegendComponent],
  templateUrl: './club-detail.component.html',
  styleUrls: ['./club-detail.component.css']
})
export class ClubDetailComponent implements OnInit, OnDestroy {
  club: Club | undefined;
  backendClub: BackendClub | undefined;
  matches: Match[] = [];
  skaterStats: SkaterStats[] = [];
  goalieStats: GoalieStats[] = [];
  loading: boolean = false;
  error: string | null = null;
  allClubs: BackendClub[] = [];
  private rosterUpdateSubscription: Subscription | undefined;
  
  // Multi-season support
  seasons: Season[] = [];
  selectedSeasonId: string | null = null;
  divisions: Division[] = [];
  
  // Add default stats
  private defaultStats: CalculatedClubStats = {
    wins: 0,
    losses: 0,
    otLosses: 0,
    points: 0,
    gamesPlayed: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    winPercentage: 0,
    goalDifferential: 0,
    streakCount: 0,
    streakType: '-',
    lastTen: []
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private matchService: MatchService,
    private apiService: ApiService,
    private rosterUpdateService: RosterUpdateService
  ) {}

  // Method to get the full image URL
  getImageUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return 'assets/images/default-team.png';
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

  // Load seasons and set the most recent as default


  // Load all divisions
  private loadDivisions(): void {
    this.apiService.getDivisions().subscribe({
      next: (divisions) => {
        this.divisions = divisions;
      },
      error: (err) => {
        console.error('Error loading divisions:', err);
      }
    });
  }

  // Get the division name for the selected season
  getSelectedSeasonDivision(): string | null {
    if (!this.selectedSeasonId || !this.backendClub?.seasons) {
      return null;
    }
    
    const seasonInfo = this.backendClub.seasons.find(s => {
      if (typeof s.seasonId === 'object' && s.seasonId._id) {
        return s.seasonId._id === this.selectedSeasonId;
      }
      return s.seasonId === this.selectedSeasonId;
    });
    
    if (seasonInfo?.divisionIds && seasonInfo.divisionIds.length > 0) {
      const division = this.divisions.find(d => d._id === seasonInfo.divisionIds[0]);
      return division?.name || null;
    }
    
    return null;
  }

  // Set the default selected season to "All Seasons" for initial page load
  private setDefaultSeasonForClub(backendClub: BackendClub): void {
    // Always start with "All Seasons" selected (null means "All Seasons")
    this.selectedSeasonId = null;
    console.log('Defaulting to All Seasons for initial page load');
  }

  // Get seasons that this club is actually associated with (for the dropdown)
  getClubSeasons(): any[] {
    if (!this.backendClub?.seasons || !this.seasons) {
      console.log('getClubSeasons: Missing data', { backendClub: !!this.backendClub, seasons: !!this.seasons });
      return [];
    }

    // Get the season IDs that this club is actually associated with
    const clubSeasonIds = this.backendClub.seasons.map(s => {
      if (typeof s.seasonId === 'object' && s.seasonId._id) {
        return s.seasonId._id;
      }
      return s.seasonId as string;
    });

    console.log('getClubSeasons: Club season IDs:', clubSeasonIds);
    console.log('getClubSeasons: All available seasons:', this.seasons.map(s => ({ id: s._id, name: s.name })));

    // Filter global seasons to only include seasons this club is in
    const clubSeasons = this.seasons.filter(season => 
      season._id === 'all-seasons' || clubSeasonIds.includes(season._id)
    );

    console.log('getClubSeasons: Filtered seasons for dropdown:', clubSeasons.map(s => ({ id: s._id, name: s.name })));

    return clubSeasons;
  }

  // Handle season selection change
  onSeasonChange(seasonId: string): void {
    if (seasonId === 'all-seasons') {
      this.selectedSeasonId = null; // null means "All Seasons"
    } else {
      this.selectedSeasonId = seasonId;
    }
    
    console.log('Season changed to:', seasonId === 'all-seasons' ? 'All Seasons' : seasonId);
    
    // Reload roster and stats with the new season filter (don't reload entire club data)
    if (this.backendClub?._id) {
      this.loadSeasonSpecificRoster(this.backendClub._id, this.backendClub);
      this.loadAndProcessMatches(this.backendClub._id, this.backendClub.name);
    }
  }

  // Method to refresh match data (can be called externally)
  refreshMatchData(): void {
    if (this.backendClub?._id) {
      this.loadAndProcessMatches(this.backendClub._id, this.backendClub.name);
    }
  }

  ngOnInit() {
    // Subscribe to roster updates to refresh data when needed
    this.rosterUpdateSubscription = this.rosterUpdateService.rosterUpdates$.subscribe(event => {
      console.log('Roster update received in club detail:', event);
      if (event.action === 'sign' && event.clubId && this.club && this.club._id === event.clubId) {
        console.log('Refreshing club data due to roster update');
        this.loadClubData(event.clubId);
      }
    });
    
    // Get the club ID from the URL and load data
    this.route.params.subscribe(params => {
      const clubId = params['id'];
      // Load seasons first, then club data
      this.loadSeasonsAndClubData(clubId);
    });
  }

  // Load seasons first, then club data
  private loadSeasonsAndClubData(clubId: string): void {
    this.loading = true;
    this.error = null;

    // Load seasons first
    this.apiService.getSeasons().subscribe({
      next: (seasons) => {
        this.seasons = seasons;
        
        // Sort seasons by start date (most recent first)
        this.seasons.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        
        // Add "All Seasons" option at the beginning
        this.seasons.unshift({
          _id: 'all-seasons',
          name: 'All Seasons',
          startDate: '',
          endDate: ''
        });
        
        // Load divisions for all seasons
        this.loadDivisions();
        
        // Now that seasons are loaded, load club data
        this.loadClubData(clubId);
      },
      error: (err) => {
        console.error('Error loading seasons:', err);
        this.error = 'Failed to load seasons';
        this.loading = false;
      }
    });
  }

  private loadClubData(clubId: string) {
    // Fetch all clubs first to resolve opponent names later
    this.apiService.getClubs().subscribe({
      next: (allClubs) => {
        this.allClubs = allClubs as BackendClub[];

        // Fetch club from backend by ID
        this.apiService.getClubById(clubId).subscribe({
          next: (backendClub) => {
            this.backendClub = backendClub;
            
            // Map backend club to frontend Club interface
            this.club = {
              _id: backendClub._id,
              name: backendClub.name,
              clubName: backendClub.name,
              image: this.getImageUrl(backendClub.logoUrl),
              manager: backendClub.manager,
              colour: backendClub.primaryColour || '#666',
              roster: [],
              stats: { ...this.defaultStats }
            };

            // Set the default selected season to the most recent season that this club is actually in
            this.setDefaultSeasonForClub(backendClub);
            console.log('After setDefaultSeasonForClub, selectedSeasonId:', this.selectedSeasonId);

            // Load roster based on selected season
            this.loadSeasonSpecificRoster(clubId, backendClub);
          },
          error: (err) => {
            console.error('Error loading club:', err);
            this.error = 'Failed to load club data';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading clubs:', err);
        this.error = 'Failed to load clubs data';
        this.loading = false;
      }
    });
  }

  // Load roster specific to the selected season
  private loadSeasonSpecificRoster(clubId: string, backendClub: BackendClub): void {
    if (this.selectedSeasonId === null) {
      // If no season selected, load global roster (all seasons)
      this.loadGlobalRoster(clubId, backendClub);
      return;
    }

    // Load season-specific roster
    this.apiService.getClubRoster(clubId, this.selectedSeasonId).subscribe({
      next: (roster) => {
        if (this.club) {
          this.club.roster = roster.map((user: any) => {
            const profile = user.playerProfile || {};
            return {
              id: user._id,
              discordUsername: user.discordUsername,
              position: profile.position || 'C',
              status: profile.status || 'Free Agent',
              number: profile.number || '',
              gamertag: user.gamertag || user.discordUsername,
              platform: profile.platform || 'Unknown',
              stats: user.stats || {},
              psnId: profile.platform === 'PS5' ? user.gamertag : '',
              xboxGamertag: profile.platform === 'Xbox' ? user.gamertag : '',
              country: profile.country || '',
              handedness: profile.handedness || 'Left',
              currentClubId: user.currentClubId || '',
              currentClubName: user.currentClubName || '',
              secondaryPositions: profile.secondaryPositions || []
            };
          });
        }
        
        // Load EASHL game data for this club
        this.loadAndProcessMatches(clubId, backendClub.name);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading season roster:', err);
        // Fallback to global roster
        this.loadGlobalRoster(clubId, backendClub);
      }
    });
  }

  // Load global roster (all seasons)
  private loadGlobalRoster(clubId: string, backendClub: BackendClub): void {
    this.apiService.getClubGlobalRoster(clubId).subscribe({
      next: (roster) => {
        if (this.club) {
          this.club.roster = roster.map((user: any) => {
            const profile = user.playerProfile || {};
            return {
              id: user._id,
              discordUsername: user.discordUsername,
              position: profile.position || 'C',
              status: profile.status || 'Free Agent',
              number: profile.number || '',
              gamertag: user.gamertag || user.discordUsername,
              platform: profile.platform || 'Unknown',
              stats: user.stats || {},
              psnId: profile.platform === 'PS5' ? user.gamertag : '',
              xboxGamertag: profile.platform === 'Xbox' ? user.gamertag : '',
              country: profile.country || '',
              handedness: profile.handedness || 'Left',
              currentClubId: user.currentClubId || '',
              currentClubName: user.currentClubName || '',
              secondaryPositions: profile.secondaryPositions || []
            };
          });
        }
        
        // Load EASHL game data for this club
        this.loadAndProcessMatches(clubId, backendClub.name);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading global roster:', err);
        this.error = 'Failed to load roster';
        this.loading = false;
      }
    });
  }

  private loadAndProcessMatches(clubId: string, clubName: string) {
    console.log('loadAndProcessMatches called with clubId:', clubId, 'clubName:', clubName);
    this.matchService.getMatches().subscribe({
      next: (allMatches) => {
        console.log('All matches loaded:', allMatches.length);
        console.log('First few matches:', allMatches.slice(0, 3).map(m => ({ id: m.id, homeTeam: m.homeTeam, awayTeam: m.awayTeam, seasonId: m.seasonId })));
        
        let clubMatches = allMatches.filter(match =>
          match.homeTeam === clubName || match.awayTeam === clubName
        );
        
        console.log('Club matches after name filtering:', clubMatches.length);
        console.log('Club matches details:', clubMatches.map(m => ({ id: m.id, homeTeam: m.homeTeam, awayTeam: m.awayTeam, seasonId: m.seasonId })));

        // Filter matches by selected season if one is selected
        if (this.selectedSeasonId !== null) {
          console.log('Filtering matches by season:', this.selectedSeasonId);
          console.log('All club matches before filtering:', clubMatches);
          console.log('Match seasonIds:', clubMatches.map(m => ({ id: m.id, seasonId: m.seasonId, homeTeam: m.homeTeam, awayTeam: m.awayTeam })));
          
          clubMatches = clubMatches.filter(match => {
            // Check if the match is in the selected season
            // This assumes matches have a seasonId field
            const matches = match.seasonId === this.selectedSeasonId;
            console.log(`Match ${match.id}: seasonId=${match.seasonId}, selected=${this.selectedSeasonId}, matches=${matches}`);
            return matches;
          });
          
          console.log('Filtered matches:', clubMatches);
        }

        if (this.club && clubMatches.length > 0) {
          this.matches = clubMatches;

          // Calculate and assign overall team stats
          this.club.stats = this.calculateTeamStats(clubMatches, clubName);
          // Process and assign individual player stats
          this.processEashlPlayerStats(clubMatches);
        } else if (this.club) {
          // No matches found for the selected season
          this.matches = [];
          this.club.stats = { ...this.defaultStats };
          this.skaterStats = [];
          this.goalieStats = [];
        }
      },
      error: (err) => {
        console.error('Error loading match data:', err);
      }
    });
  }

  private calculateTeamStats(matches: Match[], clubName: string): CalculatedClubStats {
    const stats: CalculatedClubStats = {
      wins: 0,
      losses: 0,
      otLosses: 0,
      points: 0,
      gamesPlayed: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      winPercentage: 0,
      goalDifferential: 0,
      streakCount: 0,
      streakType: '-',
      lastTen: []
    };

    // Sort matches by date to calculate streaks and last 10 games
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedMatches.forEach(match => {
      // Include matches that have either eashlData OR are merged games with valid scores
      const hasEashlData = match.eashlData;
      const isMergedGame = match.eashlMatchId && match.eashlMatchId.includes('+');
      const hasValidScores = match.homeScore !== undefined && match.awayScore !== undefined;
      
      // Skip if no valid data to process
      if (!hasEashlData && !isMergedGame) {
        console.log(`Skipping match ${match.id}: no eashlData and not a merged game`);
        return;
      }
      
      if (!hasValidScores) {
        console.log(`Skipping match ${match.id}: no valid scores (home: ${match.homeScore}, away: ${match.awayScore})`);
        return;
      }
      
      console.log(`Processing match ${match.id}: homeScore=${match.homeScore}, awayScore=${match.awayScore}, eashlData=${!!hasEashlData}, merged=${isMergedGame}`);

      stats.gamesPlayed++;
      let gameResult: 'W' | 'L' | 'OTL' = 'L';
      const isHomeTeam = match.homeTeam === clubName;

      if (isHomeTeam) {
        stats.goalsFor += match.homeScore;
        stats.goalsAgainst += match.awayScore;
        if (match.homeScore > match.awayScore) {
          stats.wins++;
          gameResult = 'W';
        } else {
          // Check if this was an overtime/shootout loss
          if (match.isOvertime || match.isShootout) {
            stats.otLosses++;
            gameResult = 'OTL';
          } else {
            stats.losses++;
          }
        }
      } else { // Away team
        stats.goalsFor += match.awayScore;
        stats.goalsAgainst += match.homeScore;
        if (match.awayScore > match.homeScore) {
          stats.wins++;
          gameResult = 'W';
        } else {
          // Check if this was an overtime/shootout loss
          if (match.isOvertime || match.isShootout) {
            stats.otLosses++;
            gameResult = 'OTL';
          } else {
            stats.losses++;
          }
        }
      }

      // Track last 10 games
      if (stats.lastTen.length < 10) {
        stats.lastTen.push(gameResult);
      }
    });

        // --- Streak Calculation ---
    // It's simpler to calculate the streak after the lastTen array is built.
    // The array is sorted newest to oldest.
    if (stats.lastTen.length > 0) {
      stats.streakType = stats.lastTen[0];
      stats.streakCount = 1;
      for (let i = 1; i < stats.lastTen.length; i++) {
        if (stats.lastTen[i] === stats.streakType) {
          stats.streakCount++;
        } else {
          break; // Streak broken
        }
      }
    }

    stats.points = stats.wins * 2 + stats.otLosses; // 2 points for wins, 1 point for OTL
    stats.winPercentage = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;
    stats.goalDifferential = stats.goalsFor - stats.goalsAgainst;

    // Note: Streak calculation is simplified as a full implementation is complex.
    // This can be enhanced later if needed.

    return stats;
  }

  private processEashlPlayerStats(matches: Match[]) {
    const playerStatsMap = new Map<string, any>();
    const pageClubEashlId = this.backendClub?.eashlClubId;
    const pageClubName = this.backendClub?.name;

    if (!pageClubEashlId && !pageClubName) {
      console.error("Club detail page is missing both eashlClubId and name, cannot process player stats.");
      return;
    }
    
    matches.forEach(match => {
      if (!match.eashlData?.players) return;

      // Check if this is a manual stats entry
      const isManualEntry = match.eashlData.manualEntry;
      
      if (isManualEntry) {

        
        // Manual stats: players are stored with a 'team' field
        Object.entries(match.eashlData.players).forEach(([playerId, playerData]: [string, any]) => {
          // Determine if this player belongs to the current club
          let isCurrentClubPlayer = false;
          
          if (playerData.team === 'home' && match.homeTeam === pageClubName) {
            isCurrentClubPlayer = true;
          } else if (playerData.team === 'away' && match.awayTeam === pageClubName) {
            isCurrentClubPlayer = true;
          }
          
          if (!isCurrentClubPlayer) {
            return;
          }

          // For manual stats, try to find existing player by name first
          const playerName = playerData.playername || playerData.name || 'Unknown';
          let existingKey = null;
          let existingStats = null;
          
          // Check if we already have a player with this name from EASHL stats
          for (const [key, stats] of playerStatsMap.entries()) {
            if (stats.name === playerName) {
              existingKey = key;
              existingStats = stats;

              break;
            }
          }
          
          const playerKey = existingKey || playerName;
          
          if (!playerStatsMap.has(playerKey)) {
            playerStatsMap.set(playerKey, {
              playerId: playerKey,
              name: playerName,
              number: 0, // Manual stats don't have jersey numbers
              position: this.normalizePosition(playerData.position || 'Unknown'),
              gamesPlayed: 0,
              wins: 0,
              losses: 0,
              otLosses: 0,
              goals: 0,
              assists: 0,
              points: 0,
              plusMinus: 0,
              shots: 0,
              shotPercentage: 0,
              hits: 0,
              blockedShots: 0,
              pim: 0,
              ppg: 0,
              shg: 0,
              gwg: 0,
              takeaways: 0,
              giveaways: 0,
              passes: 0,
              passAttempts: 0,
              passPercentage: 0,
              faceoffsWon: 0,
              faceoffPercentage: 0,
              playerScore: 0,
              penaltyKillCorsiZone: 0,
              saves: 0,
              shotsAgainst: 0,
              goalsAgainst: 0,
              savePercentage: 0,
              goalsAgainstAverage: 0,
              shutouts: 0
            });
          } else if (existingStats) {
            // Update position if we're merging with existing EASHL stats
            // Manual stats might have more accurate position info
            existingStats.position = this.normalizePosition(playerData.position || existingStats.position);
          }
          
          const stats = playerStatsMap.get(playerKey);
          stats.gamesPlayed++;
          

          
          if (this.isGoalie(playerData.position)) {

            // Calculate win/loss based on match result
            const playerTeamScore = parseInt(playerData.score) || 0;
            const opponentScore = parseInt(playerData.opponentScore) || 0;
            
            // If we have valid scores, use them for win/loss calculation
            if (playerTeamScore > 0 || opponentScore > 0) {
              if (playerTeamScore > opponentScore) {
                stats.wins = (stats.wins || 0) + 1;
              } else if (playerTeamScore < opponentScore) {
                // Check if this was an overtime/shootout loss

                if (match.isOvertime) {
                  stats.otl = (stats.otl || 0) + 1;

                } else {
                  stats.losses = (stats.losses || 0) + 1;

                }
              }
            } else {
              // Fallback: if no valid scores, try to determine from match data
              const isHomeTeam = match.homeTeam === pageClubName;
              const homeScore = match.homeScore || 0;
              const awayScore = match.awayScore || 0;
              
              if (isHomeTeam) {
                if (homeScore > awayScore) {
                  stats.wins = (stats.wins || 0) + 1;
                } else if (homeScore < awayScore) {
                  if (match.isOvertime) {
                    stats.otl = (stats.otl || 0) + 1;
                  } else {
                    stats.losses = (stats.losses || 0) + 1;
                  }
                }
              } else {
                if (awayScore > homeScore) {
                  stats.wins = (stats.wins || 0) + 1;
                } else if (awayScore < homeScore) {
                  if (match.isOvertime) {
                    stats.otl = (stats.otl || 0) + 1;
                  } else {
                    stats.losses = (stats.losses || 0) + 1;
                  }
                }
              }
            }
            
            stats.saves = (stats.saves || 0) + (parseInt(playerData.glsaves) || 0);
            stats.shotsAgainst = (stats.shotsAgainst || 0) + (parseInt(playerData.glshots) || 0);
            stats.goalsAgainst = (stats.goalsAgainst || 0) + (parseInt(playerData.glga) || 0);
            stats.shutouts = (stats.shutouts || 0) + (parseInt(playerData.glso) || 0);
          } else {
            // Calculate win/loss based on match result
            const playerTeamScore = parseInt(playerData.score) || 0;
            const opponentScore = parseInt(playerData.opponentScore) || 0;
            
            // If we have valid scores, use them for win/loss calculation
            if (playerTeamScore > 0 || opponentScore > 0) {
              if (playerTeamScore > opponentScore) {
                stats.wins = (stats.wins || 0) + 1;
              } else if (playerTeamScore < opponentScore) {
                // Check if this was an overtime/shootout loss
                if (match.isOvertime) {
                  stats.otl = (stats.otl || 0) + 1;
                } else {
                  stats.losses = (stats.losses || 0) + 1;
                }
              }
            } else {
              // Fallback: if no valid scores, try to determine from match data
              const isHomeTeam = match.homeTeam === pageClubName;
              const homeScore = match.homeScore || 0;
              const awayScore = match.awayScore || 0;
              
              if (isHomeTeam) {
                if (homeScore > awayScore) {
                  stats.wins = (stats.wins || 0) + 1;
                } else if (homeScore < awayScore) {
                  if (match.isOvertime) {
                    stats.otl = (stats.otl || 0) + 1;
                  } else {
                    stats.losses = (stats.losses || 0) + 1;
                  }
                }
              } else {
                if (awayScore > homeScore) {
                  stats.wins = (stats.wins || 0) + 1;
                } else if (awayScore < homeScore) {
                  if (match.isOvertime) {
                    stats.otl = (stats.otl || 0) + 1;
                  } else {
                    stats.losses = (stats.losses || 0) + 1;
                  }
                }
              }
            }
            stats.goals += parseInt(playerData.skgoals) || 0;
            stats.assists += parseInt(playerData.skassists) || 0;
            stats.points = stats.goals + stats.assists;
            stats.plusMinus += parseInt(playerData.skplusmin) || 0;
            stats.shots = (stats.shots || 0) + (parseInt(playerData.skshots) || 0);
            stats.hits = (stats.hits || 0) + (parseInt(playerData.skhits) || 0);
            stats.blockedShots = (stats.blockedShots || 0) + (parseInt(playerData.skblocks) || 0);
            stats.pim = (stats.pim || 0) + (parseInt(playerData.skpim) || 0);
            stats.ppg = (stats.ppg || 0) + (parseInt(playerData.skppg) || 0);
            stats.shg = (stats.shg || 0) + (parseInt(playerData.skshg) || 0);
            stats.gwg = (stats.gwg || 0) + (parseInt(playerData.skgwg) || 0);
            stats.takeaways = (stats.takeaways || 0) + (parseInt(playerData.sktakeaways) || 0);
            stats.giveaways = (stats.giveaways || 0) + (parseInt(playerData.skgiveaways) || 0);
            stats.passes = (stats.passes || 0) + (parseInt(playerData.skpasses) || 0);
            stats.passAttempts = (stats.passAttempts || 0) + (parseInt(playerData.skpassattempts) || 0);
            stats.faceoffsWon = (stats.faceoffsWon || 0) + (parseInt(playerData.skfaceoffswon) || 0);
            stats.playerScore = (stats.playerScore || 0) + (parseInt(playerData.skplayerscore) || 0);
            stats.penaltyKillCorsiZone = (stats.penaltyKillCorsiZone || 0) + (parseInt(playerData.skpkcorsi) || 0);
          }
        });
      } else {
        // Standard EASHL data: players are keyed by club ID
        if (pageClubEashlId && match.eashlData.players[pageClubEashlId]) {
          const clubPlayers = match.eashlData.players[pageClubEashlId];

          Object.entries(clubPlayers).forEach(([eaPlayerId, playerData]: [string, any]) => {
            // For EASHL data, try to find existing player by name first, then by ID
            const playerName = playerData.playername || playerData.name || 'Unknown';
            let existingKey = null;
            let existingStats = null;
            
            // Check if we already have a player with this name from manual stats
            for (const [key, stats] of playerStatsMap.entries()) {
              if (stats.name === playerName) {
                existingKey = key;
                existingStats = stats;

                break;
              }
            }
            
            const playerKey = existingKey || eaPlayerId;
            
                                     if (!playerStatsMap.has(playerKey)) {
              playerStatsMap.set(playerKey, {
                playerId: eaPlayerId,
                name: playerName,
                number: 0, // Jersey number not available in this part of the API
                position: this.normalizePosition(playerData.position || 'Unknown'),
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                otLosses: 0,
                goals: 0,
                assists: 0,
                points: 0,
                plusMinus: 0,
                shots: 0,
                shotPercentage: 0,
                hits: 0,
                blockedShots: 0,
                pim: 0,
                ppg: 0,
                shg: 0,
                gwg: 0,
                takeaways: 0,
                giveaways: 0,
                passes: 0,
                passAttempts: 0,
                passPercentage: 0,
                faceoffsWon: 0,
                faceoffPercentage: 0,
                playerScore: 0,
                penaltyKillCorsiZone: 0,
                saves: 0,
                shotsAgainst: 0,
                goalsAgainst: 0,
                savePercentage: 0,
                goalsAgainstAverage: 0,
                shutouts: 0
              });
            } else if (existingStats) {
              // Update position if we're merging with existing manual stats
              // EASHL data typically has more accurate position info
              existingStats.position = this.normalizePosition(playerData.position || existingStats.position);
            }
            
            const stats = playerStatsMap.get(playerKey);
            stats.gamesPlayed++;
            
            if (this.isGoalie(playerData.position)) {
              // Calculate win/loss based on match result
              const playerTeamScore = parseInt(playerData.score) || 0;
              const opponentScore = parseInt(playerData.opponentScore) || 0;
              
              // If we have valid scores, use them for win/loss calculation
              if (playerTeamScore > 0 || opponentScore > 0) {
                if (playerTeamScore > opponentScore) {
                  stats.wins = (stats.wins || 0) + 1;
                } else if (playerTeamScore < opponentScore) {
                  // Check if this was an overtime/shootout loss
                  if (match.isOvertime) {
                    stats.otl = (stats.otl || 0) + 1;
                  } else {
                    stats.losses = (stats.losses || 0) + 1;
                  }
                }
              } else {
                // Fallback: if no valid scores, try to determine from match data
                const isHomeTeam = match.homeTeam === pageClubName;
                const homeScore = match.homeScore || 0;
                const awayScore = match.awayScore || 0;
                
                if (isHomeTeam) {
                  if (homeScore > awayScore) {
                    stats.wins = (stats.wins || 0) + 1;
                  } else if (homeScore < awayScore) {
                    if (match.isOvertime) {
                      stats.otl = (stats.otl || 0) + 1;
                    } else {
                      stats.losses = (stats.losses || 0) + 1;
                    }
                  }
                } else {
                  if (awayScore > homeScore) {
                    stats.wins = (stats.wins || 0) + 1;
                  } else if (awayScore < homeScore) {
                    if (match.isOvertime) {
                      stats.otl = (stats.otl || 0) + 1;
                    } else {
                      stats.losses = (stats.losses || 0) + 1;
                    }
                  }
                }
              }
              
              stats.saves = (stats.saves || 0) + (parseInt(playerData.glsaves) || 0);
              stats.shotsAgainst = (stats.shotsAgainst || 0) + (parseInt(playerData.glshots) || 0);
              stats.goalsAgainst = (stats.goalsAgainst || 0) + (parseInt(playerData.glga) || 0);
              stats.shutouts = (stats.shutouts || 0) + (parseInt(playerData.glso) || 0);
            } else {
              // Calculate win/loss based on match result
              const playerTeamScore = parseInt(playerData.score) || 0;
              const opponentScore = parseInt(playerData.opponentScore) || 0;
              
              // If we have valid scores, use them for win/loss calculation
              if (playerTeamScore > 0 || opponentScore > 0) {
                if (playerTeamScore > opponentScore) {
                  stats.wins = (stats.wins || 0) + 1;
                } else if (playerTeamScore < opponentScore) {
                  // Check if this was an overtime/shootout loss
                  if (match.isOvertime) {
                    stats.otl = (stats.otl || 0) + 1;
                  } else {
                    stats.losses = (stats.losses || 0) + 1;
                  }
                }
              } else {
                // Fallback: if no valid scores, try to determine from match data
                const isHomeTeam = match.homeTeam === pageClubName;
                const homeScore = match.homeScore || 0;
                const awayScore = match.awayScore || 0;
                
                if (isHomeTeam) {
                  if (homeScore > awayScore) {
                    stats.wins = (stats.wins || 0) + 1;
                  } else if (homeScore < awayScore) {
                    if (match.isOvertime) {
                      stats.otl = (stats.otl || 0) + 1;
                    } else {
                      stats.losses = (stats.losses || 0) + 1;
                    }
                  }
                } else {
                  if (awayScore > homeScore) {
                    stats.wins = (stats.wins || 0) + 1;
                  } else if (awayScore < homeScore) {
                    if (match.isOvertime) {
                      stats.otl = (stats.otl || 0) + 1;
                    } else {
                      stats.losses = (stats.losses || 0) + 1;
                    }
                  }
                }
              }
              stats.goals += parseInt(playerData.skgoals) || 0;
              stats.assists += parseInt(playerData.skassists) || 0;
              stats.points = stats.goals + stats.assists;
              stats.plusMinus += parseInt(playerData.skplusmin) || 0;
              stats.shots = (stats.shots || 0) + (parseInt(playerData.skshots) || 0);
              stats.hits = (stats.hits || 0) + (parseInt(playerData.skhits) || 0);
              stats.blockedShots = (stats.blockedShots || 0) + (parseInt(playerData.skblocks) || 0);
              stats.pim = (stats.pim || 0) + (parseInt(playerData.skpim) || 0);
              stats.ppg = (stats.ppg || 0) + (parseInt(playerData.skppg) || 0);
              stats.shg = (stats.shg || 0) + (parseInt(playerData.skshg) || 0);
              stats.gwg = (stats.gwg || 0) + (parseInt(playerData.skgwg) || 0);
              stats.takeaways = (stats.takeaways || 0) + (parseInt(playerData.sktakeaways) || 0);
              stats.giveaways = (stats.giveaways || 0) + (parseInt(playerData.skgiveaways) || 0);
              stats.passes = (stats.passes || 0) + (parseInt(playerData.skpasses) || 0);
              stats.passAttempts = (stats.passAttempts || 0) + (parseInt(playerData.skpassattempts) || 0);
              stats.faceoffsWon = (stats.faceoffsWon || 0) + (parseInt(playerData.skfaceoffswon) || 0);
              stats.playerScore = (stats.playerScore || 0) + (parseInt(playerData.skplayerscore) || 0);
              stats.penaltyKillCorsiZone = (stats.penaltyKillCorsiZone || 0) + (parseInt(playerData.skpkcorsi) || 0);
            }
          });
        }
      }
    });
    
    // Post-process stats for percentages and averages
    playerStatsMap.forEach(stats => {
      // Calculate final percentages after all stats are aggregated
      if (stats.shots > 0) {
        stats.shotPercentage = (stats.goals / stats.shots) * 100;
      }
      if (stats.passAttempts > 0) {
        stats.passPercentage = (stats.passes / stats.passAttempts) * 100;
      }
      if (stats.faceoffsWon > 0) {
        // For faceoff percentage, we need to calculate from total faceoffs
        // This is a bit tricky since we don't store faceoffsLost separately
        // We'll use the existing calculation if available
        if (!stats.faceoffPercentage) {
          stats.faceoffPercentage = 0; // Default if we can't calculate
        }
      }
      
      // Post-process goalie stats for percentages and averages
      if (this.isGoalie(stats.position) && stats.gamesPlayed > 0) {
        // Calculate save percentage from total saves and shots against
        if (stats.shotsAgainst > 0) {
          stats.savePercentage = stats.saves / stats.shotsAgainst;
        }
        // Calculate GAA (goals against average) from total goals against and games played
        stats.goalsAgainstAverage = stats.goalsAgainst / stats.gamesPlayed;
      }
    });



    // Convert maps to arrays for display
    this.skaterStats = Array.from(playerStatsMap.values())
      .filter(player => !this.isGoalie(player.position));
      
    this.goalieStats = Array.from(playerStatsMap.values())
      .filter(player => this.isGoalie(player.position));


  }

  private isGoalie(position: string): boolean {
    const lowerPos = position.toLowerCase().replace(/\s/g, '');
    return lowerPos === 'g' || lowerPos === 'goalie' || lowerPos === 'goaltender';
  }

  private normalizePosition(position: string): string {
    const lowerPos = position.toLowerCase().replace(/\s/g, '');
    const positionMap: { [key: string]: string } = {
      'c': 'C',
      'center': 'C',
      'lw': 'LW',
      'leftwing': 'LW',
      'rw': 'RW',
      'rightwing': 'RW',
      'ld': 'LD',
      'leftdefense': 'LD',
      'leftdefenseman': 'LD',
      'rd': 'RD',
      'rightdefense': 'RD',
      'rightdefenseman': 'RD',
      'd': 'D',
      'defenseman': 'D',
      'defensemen': 'D',
      'g': 'G',
      'goalie': 'G',
      'goaltender': 'G'
    };
    return positionMap[lowerPos] || position.toUpperCase();
  }

  get signedPlayers(): Player[] {
    if (!this.club || !this.club.roster) {
      return [];
    }
    return this.club.roster.filter(player => player.status === 'Signed');
  }


  
  ngOnDestroy(): void {
    if (this.rosterUpdateSubscription) {
      this.rosterUpdateSubscription.unsubscribe();
    }
  }
}
