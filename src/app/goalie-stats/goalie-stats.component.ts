import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchService, EashlMatch } from '../store/services/match.service';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../store/services/api.service';
import { forkJoin, timeout, catchError, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { ImageUrlService } from '../shared/services/image-url.service';
import { AdSenseComponent, AdSenseConfig } from '../components/adsense/adsense.component';

interface Season {
  _id: string;
  name: string;
  endDate: string;
  startDate: string; // Added startDate for Season
}

interface Division {
  _id: string;
  name: string;
  seasonId: string;
  logoUrl?: string;
  order?: number;
}

interface ClubSeasonInfo {
  seasonId: string | { _id: string; name: string };
  divisionIds?: string[];
  roster?: string[];
}

interface Club {
  name: string;
  seasons?: ClubSeasonInfo[];
}

interface GoalieStats {
  playerId: number;
  name: string;
  team: string;
  teamLogo?: string;
  number: number;
  gamesPlayed: number;
  saves: number;
  shotsAgainst: number;
  goalsAgainst: number;
  shutouts: number;
  savePercentage: number;
  goalsAgainstAverage: number;
  division?: string;
}

interface GroupedGoalieStats {
  division: string;
  divisionData?: Division;
  stats: GoalieStats[];
}

@Component({
  selector: 'app-goalie-stats',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdSenseComponent], // Add FormsModule
  templateUrl: './goalie-stats.component.html',
  styleUrl: './goalie-stats.component.css'
})
export class GoalieStatsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  allMatches: EashlMatch[] = [];
  allClubs: Club[] = [];
  groupedStats: GroupedGoalieStats[] = [];
  filteredGroupedStats: GroupedGoalieStats[] = [];
  seasons: Season[] = [];
  divisions: Division[] = [];
  selectedSeasonId: string | null = null;
  selectedDivisionId: string = 'all-divisions';
  includePlayoffs: boolean = false;
  
  isLoading: boolean = true;
  sortColumn: string = 'savePercentage'; // Default sort by save percentage
  sortDirection: 'asc' | 'desc' = 'desc'; // Default sort direction
  
  // AdSense configuration
  bannerAdConfig: AdSenseConfig = {
    adSlot: '8840984486',
    adFormat: 'auto',
    responsive: true,
    className: 'banner-ad'
  };
  
  constructor(
    private matchService: MatchService,
    private apiService: ApiService,
    private imageUrlService: ImageUrlService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) { }
  
  ngOnInit(): void {
    console.log('🔍 GOALIE STATS COMPONENT INITIALIZED');
    
    // Read filter state from query parameters
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['season']) {
        this.selectedSeasonId = params['season'];
      }
      if (params['division']) {
        this.selectedDivisionId = params['division'];
      }
      if (params['playoffs'] !== undefined) {
        this.includePlayoffs = params['playoffs'] === 'true';
      }
    });
    
    this.loadInitialData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInitialData(): void {
    this.isLoading = true;
    forkJoin({
      matches: this.matchService.getMatches(),
      seasons: this.apiService.getSeasons(),
      clubs: this.apiService.getClubs()
    }).subscribe({
      next: ({ matches, seasons, clubs }) => {
        this.allMatches = matches;
        this.allClubs = clubs;
        this.seasons = [...seasons].sort((a, b) => {
          const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
          const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
          return dateB - dateA;
        });
        
        console.log('Loaded seasons:', this.seasons.map(s => ({ id: s._id, name: s.name, start: s.startDate, end: s.endDate })));
        console.log('Loaded matches:', this.allMatches.length);
        console.log('Sample match dates:', this.allMatches.slice(0, 5).map(m => ({ id: m.id, date: m.date, home: m.homeTeam, away: m.awayTeam })));
        
        if (this.seasons.length > 0) {
          this.selectedSeasonId = 'all-seasons'; // Default to "All Seasons"
          console.log('Auto-selected season: All Seasons');
          this.loadStatsForSeason();
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Failed to load initial data', err);
        this.isLoading = false;
      }
    });
  }

  onSeasonChange(): void {
    this.selectedDivisionId = 'all-divisions'; // Reset division filter when season changes
    
    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        season: this.selectedSeasonId, 
        division: this.selectedDivisionId,
        playoffs: this.includePlayoffs
      },
      queryParamsHandling: 'merge'
    });
    
    this.loadStatsForSeason();
  }

  onDivisionChange(): void {
    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        season: this.selectedSeasonId, 
        division: this.selectedDivisionId,
        playoffs: this.includePlayoffs
      },
      queryParamsHandling: 'merge'
    });
    
    this.applyDivisionFilter();
  }

  loadStatsForSeason(): void {
    if (!this.selectedSeasonId) {
      this.groupedStats = [];
      return;
    }
    
    this.isLoading = true;
    
    // If "All Seasons" is selected, load all divisions and process all matches
    if (this.selectedSeasonId === 'all-seasons') {
      this.apiService.getDivisions().subscribe({
        next: (divisions) => {
          // Deduplicate divisions by _id to prevent duplicate dropdown entries
          const deduplicatedDivisions = divisions.filter((division, index, self) => 
            index === self.findIndex(d => d._id === division._id)
          );
          
          // Sort divisions by their order field (ascending)
          this.divisions = deduplicatedDivisions.sort((a, b) => (a.order || 0) - (b.order || 0));
          this.filterAndAggregateStats();
          // Don't set isLoading = false here - let aggregateGoalieStats handle it
        },
        error: (err) => {
          console.error('Failed to load all divisions', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Load divisions for specific season
      this.apiService.getDivisionsBySeason(this.selectedSeasonId).subscribe({
        next: (divisions) => {
          // Deduplicate divisions by _id to prevent duplicate dropdown entries
          const deduplicatedDivisions = divisions.filter((division, index, self) => 
            index === self.findIndex(d => d._id === division._id)
          );
          
          // Sort divisions by their order field (ascending)
          this.divisions = deduplicatedDivisions.sort((a, b) => (a.order || 0) - (b.order || 0));
          this.filterAndAggregateStats();
          // Don't set isLoading = false here - let aggregateGoalieStats handle it
        },
        error: (err) => {
          console.error(`Failed to load divisions for season ${this.selectedSeasonId}`, err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  filterAndAggregateStats(): void {
    if (this.selectedSeasonId === 'all-seasons') {
      console.log('Filtering goalie stats for ALL SEASONS');
      console.log('Total matches available:', this.allMatches.length);
      
      // For "All Seasons", include all teams and all matches
      const allTeams = new Set<string>();
      this.allClubs.forEach(club => {
        allTeams.add(club.name);
      });
      
      console.log('All teams:', Array.from(allTeams));
      
      // Use all matches for "All Seasons", but filter out playoff games unless includePlayoffs is true
      let filteredMatches = this.allMatches;
      if (!this.includePlayoffs) {
        filteredMatches = filteredMatches.filter(match => !this.isPlayoffGame(match));
      }
      console.log('Using all matches for All Seasons:', filteredMatches.length);
      
      // Create team division map for all seasons
      const teamDivisionMap = new Map<string, string>();
      const divisionIdToNameMap = new Map<string, string>();
      this.divisions.forEach(d => divisionIdToNameMap.set(d._id, d.name));

      this.allClubs.forEach(club => {
        // For "All Seasons", use the first division found for each club
        if (club.seasons && club.seasons.length > 0) {
          const firstSeason = club.seasons[0];
          if (firstSeason.divisionIds && firstSeason.divisionIds.length > 0) {
            const divisionId = firstSeason.divisionIds[0];
            const divisionName = divisionIdToNameMap.get(divisionId);
            if (divisionName) {
              teamDivisionMap.set(club.name, divisionName);
            }
          }
        }
      });
      
      console.log('Team division map for All Seasons:', teamDivisionMap);
      
      // Process stats for all matches
      this.aggregateGoalieStats(filteredMatches, teamDivisionMap);
      return;
    }

    const season = this.seasons.find(s => s._id === this.selectedSeasonId);
    if (!season) {
      this.groupedStats = [];
      return;
    }

    console.log('Filtering goalie stats for season:', season.name, 'ID:', season._id);
    console.log('Total matches available:', this.allMatches.length);

    // Instead of filtering by date, filter by season association
    // Only include matches where teams are officially in the selected season
    const seasonTeams = new Set<string>();
    this.allClubs.forEach(club => {
      const seasonInfo = club.seasons?.find((s: ClubSeasonInfo) => {
        if (typeof s.seasonId === 'object' && s.seasonId._id) {
          return s.seasonId._id === this.selectedSeasonId;
        } else if (typeof s.seasonId === 'string') {
          return s.seasonId === this.selectedSeasonId;
        }
        return false;
      });
      if (seasonInfo) {
        seasonTeams.add(club.name);
      }
    });
    
    console.log('Teams in season:', Array.from(seasonTeams));
    
    // Filter matches to only include those from the specific season
    let filteredMatches = this.allMatches.filter(match => {
      // Check if the match belongs to the selected season
      if (match.seasonId && match.seasonId === this.selectedSeasonId) {
        // Also ensure at least one team is officially in this season
        const homeTeamInSeason = match.homeClub?.name && seasonTeams.has(match.homeClub.name);
        const awayTeamInSeason = match.awayClub?.name && seasonTeams.has(match.awayClub.name);
        return homeTeamInSeason || awayTeamInSeason;
      }
      return false;
    });
    
    // Filter out playoff games unless includePlayoffs is true
    if (!this.includePlayoffs) {
      filteredMatches = filteredMatches.filter(match => !this.isPlayoffGame(match));
    }
    
    console.log('Matches from specific season:', filteredMatches.length);
    
    // Create team division map for the selected season
    const teamDivisionMap = new Map<string, string>();
    const divisionIdToNameMap = new Map<string, string>();
    this.divisions.forEach(d => divisionIdToNameMap.set(d._id, d.name));

    this.allClubs.forEach(club => {
      // Only process clubs that are in the selected season
      if (!seasonTeams.has(club.name)) {
        return;
      }

      const seasonInfo = club.seasons?.find((s: ClubSeasonInfo) => {
        if (typeof s.seasonId === 'object' && s.seasonId._id) {
          return s.seasonId._id === this.selectedSeasonId;
        } else if (typeof s.seasonId === 'string') {
          return s.seasonId === this.selectedSeasonId;
        }
        return false;
      });
      if (seasonInfo && seasonInfo.divisionIds && seasonInfo.divisionIds.length > 0) {
        const divisionId = seasonInfo.divisionIds[0];
        const divisionName = divisionIdToNameMap.get(divisionId);
        if (divisionName) {
          teamDivisionMap.set(club.name, divisionName);
        }
      }
    });
    
    console.log('Team division map:', teamDivisionMap);
    
    // Process stats for the filtered matches
    this.aggregateGoalieStats(filteredMatches, teamDivisionMap);
  }
  
  aggregateGoalieStats(matches: EashlMatch[], teamDivisionMap: Map<string, string>): void {
    console.log('🔍 AGGREGATE GOALIE STATS CALLED with', matches.length, 'matches');
    
    // Fetch all players to build username-to-playerId map
    // Add timeout to prevent hanging on mobile (15 seconds)
    this.apiService.getAllPlayers().pipe(
      timeout(15000),
      catchError((error) => {
        console.error('Error or timeout fetching players for username mapping:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        console.warn('WARNING: Continuing without username mapping - stats may not be aggregated across usernames');
        // Return empty array as fallback
        return of([]);
      })
    ).subscribe({
      next: (allPlayers) => {
        if (!allPlayers || allPlayers.length === 0) {
          console.warn('WARNING: getAllPlayers returned empty array, continuing with empty username map');
          allPlayers = [];
        }
        // Build username-to-playerId map from all players' usernames arrays
        const usernameToPlayerId = new Map<string, string>();
        const playerIdToPrimaryUsername = new Map<string, string>();
        
        allPlayers.forEach((player: any) => {
          const playerId = (player._id || player.id)?.toString();
          if (!playerId) return;
          
          let usernames: string[] = [];
          let primaryUsername = '';
          
          if (player.usernames && Array.isArray(player.usernames) && player.usernames.length > 0) {
            usernames = player.usernames.map((u: any) => {
              const username = typeof u === 'string' ? u : (u?.username || '');
              return username;
            }).filter(Boolean);
            primaryUsername = player.usernames.find((u: any) => u?.isPrimary)?.username || 
                             (typeof player.usernames[0] === 'string' ? player.usernames[0] : player.usernames[0]?.username) || 
                             '';
          } else if (player.gamertag) {
            usernames = [player.gamertag];
            primaryUsername = player.gamertag;
          }
          
          usernames.forEach(username => {
            if (username) {
              usernameToPlayerId.set(username.toLowerCase().trim(), playerId);
            }
          });
          
          if (primaryUsername) {
            playerIdToPrimaryUsername.set(playerId, primaryUsername);
          }
        });
        
        const statsMap = new Map<string, GoalieStats>(); // Key by playerId string
    const teamLogoMap = new Map<string, string | undefined>();

    console.log('Processing matches for goalie stats:', matches.length);
    
    // For "All Seasons", include all teams
    if (this.selectedSeasonId === 'all-seasons') {
      const allTeams = new Set<string>();
      this.allClubs.forEach(club => {
        allTeams.add(club.name);
      });
      console.log('All teams for All Seasons:', Array.from(allTeams));
      
      // Create a map of team names to their logos from all matches
      matches.forEach(match => {
        if (match.homeTeam) teamLogoMap.set(match.homeTeam, this.getImageUrl(match.homeClub?.logoUrl));
        if (match.awayTeam) teamLogoMap.set(match.awayTeam, this.getImageUrl(match.awayClub?.logoUrl));
      });
      
      matches.forEach(match => {
        console.log('Processing match for All Seasons:', match.id, 'Home:', match.homeTeam, 'Away:', match.awayTeam);
        console.log('Match eashlData:', match.eashlData);
        
        // Check if this is a manual stats entry first
        if (match.eashlData?.manualEntry && match.eashlData?.players) {
          console.log('Processing manual stats for goalies in match:', match.id);
          console.log('Manual stats eashlData.players:', match.eashlData.players);
          
          // Process manual stats from eashlData.players (homeGoalies, awayGoalies)
          const { homeGoalies = [], awayGoalies = [] } = match.eashlData.players;
          
          console.log('Home goalies found:', homeGoalies.length);
          console.log('Away goalies found:', awayGoalies.length);
          
          // Process home goalies
          homeGoalies.forEach((player: any) => {
            if (!player || !player.gamertag) return;
            
            console.log('Processing home goalie:', player.gamertag, 'position:', player.position, 'isGoalie:', this.isGoalie(player.position));
            
            // Only process goalies
            if (!this.isGoalie(player.position)) return;
            
            const teamName = match.homeTeam;
            
            console.log('Home goalie team name:', teamName, 'Season teams:', Array.from(allTeams));
            console.log('Match homeTeam:', match.homeTeam, 'Match awayTeam:', match.awayTeam);
            
            // Find playerId by matching username
            const normalizedName = player.gamertag?.toLowerCase().trim();
            const playerId = normalizedName ? (usernameToPlayerId.get(normalizedName) || player.gamertag) : player.gamertag;
            const primaryUsername = playerIdToPrimaryUsername.get(playerId) || player.gamertag;
            
            // Use playerId as key to combine stats from multiple usernames
            const playerKey = playerId;
            let existingStats = statsMap.get(playerKey);
            
            if (!existingStats) {
              existingStats = {
                playerId: parseInt(playerId) || 0,
                name: primaryUsername,
                team: teamName,
                teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
                number: parseInt(player.number) || 0,
                division: teamDivisionMap.get(teamName) || 'Unknown',
                gamesPlayed: 0,
                saves: 0,
                shotsAgainst: 0,
                goalsAgainst: 0,
                shutouts: 0,
                savePercentage: 0,
                goalsAgainstAverage: 0
              };
              statsMap.set(playerKey, existingStats);
            }
            
            if (existingStats) {
              console.log(`Updating home goalie stats for ${player.gamertag}:`, {
                saves: player.saves,
                shotsAgainst: player.shotsAgainst,
                goalsAgainst: player.goalsAgainst
              });
              
              existingStats.gamesPlayed++;
              existingStats.saves += parseInt(player.saves) || 0;
              existingStats.shotsAgainst += parseInt(player.shotsAgainst) || 0;
              existingStats.goalsAgainst += parseInt(player.goalsAgainst) || 0;
              existingStats.shutouts += parseInt(player.shutout) || 0;
              existingStats.team = teamName;
              existingStats.teamLogo = teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png';
              existingStats.division = teamDivisionMap.get(teamName) || existingStats.division;
              
              console.log(`Updated stats for ${player.gamertag}:`, {
                gamesPlayed: existingStats.gamesPlayed,
                saves: existingStats.saves,
                shotsAgainst: existingStats.shotsAgainst,
                goalsAgainst: existingStats.goalsAgainst
              });
            }
          });
          
          // Process away goalies
          awayGoalies.forEach((player: any) => {
            if (!player || !player.gamertag) return;
            
            console.log('Processing away goalie:', player.gamertag, 'position:', player.position, 'isGoalie:', this.isGoalie(player.position));
            
            // Only process goalies
            if (!this.isGoalie(player.position)) return;
            
            const teamName = match.awayTeam;
            
            console.log('Away goalie team name:', teamName, 'Season teams:', Array.from(allTeams));
            console.log('Match homeTeam:', match.homeTeam, 'Match awayTeam:', match.awayTeam);
            
            // Find playerId by matching username
            const normalizedName = player.gamertag?.toLowerCase().trim();
            const playerId = normalizedName ? (usernameToPlayerId.get(normalizedName) || player.gamertag) : player.gamertag;
            const primaryUsername = playerIdToPrimaryUsername.get(playerId) || player.gamertag;
            
            // Use playerId as key to combine stats from multiple usernames
            const playerKey = playerId;
            let existingStats = statsMap.get(playerKey);
            
            if (!existingStats) {
              existingStats = {
                playerId: parseInt(playerId) || 0,
                name: primaryUsername,
                team: teamName,
                teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
                number: parseInt(player.number) || 0,
                division: teamDivisionMap.get(teamName) || 'Unknown',
                gamesPlayed: 0,
                saves: 0,
                shotsAgainst: 0,
                goalsAgainst: 0,
                shutouts: 0,
                savePercentage: 0,
                goalsAgainstAverage: 0
              };
              statsMap.set(playerKey, existingStats);
            }
            
            if (existingStats) {
              console.log(`Updating away goalie stats for ${player.gamertag}:`, {
                saves: player.saves,
                shotsAgainst: player.shotsAgainst,
                goalsAgainst: player.goalsAgainst
              });
              
              existingStats.gamesPlayed++;
              existingStats.saves += parseInt(player.saves) || 0;
              existingStats.shotsAgainst += parseInt(player.shotsAgainst) || 0;
              existingStats.goalsAgainst += parseInt(player.goalsAgainst) || 0;
              existingStats.shutouts += parseInt(player.shutout) || 0;
              existingStats.team = teamName;
              existingStats.teamLogo = teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png';
              existingStats.division = teamDivisionMap.get(teamName) || existingStats.division;
              
              console.log(`Updated stats for ${player.gamertag}:`, {
                gamesPlayed: existingStats.gamesPlayed,
                saves: existingStats.saves,
                shotsAgainst: existingStats.shotsAgainst,
                goalsAgainst: existingStats.goalsAgainst
              });
            }
          });
        } else if (match.eashlData?.players) {
          // Process EASHL data
          console.log('Found eashlData.players:', Object.keys(match.eashlData.players));
          
          Object.entries(match.eashlData.players).forEach(([clubId, clubPlayers]: [string, any]) => {
            console.log('Processing club ID:', clubId, 'Players:', clubPlayers);
            
            // Map club ID to team name
            let teamName = 'Unknown';
            if (match.homeClub?.eashlClubId === clubId) {
              teamName = match.homeClub.name;
            } else if (match.awayClub?.eashlClubId === clubId) {
              teamName = match.awayClub.name;
            }
            
            console.log('Mapped club ID', clubId, 'to team name:', teamName);
            
            // For "All Seasons", include all teams
            if (typeof clubPlayers === 'object' && clubPlayers !== null) {
              Object.entries(clubPlayers).forEach(([playerId, playerData]: [string, any]) => {
                if (!playerData.position || !this.isGoalie(playerData.position)) {
                  return; // Skip non-goalies or players without position
                }

                const playerIdNum = parseInt(playerId);
                const playerKey = `${playerData.playername || 'Unknown'}_${teamName}`;
                let existingStats = statsMap.get(playerKey);

                if (!existingStats) {
                  existingStats = {
                    playerId: playerIdNum,
                    name: playerData.playername || 'Unknown',
                    team: teamName,
                    teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
                    number: parseInt(playerData.jerseynum) || 0,
                    division: teamDivisionMap.get(teamName) || 'Unknown',
                    gamesPlayed: 0,
                    saves: 0,
                    shotsAgainst: 0,
                    goalsAgainst: 0,
                    shutouts: 0,
                    savePercentage: 0,
                    goalsAgainstAverage: 0
                  };
                  statsMap.set(playerKey, existingStats);
                }

                const goalsAgainstThisGame = parseInt(playerData.glga) || 0;
                // Use EA's shutout field if available, otherwise calculate based on goals against
                const shutouts = parseInt(playerData.glso) || ((goalsAgainstThisGame === 0) ? 1 : 0);
                
                console.log(`Processing EASHL goalie ${playerData.playername}:`, {
                  glsaves: playerData.glsaves,
                  glshots: playerData.glshots,
                  glga: playerData.glga,
                  goalsAgainstThisGame: goalsAgainstThisGame,
                  shutouts: shutouts,
                  glso: playerData.glso,
                  glsoType: typeof playerData.glso
                });
                
                // Special debug for Vxxlle-_- to see what's happening
                if (playerData.playername && playerData.playername.includes('Vxxlle')) {
                  console.log('🔍 VXXLLE DEBUG:', {
                    name: playerData.playername,
                    glga: playerData.glga,
                    glgaType: typeof playerData.glga,
                    glgaParsed: parseInt(playerData.glga),
                    goalsAgainstThisGame: goalsAgainstThisGame,
                    shutouts: shutouts,
                    fullData: playerData
                  });
                }

                existingStats.gamesPlayed++;
                existingStats.saves += parseInt(playerData.glsaves) || 0;
                // Use glshots from EASHL if available, otherwise calculate from saves + goals
                const shotsAgainstThisGame = (playerData.glshots !== undefined && playerData.glshots !== null)
                  ? (parseInt(playerData.glshots) || 0)
                  : ((parseInt(playerData.glsaves) || 0) + (parseInt(playerData.glga) || 0));
                existingStats.shotsAgainst += shotsAgainstThisGame;
                existingStats.goalsAgainst += parseInt(playerData.glga) || 0;
                // Calculate shutouts based on goals against (0 goals = 1 shutout)
                existingStats.shutouts += shutouts;
                existingStats.team = teamName;
                existingStats.teamLogo = teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png';
                existingStats.division = teamDivisionMap.get(teamName) || existingStats.division;
              });
            }
          });
        }
      });
      
      // Calculate derived stats for each goalie
      statsMap.forEach(goalie => {
        goalie.savePercentage = goalie.shotsAgainst > 0 ? 
          goalie.saves / goalie.shotsAgainst : 0;
        
        goalie.goalsAgainstAverage = goalie.gamesPlayed > 0 ? 
          goalie.goalsAgainst / goalie.gamesPlayed : 0;
      });
      
      // Convert stats map to grouped stats
      const allGoalieStats = Array.from(statsMap.values());
      
      // For "All Seasons", show as one combined table
      this.groupedStats = [{
        division: 'All Seasons',
        divisionData: undefined, // No specific division for All Seasons
        stats: allGoalieStats.sort((a, b) => b.savePercentage - a.savePercentage || b.goalsAgainstAverage - a.goalsAgainstAverage)
      }];
      
      this.applyDivisionFilter();
      console.log('All Seasons combined stats:', this.groupedStats[0].stats.length, 'goalies');
        this.isLoading = false;
        // Force change detection for mobile rendering - use multiple calls
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        // Additional delayed change detection for mobile
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 50);
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 100);
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 300);
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 500);
      return;
    }
    
    // For specific season, we need to be strict about which teams are included
    const currentSeason = this.seasons.find(s => s._id === this.selectedSeasonId);
    
    // Create a set of teams that are officially in the selected season
    const seasonTeams = new Set<string>();
    this.allClubs.forEach(club => {
      const seasonInfo = club.seasons?.find((s: ClubSeasonInfo) => {
        if (typeof s.seasonId === 'object' && s.seasonId._id) {
          return s.seasonId._id === this.selectedSeasonId;
        } else if (typeof s.seasonId === 'string') {
          return s.seasonId === this.selectedSeasonId;
        }
        return false;
      });
      if (seasonInfo) {
        seasonTeams.add(club.name);
      }
    });
    console.log('Official teams in season:', Array.from(seasonTeams));
    
    // Create a map of team names to their logos from all matches
    matches.forEach(match => {
      if (match.homeTeam) teamLogoMap.set(match.homeTeam, this.getImageUrl(match.homeClub?.logoUrl));
      if (match.awayTeam) teamLogoMap.set(match.awayTeam, this.getImageUrl(match.awayClub?.logoUrl));
    });
    
    matches.forEach(match => {
      console.log('Processing match:', match.id, 'Home:', match.homeTeam, 'Away:', match.awayTeam);
      console.log('Match eashlData:', match.eashlData);
      
      // Check if this is a manual stats entry
      if (match.eashlData?.manualEntry && match.eashlData?.players) {
        console.log('Processing manual stats for goalies in match:', match.id);
        console.log('Manual stats eashlData.players:', match.eashlData.players);
        
        // Process manual stats from eashlData.players (homeGoalies, awayGoalies)
        const { homeGoalies = [], awayGoalies = [] } = match.eashlData.players;
        
        console.log('Home goalies found:', homeGoalies.length);
        console.log('Away goalies found:', awayGoalies.length);
        
        // Process home goalies
        homeGoalies.forEach((player: any) => {
          if (!player || !player.gamertag) return;
          
          console.log('Processing home goalie:', player.gamertag, 'position:', player.position, 'isGoalie:', this.isGoalie(player.position));
          
          // Only process goalies
          if (!this.isGoalie(player.position)) return;
          
          const teamName = match.homeTeam;
          
          console.log('Home goalie team name:', teamName, 'Season teams:', Array.from(seasonTeams));
          console.log('Match homeTeam:', match.homeTeam, 'Match awayTeam:', match.awayTeam);
          
          // Check if team is in the selected season (try exact match first, then partial match)
          let isTeamInSeason = seasonTeams.has(teamName);
          
          if (!isTeamInSeason) {
            // Try partial matching for team names
            for (const seasonTeam of seasonTeams) {
              if (teamName.includes(seasonTeam) || seasonTeam.includes(teamName)) {
                console.log(`Found partial team match: ${teamName} matches ${seasonTeam}`);
                isTeamInSeason = true;
                break;
              }
            }
          }
          
          if (!isTeamInSeason) {
            console.log('Skipping team', teamName, '- not in selected season');
            return;
          }
          
          // Use a combination of name and team for unique identification since playerId might be 0
          const playerKey = `${player.gamertag}_${teamName}`;
          let existingStats = statsMap.get(playerKey);
          
          if (!existingStats) {
            existingStats = {
              playerId: parseInt(player.playerId) || 0,
              name: player.gamertag,
              team: teamName,
              teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
              number: parseInt(player.number) || 0,
              division: teamDivisionMap.get(teamName) || 'Unknown',
              gamesPlayed: 0,
              saves: 0,
              shotsAgainst: 0,
              goalsAgainst: 0,
              shutouts: 0,
              savePercentage: 0,
              goalsAgainstAverage: 0
            };
            statsMap.set(playerKey, existingStats);
          }
          
          if (existingStats) {
            console.log(`Updating home goalie stats for ${player.gamertag}:`, {
              saves: player.saves,
              shotsAgainst: player.shotsAgainst,
              goalsAgainst: player.goalsAgainst,
              shutout: player.shutout
            });
            
            // Special debug for Vxxlle
            if (player.gamertag && player.gamertag.includes('Vxxlle')) {
              console.log('🔍 VXXLLE HOME GOALIE DEBUG:', {
                name: player.gamertag,
                saves: player.saves,
                shotsAgainst: player.shotsAgainst,
                goalsAgainst: player.goalsAgainst,
                shutout: player.shutout,
                fullData: player
              });
            }
            
            existingStats.gamesPlayed++;
            existingStats.saves += parseInt(player.saves) || 0;
            existingStats.shotsAgainst += parseInt(player.shotsAgainst) || 0;
            existingStats.goalsAgainst += parseInt(player.goalsAgainst) || 0;
            existingStats.shutouts += parseInt(player.shutout) || 0;
            existingStats.team = teamName;
            existingStats.teamLogo = teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png';
            existingStats.division = teamDivisionMap.get(teamName) || existingStats.division;
            
            console.log(`Updated stats for ${player.gamertag}:`, {
              gamesPlayed: existingStats.gamesPlayed,
              saves: existingStats.saves,
              shotsAgainst: existingStats.shotsAgainst,
              goalsAgainst: existingStats.goalsAgainst
            });
          }
        });
        
        // Process away goalies
        awayGoalies.forEach((player: any) => {
          if (!player || !player.gamertag) return;
          
          console.log('Processing away goalie:', player.gamertag, 'position:', player.position, 'isGoalie:', this.isGoalie(player.position));
          
          // Only process goalies
          if (!this.isGoalie(player.position)) return;
          
          const teamName = match.awayTeam;
          
          console.log('Away goalie team name:', teamName, 'Season teams:', Array.from(seasonTeams));
          console.log('Match homeTeam:', match.homeTeam, 'Match awayTeam:', match.awayTeam);
          
          // Check if team is in the selected season (try exact match first, then partial match)
          let isTeamInSeason = seasonTeams.has(teamName);
          
          if (!isTeamInSeason) {
            // Try partial matching for team names
            for (const seasonTeam of seasonTeams) {
              if (teamName.includes(seasonTeam) || seasonTeam.includes(teamName)) {
                console.log(`Found partial team match: ${teamName} matches ${seasonTeam}`);
                isTeamInSeason = true;
                break;
              }
            }
          }
          
          if (!isTeamInSeason) {
            console.log('Skipping team', teamName, '- not in selected season');
            return;
          }
          
          // Use a combination of name and team for unique identification since playerId might be 0
          const playerKey = `${player.gamertag}_${teamName}`;
          let existingStats = statsMap.get(playerKey);
          
          if (!existingStats) {
            existingStats = {
              playerId: parseInt(player.playerId) || 0,
              name: player.gamertag,
              team: teamName,
              teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
              number: parseInt(player.number) || 0,
              division: teamDivisionMap.get(teamName) || 'Unknown',
              gamesPlayed: 0,
              saves: 0,
              shotsAgainst: 0,
              goalsAgainst: 0,
              shutouts: 0,
              savePercentage: 0,
              goalsAgainstAverage: 0
            };
            statsMap.set(playerKey, existingStats);
          }
          
          if (existingStats) {
            console.log(`Updating away goalie stats for ${player.gamertag}:`, {
              saves: player.saves,
              shotsAgainst: player.shotsAgainst,
              goalsAgainst: player.goalsAgainst,
              shutout: player.shutout
            });
            
            // Special debug for Vxxlle
            if (player.gamertag && player.gamertag.includes('Vxxlle')) {
              console.log('🔍 VXXLLE AWAY GOALIE DEBUG:', {
                name: player.gamertag,
                saves: player.saves,
                shotsAgainst: player.shotsAgainst,
                goalsAgainst: player.goalsAgainst,
                shutout: player.shutout,
                fullData: player
              });
            }
            
            existingStats.gamesPlayed++;
            existingStats.saves += parseInt(player.saves) || 0;
            existingStats.shotsAgainst += parseInt(player.shotsAgainst) || 0;
            existingStats.goalsAgainst += parseInt(player.goalsAgainst) || 0;
            existingStats.shutouts += parseInt(player.shutout) || 0;
            existingStats.team = teamName;
            existingStats.teamLogo = teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png';
            existingStats.division = teamDivisionMap.get(teamName) || existingStats.division;
            
            console.log(`Updated stats for ${player.gamertag}:`, {
              gamesPlayed: existingStats.gamesPlayed,
              saves: existingStats.saves,
              shotsAgainst: existingStats.shotsAgainst,
              goalsAgainst: existingStats.goalsAgainst
            });
          }
        });
      } else if (match.eashlData?.players) {
        // Process EASHL data
        console.log('Found eashlData.players:', Object.keys(match.eashlData.players));
        
        Object.entries(match.eashlData.players).forEach(([clubId, clubPlayers]: [string, any]) => {
          console.log('Processing club ID:', clubId, 'Players:', clubPlayers);
          
          // Map club ID to team name
          let teamName = 'Unknown';
          if (match.homeClub?.eashlClubId === clubId) {
            teamName = match.homeClub.name;
          } else if (match.awayClub?.eashlClubId === clubId) {
            teamName = match.awayClub.name;
          }
          
          console.log('Mapped club ID', clubId, 'to team name:', teamName);
          
          // Only include goalies from teams officially in the selected season
          if (!seasonTeams.has(teamName)) {
            console.log('Skipping team', teamName, '- not in selected season');
            return;
          }
          
          if (typeof clubPlayers === 'object' && clubPlayers !== null) {
            Object.entries(clubPlayers).forEach(([playerId, playerData]: [string, any]) => {
              if (!playerData.position || !this.isGoalie(playerData.position)) {
                return; // Skip non-goalies or players without position
              }

              const playerName = playerData.playername || playerData.name || 'Unknown';
              
              // Find playerId by matching username
              const normalizedName = playerName.toLowerCase().trim();
              const dbPlayerId = usernameToPlayerId.get(normalizedName) || playerId; // Use EASHL playerId as fallback
              const primaryUsername = playerIdToPrimaryUsername.get(dbPlayerId) || playerName;
              
              // Use playerId as key to combine stats from multiple usernames
              const playerKey = dbPlayerId;
              let existingStats = statsMap.get(playerKey);

              if (!existingStats) {
                existingStats = {
                  playerId: parseInt(dbPlayerId) || 0,
                  name: primaryUsername,
                  team: teamName,
                  teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
                  number: parseInt(playerData.jerseynum) || 0,
                  division: teamDivisionMap.get(teamName) || 'Unknown',
                  gamesPlayed: 0,
                  saves: 0,
                  shotsAgainst: 0,
                  goalsAgainst: 0,
                  shutouts: 0,
                  savePercentage: 0,
                  goalsAgainstAverage: 0
                };
                statsMap.set(playerKey, existingStats);
              }

              if (existingStats) {
                existingStats.gamesPlayed++;
                existingStats.saves += parseInt(playerData.glsaves) || 0;
                // Use glshots from EASHL if available, otherwise calculate from saves + goals
                const shotsAgainstThisGame = (playerData.glshots !== undefined && playerData.glshots !== null)
                  ? (parseInt(playerData.glshots) || 0)
                  : ((parseInt(playerData.glsaves) || 0) + (parseInt(playerData.glga) || 0));
                existingStats.shotsAgainst += shotsAgainstThisGame;
                existingStats.goalsAgainst += parseInt(playerData.glga) || 0;
                // Use EA's shutout field if available, otherwise calculate based on goals against
                const goalsAgainstThisGame = parseInt(playerData.glga) || 0;
                const shutouts = parseInt(playerData.glso) || ((goalsAgainstThisGame === 0) ? 1 : 0);
                existingStats.shutouts += shutouts;
                existingStats.team = teamName;
                existingStats.teamLogo = teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png';
                existingStats.division = teamDivisionMap.get(teamName) || existingStats.division;
              }
            });
          }
        });
      } else {
        console.log('No eashlData.players found in match');
      }
    });
    
    console.log('Final goalie stats map:', statsMap.size, 'goalies');
    console.log('Final goalie stats details:', Array.from(statsMap.values()).map(g => ({
      name: g.name,
      team: g.team,
      gamesPlayed: g.gamesPlayed,
      saves: g.saves,
      shotsAgainst: g.shotsAgainst,
      shutouts: g.shutouts
    })));
    
    // Special debug for Vxxlle
    const vxxlleStats = Array.from(statsMap.values()).find(g => g.name.includes('Vxxlle'));
    if (vxxlleStats) {
      console.log('🔍 VXXLLE FINAL STATS:', vxxlleStats);
    }
    
    // Calculate derived stats for each goalie
    statsMap.forEach(goalie => {
      goalie.savePercentage = goalie.shotsAgainst > 0 ? 
        goalie.saves / goalie.shotsAgainst : 0;
      
      goalie.goalsAgainstAverage = goalie.gamesPlayed > 0 ? 
        goalie.goalsAgainst / goalie.gamesPlayed : 0;
    });
    
    const allGoalieStats = Array.from(statsMap.values());

    // Group stats by division for all seasons (including Summer Tourney)
    const divisionStatsMap = new Map<string, GoalieStats[]>();
    allGoalieStats.forEach(stat => {
      const divisionName = stat.division || 'Unassigned';
      if (!divisionStatsMap.has(divisionName)) {
        divisionStatsMap.set(divisionName, []);
      }
      divisionStatsMap.get(divisionName)!.push(stat);
    });

    this.groupedStats = Array.from(divisionStatsMap.entries()).map(([division, stats]) => {
      const divisionData = this.divisions.find(d => d.name === division);
      this.sortGoalieStats(stats, this.sortColumn, this.sortDirection);
      return { division, divisionData, stats };
    }).sort((a, b) => (a.divisionData?.order || 0) - (b.divisionData?.order || 0));
    
    this.applyDivisionFilter();
    console.log('Grouped by division:', this.groupedStats.length, 'groups');
    console.log('Division breakdown:', this.groupedStats.map(g => ({ division: g.division, goalies: g.stats.length })));
      this.isLoading = false;
      // Force change detection for mobile rendering - use multiple calls
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      // Additional delayed change detection for mobile
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 50);
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 100);
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 300);
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 500);
    },
    error: (error) => {
      // This should rarely be called now since we're using catchError in the pipe
      // But keep it as a safety net
      console.error('Unexpected error in goalie stats subscription:', error);
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  });
  }

  applyDivisionFilter(): void {
    if (this.selectedDivisionId === 'all-divisions') {
      this.filteredGroupedStats = [...this.groupedStats];
    } else {
      const selectedDivision = this.divisions.find(d => d._id === this.selectedDivisionId);
      if (selectedDivision) {
        this.filteredGroupedStats = this.groupedStats.filter(group => 
          group.division === selectedDivision.name
        );
      } else {
        this.filteredGroupedStats = [...this.groupedStats];
      }
    }
  }
  
  sortGoalieStats(stats: GoalieStats[], column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn = column;
    this.sortDirection = direction;
    
    stats.sort((a, b) => {
      let comparison = 0;
      
      switch (column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'team':
          comparison = a.team.localeCompare(b.team);
          break;
        case 'gamesPlayed':
          comparison = a.gamesPlayed - b.gamesPlayed;
          break;
        case 'saves':
          comparison = a.saves - b.saves;
          break;
        case 'shotsAgainst':
          comparison = a.shotsAgainst - b.shotsAgainst;
          break;
        case 'goalsAgainst':
          comparison = a.goalsAgainst - b.goalsAgainst;
          break;
        case 'shutouts':
          comparison = a.shutouts - b.shutouts;
          break;
        case 'savePercentage':
          comparison = a.savePercentage - b.savePercentage;
          break;
        case 'goalsAgainstAverage':
          // For GAA, lower is better, so invert the comparison
          comparison = b.goalsAgainstAverage - a.goalsAgainstAverage;
          break;
        default:
          comparison = a.savePercentage - b.savePercentage;
      }
      
      // Apply sorting direction
      return direction === 'asc' ? comparison : -comparison;
    });
  }
  
  // Handle column header click for sorting
  onSortColumn(column: string): void {
    // If clicking the same column, toggle direction
    const direction = this.sortColumn === column && this.sortDirection === 'desc' ? 'asc' : 'desc';
    
    this.groupedStats.forEach(group => {
      this.sortGoalieStats(group.stats, column, direction);
    });
  }
  
  getColumnSortClass(column: string): string {
    if (this.sortColumn !== column) {
      return 'sortable';
    }
    
    return this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
  }

  private isGoalie(position: string | undefined | null): boolean {
    if (!position) return false;
    const lowerPos = position.toLowerCase().replace(/\s/g, '');
    return lowerPos === 'g' || lowerPos === 'goalie' || lowerPos === 'goaltender';
  }

  private formatPosition(position: string): string {
    const lowerPos = position.toLowerCase().replace(/\s/g, '');
    if (lowerPos === 'g' || lowerPos === 'goalie' || lowerPos === 'goaltender') {
      return 'Goalie';
    }
    return position;
  }

  // Helper method to get the full image URL using the centralized service
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl, 'assets/images/1ithlwords.png');
  }

  // Handle image loading errors
  onImageError(event: any): void {
    console.log('Image failed to load, URL:', event.target.src);
    
    // Prevent infinite error loops - if we're already showing the default image, don't change it
    if (event.target.src.includes('square-default.png')) {
      console.log('Default image also failed to load, stopping error handling');
      return;
    }
    
    // Set the fallback image - use a path that will be treated as a local asset
    event.target.src = '/assets/images/square-default.png';
  }

  private isPlayoffGame(match: any): boolean {
    // Check if match is marked as playoff
    const isPlayoff = match.isPlayoff === true || match.isPlayoff === 'true' || match.isPlayoff === 1;
    
    // Check if match has playoff identifiers
    const hasPlayoffIds = match.playoffBracketId || match.playoffSeriesId || match.playoffRoundId;
    
    return isPlayoff || !!hasPlayoffIds;
  }

  onPlayoffFilterChange(): void {
    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        season: this.selectedSeasonId, 
        division: this.selectedDivisionId,
        playoffs: this.includePlayoffs
      },
      queryParamsHandling: 'merge'
    });
    
    // Reprocess stats with the new filter setting
    this.loadStatsForSeason();
  }
}
