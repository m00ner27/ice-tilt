import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchService, EashlMatch } from '../store/services/match.service';
import { RouterModule } from '@angular/router';
import { ApiService } from '../store/services/api.service'; // Import ApiService
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { ImageUrlService } from '../shared/services/image-url.service';

// Define interfaces for Season and Division
interface Season {
  _id: string;
  name: string;
  endDate: string; // Added endDate for Season
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

interface PlayerStats {
  playerId: number;
  name: string;
  team: string;
  teamLogo?: string;
  number: number;
  position: string;
  positionCounts: { [position: string]: number }; // Track position frequency
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  
  // Basic stats
  shots: number; // Shots on goal
  hits: number; // Hits
  blockedShots: number; // Blocked shots
  penaltyMinutes: number; // Penalty minutes
  timeOnIce: string; // Time on ice
  
  // Special situation goals
  powerPlayGoals: number; // PPG
  shortHandedGoals: number; // SHG
  gameWinningGoals: number; // GWG
  
  // Possession stats
  takeaways: number;
  giveaways: number;
  interceptions: number; // New stat from EA
  
  // Passing stats
  passAttempts: number;
  passes: number;
  passPercentage: number;
  
  // Shooting stats
  shotPercentage: number;
  
  // Faceoff stats
  faceoffsWon: number;
  faceoffsLost: number;
  faceoffPercentage: number;
  
  // Advanced stats
  playerScore: number; // Overall player performance score
  possession: number; // Time of possession
  penaltyKillCorsiZone: number; // PKCZ - Penalty Kill Corsi Zone
  
  // Additional EA stats
  penaltyAssists: number; // Penalty assists (if tracked)
  
  division?: string;
}

// Grouped stats structure
interface GroupedPlayerStats {
  division: string;
  divisionData?: Division;
  stats: PlayerStats[];
}

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // Add FormsModule
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.css'
})
export class PlayerStatsComponent implements OnInit {
  allMatches: EashlMatch[] = [];
  allClubs: Club[] = []; // Store clubs with type
  divisions: Division[] = [];
  groupedStats: GroupedPlayerStats[] = [];
  filteredGroupedStats: GroupedPlayerStats[] = [];
  seasons: Season[] = [];
  selectedSeasonId: string | null = null;
  selectedDivisionId: string = 'all-divisions';
  
  isLoading: boolean = true;
  sortColumn: string = 'points'; // Default sort by points
  sortDirection: 'asc' | 'desc' = 'desc'; // Default sort direction
  
  constructor(
    private matchService: MatchService,
    private apiService: ApiService, // Inject ApiService
    private imageUrlService: ImageUrlService
  ) { }
  
  ngOnInit(): void {
    this.loadInitialData();
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
        this.seasons = seasons.sort((a, b) => {
          const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
          const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
          return dateB - dateA;
        });
        
        if (this.seasons.length > 0) {
          this.selectedSeasonId = 'all-seasons'; // Default to "All Seasons"
          this.loadStatsForSeason(); // Initial stat load
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
    this.loadStatsForSeason();
  }

  onDivisionChange(): void {
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
          this.divisions = divisions;
          this.filterAndAggregateStats();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load all divisions', err);
          this.isLoading = false;
        }
      });
    } else {
      // Load divisions for specific season
      this.apiService.getDivisionsBySeason(this.selectedSeasonId).subscribe({
        next: (divisions) => {
          this.divisions = divisions;
          this.filterAndAggregateStats();
          this.isLoading = false;
        },
        error: (err) => {
          console.error(`Failed to load divisions for season ${this.selectedSeasonId}`, err);
          this.isLoading = false;
        }
      });
    }
  }

  filterAndAggregateStats(): void {
    if (this.selectedSeasonId === 'all-seasons') {
      // For "All Seasons", include all teams and all matches
      const allTeams = new Set<string>();
      this.allClubs.forEach(club => {
        allTeams.add(club.name);
      });
      
      // Use all matches for "All Seasons"
      const filteredMatches = this.allMatches;
      
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
      
      // Process stats for all matches
      this.aggregatePlayerStats(filteredMatches, teamDivisionMap);
      return;
    }

    const season = this.seasons.find(s => s._id === this.selectedSeasonId);
    if (!season) {
      this.groupedStats = [];
      return;
    }

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
    
    // Filter matches to only include those from the specific season
    const filteredMatches = this.allMatches.filter(match => {
      // Check if the match belongs to the selected season
      if (match.seasonId && match.seasonId === this.selectedSeasonId) {
        // Also ensure at least one team is officially in this season
        const homeTeamInSeason = match.homeClub?.name && seasonTeams.has(match.homeClub.name);
        const awayTeamInSeason = match.awayClub?.name && seasonTeams.has(match.awayClub.name);
        return homeTeamInSeason || awayTeamInSeason;
      }
      return false;
    });
    
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
    
    // Process stats for the filtered matches
    this.aggregatePlayerStats(filteredMatches, teamDivisionMap);
  }
  
  aggregatePlayerStats(matches: EashlMatch[], teamDivisionMap: Map<string, string>): void {
    const statsMap = new Map<number, PlayerStats>();
    const teamLogoMap = new Map<string, string | undefined>();

    // For "All Seasons", include all teams
    if (this.selectedSeasonId === 'all-seasons') {
      const allTeams = new Set<string>();
      this.allClubs.forEach(club => {
        allTeams.add(club.name);
      });
      
      // Create a map of team names to their logos from all matches
      matches.forEach(match => {
        if (match.homeTeam) teamLogoMap.set(match.homeTeam, this.getImageUrl(match.homeClub?.logoUrl));
        if (match.awayTeam) teamLogoMap.set(match.awayTeam, this.getImageUrl(match.awayClub?.logoUrl));
      });
      
      matches.forEach(match => {
        // Check if this is a manual stats entry
        const isManualEntry = match.eashlData?.manualEntry;
        

        
        if (isManualEntry) {
          // Process manual stats: players are processed by match service and stored in match.playerStats
          if (match.playerStats && match.playerStats.length > 0) {
            console.log('📝 Processing manual stats from match.playerStats:', match.playerStats.length, 'players');
            match.playerStats.forEach((playerData: any) => {
              if (!playerData.position || this.isGoalie(playerData.position)) {
                return; // Skip goalies or players without position
              }

              // Team name is already determined by match service
              const teamName = playerData.team || 'Unknown';
              const playerName = playerData.name || 'Unknown';
              
              console.log(`👤 Processing manual player: ${playerName}`, {
                goals: playerData.goals,
                assists: playerData.assists,
                position: playerData.position,
                team: teamName
              });
              
              // Try to find existing player by name first, then by ID
              let existingKey = null;
              for (const [key, stats] of Array.from(statsMap.entries())) {
                if (stats.name === playerName) {
                  existingKey = key;
                  break;
                }
              }
              
              const playerKey = existingKey || playerName;
              let existingStats = statsMap.get(playerKey);

              if (!existingStats) {
                existingStats = {
                  playerId: playerKey,
                  name: playerName,
                  team: teamName,
                  teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
                  number: 0, // Manual stats don't have jersey numbers
                  position: this.formatPosition(playerData.position),
                  positionCounts: { [this.formatPosition(playerData.position)]: 1 },
                  division: teamDivisionMap.get(teamName) || 'Unknown',
                  gamesPlayed: 0,
                  goals: 0,
                  assists: 0,
                  points: 0,
                  plusMinus: 0,
                  shots: 0,
                  hits: 0,
                  blockedShots: 0,
                  penaltyMinutes: 0,
                  timeOnIce: '0:00',
                  powerPlayGoals: 0,
                  shortHandedGoals: 0,
                  gameWinningGoals: 0,
                  takeaways: 0,
                  giveaways: 0,
                  interceptions: 0,
                  passAttempts: 0,
                  passes: 0,
                  passPercentage: 0,
                  shotPercentage: 0,
                  faceoffsWon: 0,
                  faceoffsLost: 0,
                  faceoffPercentage: 0,
                  playerScore: 0,
                  possession: 0,
                  penaltyKillCorsiZone: 0,
                  penaltyAssists: 0
                };
                statsMap.set(playerKey, existingStats);
              }

              existingStats.gamesPlayed++;
              
              // Track position frequency and update to most common position
              const currentPos = this.formatPosition(playerData.position);
              existingStats.positionCounts[currentPos] = (existingStats.positionCounts[currentPos] || 0) + 1;
              existingStats.position = this.getMostCommonPosition(existingStats.positionCounts);
              
              existingStats.goals += parseInt(playerData.goals) || 0;
              existingStats.assists += parseInt(playerData.assists) || 0;
              existingStats.points = existingStats.goals + existingStats.assists;
              existingStats.plusMinus += parseInt(playerData.plusMinus) || 0;
              

              
              existingStats.shots += parseInt(playerData.shots) || 0;
              existingStats.hits += parseInt(playerData.hits) || 0;
              existingStats.blockedShots += parseInt(playerData.blockedShots) || 0;
              existingStats.penaltyMinutes += parseInt(playerData.penaltyMinutes) || 0;
              existingStats.timeOnIce = playerData.timeOnIce || '0:00';
              existingStats.powerPlayGoals += parseInt(playerData.powerPlayGoals) || 0;
              existingStats.shortHandedGoals += parseInt(playerData.shortHandedGoals) || 0;
              existingStats.gameWinningGoals += parseInt(playerData.gameWinningGoals) || 0;
              existingStats.takeaways += parseInt(playerData.takeaways) || 0;
              existingStats.giveaways += parseInt(playerData.giveaways) || 0;
              existingStats.interceptions += parseInt(playerData.interceptions) || 0;
              existingStats.passAttempts += parseInt(playerData.passAttempts) || 0;
              existingStats.passes += parseInt(playerData.passes) || 0;
              existingStats.playerScore += parseInt(playerData.score) || 0;
              existingStats.possession += parseInt(playerData.possession) || 0;
              existingStats.faceoffsWon += parseInt(playerData.faceoffsWon) || 0;
              existingStats.faceoffsLost += parseInt(playerData.faceoffsLost) || 0;
              existingStats.penaltyKillCorsiZone += parseInt(playerData.penaltyKillCorsiZone) || 0;
              existingStats.penaltyAssists += parseInt(playerData.penaltyAssists) || 0;
            });
          }
        } else {
          // Process EASHL data: players are organized by club ID
          if (match.eashlData?.players) {
            Object.entries(match.eashlData.players).forEach(([clubId, clubPlayers]: [string, any]) => {
              // Map club ID to team name
              let teamName = 'Unknown';
              if (match.homeClub?.eashlClubId === clubId) {
                teamName = match.homeClub.name;
              } else if (match.awayClub?.eashlClubId === clubId) {
                teamName = match.awayClub.name;
              }
              
              // For "All Seasons", include all teams
              if (typeof clubPlayers === 'object' && clubPlayers !== null) {
                Object.entries(clubPlayers).forEach(([playerId, playerData]: [string, any]) => {
                  if (!playerData.position || this.isGoalie(playerData.position)) {
                    return; // Skip goalies or players without position
                  }


                  const playerIdNum = parseInt(playerId);
                  let existingStats = statsMap.get(playerIdNum);

                  if (!existingStats) {
                existingStats = {
                  playerId: playerIdNum,
                  name: playerData.playername || 'Unknown',
                  team: teamName,
                  teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
                  number: parseInt(playerData.jerseynum) || 0,
                  position: this.formatPosition(playerData.position),
                  positionCounts: { [this.formatPosition(playerData.position)]: 1 },
                  division: teamDivisionMap.get(teamName) || 'Unknown',
                  gamesPlayed: 0,
                  goals: 0,
                  assists: 0,
                  points: 0,
                  plusMinus: 0,
                  shots: 0,
                  hits: 0,
                  blockedShots: 0,
                  penaltyMinutes: 0,
                  timeOnIce: playerData.sktoi || '0:00',
                  powerPlayGoals: 0,
                  shortHandedGoals: 0,
                  gameWinningGoals: 0,
                  takeaways: 0,
                  giveaways: 0,
                  interceptions: 0,
                  passAttempts: 0,
                  passes: 0,
                  passPercentage: 0,
                  shotPercentage: 0,
                  faceoffsWon: 0,
                  faceoffsLost: 0,
                  faceoffPercentage: 0,
                  playerScore: 0,
                  possession: 0,
                  penaltyKillCorsiZone: 0,
                  penaltyAssists: 0
                };
                    statsMap.set(playerIdNum, existingStats);
                  }

                  existingStats.gamesPlayed++;
                  
                  // Track position frequency and update to most common position
                  const currentPos = this.formatPosition(playerData.position);
                  existingStats.positionCounts[currentPos] = (existingStats.positionCounts[currentPos] || 0) + 1;
                  existingStats.position = this.getMostCommonPosition(existingStats.positionCounts);
                  
                  existingStats.goals += parseInt(playerData.skgoals) || 0;
                  existingStats.assists += parseInt(playerData.skassists) || 0;
                  existingStats.points += (parseInt(playerData.skgoals) || 0) + (parseInt(playerData.skassists) || 0);
                  existingStats.plusMinus += parseInt(playerData.skplusmin) || 0;
                  


                  
                  existingStats.shots += parseInt(playerData.skshots) || 0;
                  existingStats.hits += parseInt(playerData.skhits) || 0;
                  existingStats.blockedShots += parseInt(playerData.skbs) || 0;
                  existingStats.penaltyMinutes += parseInt(playerData.skpim) || 0;
                  existingStats.timeOnIce = playerData.sktoi || '0:00';
                  existingStats.powerPlayGoals += parseInt(playerData.skppg) || 0;
                  existingStats.shortHandedGoals += parseInt(playerData.skshg) || 0;
                  existingStats.gameWinningGoals += parseInt(playerData.skgwg) || 0;
                  existingStats.takeaways += parseInt(playerData.sktakeaways) || 0;
                  existingStats.giveaways += parseInt(playerData.skgiveaways) || 0;
                  existingStats.interceptions += parseInt(playerData.skinterceptions) || 0;
                  existingStats.passAttempts += parseInt(playerData.skpassattempts) || 0;
                  existingStats.passes += parseInt(playerData.skpasses) || 0;
                  existingStats.playerScore += parseInt(playerData.score) || 0;
                  existingStats.possession += parseInt(playerData.skpossession) || 0;
                  existingStats.faceoffsWon += parseInt(playerData.skfow) || 0;
                  existingStats.faceoffsLost += parseInt(playerData.skfol) || 0;
                  existingStats.penaltyKillCorsiZone += parseInt(playerData.skpkc) || 0;
                  // Penalty assists not available in EASHL data
                  existingStats.penaltyAssists += 0;
                });
              }
            });
          }
        }
      });
      
      // Calculate percentages and ensure points are calculated correctly for all players
      statsMap.forEach(player => {
        player.points = player.goals + player.assists;
        
        // Calculate percentages
        if (player.shots > 0) {
          player.shotPercentage = parseFloat(((player.goals / player.shots) * 100).toFixed(1));
        }
        if (player.passAttempts > 0) {
          player.passPercentage = parseFloat(((player.passes / player.passAttempts) * 100).toFixed(1));
        }
        const totalFaceoffs = player.faceoffsWon + player.faceoffsLost;
        if (totalFaceoffs > 0) {
          player.faceoffPercentage = parseFloat(((player.faceoffsWon / totalFaceoffs) * 100).toFixed(1));
        }
      });
      
      // Convert stats map to grouped stats
      const allPlayerStats = Array.from(statsMap.values());
      
      // For "All Seasons", show as one combined table
      this.groupedStats = [{
        division: 'All Seasons',
        divisionData: undefined, // No specific division for All Seasons
        stats: allPlayerStats.sort((a, b) => b.points - a.points || b.goals - a.goals)
      }];
      
      this.applyDivisionFilter();
      return;
    }
    
    // For specific season, we need to be strict about which teams are included
    const selectedSeason = this.seasons.find(s => s._id === this.selectedSeasonId);
    
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
    
    // Create a map of team names to their logos from all matches
    matches.forEach(match => {
      if (match.homeTeam) teamLogoMap.set(match.homeTeam, this.getImageUrl(match.homeClub?.logoUrl));
      if (match.awayTeam) teamLogoMap.set(match.awayTeam, this.getImageUrl(match.awayClub?.logoUrl));
    });
    
    matches.forEach(match => {
      // Check if this is a manual stats entry
      const isManualEntry = match.eashlData?.manualEntry;
      
      if (isManualEntry) {
        // Process manual stats: players are stored with a 'team' field
        if (match.eashlData?.players) {
          Object.entries(match.eashlData.players).forEach(([playerId, playerData]: [string, any]) => {
            if (!playerData.position || this.isGoalie(playerData.position)) {
              return; // Skip goalies or players without position
            }

            // Determine team name from manual stats
            let teamName = 'Unknown';
            if (playerData.team === 'home') {
              teamName = match.homeTeam;
            } else if (playerData.team === 'away') {
              teamName = match.awayTeam;
            }

            // Only include players from teams officially in the selected season
            if (!seasonTeams.has(teamName)) {
              return;
            }

            const playerName = playerData.playername || playerData.name || 'Unknown';
            
            // Try to find existing player by name first, then by ID
            let existingKey = null;
            for (const [key, stats] of Array.from(statsMap.entries())) {
              if (stats.name === playerName) {
                existingKey = key;
                break;
              }
            }
            
            const playerKey = existingKey || playerName;
            let existingStats = statsMap.get(playerKey);

            if (!existingStats) {
              existingStats = {
                playerId: playerKey,
                name: playerName,
                team: teamName,
                teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
                number: 0, // Manual stats don't have jersey numbers
                position: this.formatPosition(playerData.position),
                positionCounts: { [this.formatPosition(playerData.position)]: 1 },
                division: teamDivisionMap.get(teamName) || 'Unknown',
                gamesPlayed: 0,
                goals: 0,
                assists: 0,
                points: 0,
                plusMinus: 0,
                shots: 0,
                hits: 0,
                blockedShots: 0,
                penaltyMinutes: 0,
                timeOnIce: '0:00',
                powerPlayGoals: 0,
                shortHandedGoals: 0,
                gameWinningGoals: 0,
                takeaways: 0,
                giveaways: 0,
                interceptions: 0,
                passAttempts: 0,
                passes: 0,
                passPercentage: 0,
                shotPercentage: 0,
                faceoffsWon: 0,
                faceoffsLost: 0,
                faceoffPercentage: 0,
                playerScore: 0,
                possession: 0,
                penaltyKillCorsiZone: 0,
                penaltyAssists: 0
              };
              statsMap.set(playerKey, existingStats);
            }

            existingStats.gamesPlayed++;
            
            // Track position frequency and update to most common position
            const currentPos = this.formatPosition(playerData.position);
            existingStats.positionCounts[currentPos] = (existingStats.positionCounts[currentPos] || 0) + 1;
            existingStats.position = this.getMostCommonPosition(existingStats.positionCounts);
            
            existingStats.goals += parseInt(playerData.skgoals) || 0;
            existingStats.assists += parseInt(playerData.skassists) || 0;
            existingStats.points = existingStats.goals + existingStats.assists;
            existingStats.plusMinus += parseInt(playerData.skplusmin) || 0;
            

            
            existingStats.shots += parseInt(playerData.skshots) || 0;
            existingStats.hits += parseInt(playerData.skhits) || 0;
            existingStats.blockedShots += parseInt(playerData.skblk) || 0;
            existingStats.penaltyMinutes += parseInt(playerData.skpim) || 0;
            existingStats.timeOnIce = playerData.sktoi || '0:00';
            existingStats.powerPlayGoals += parseInt(playerData.skppg) || 0;
            existingStats.shortHandedGoals += parseInt(playerData.skshg) || 0;
            existingStats.gameWinningGoals += parseInt(playerData.skgwg) || 0;
            existingStats.takeaways += parseInt(playerData.sktakeaways) || 0;
            existingStats.giveaways += parseInt(playerData.skgiveaways) || 0;
            existingStats.interceptions += parseInt(playerData.skint) || 0;
            existingStats.passAttempts += parseInt(playerData.skpassattempts) || 0;
            existingStats.passes += parseInt(playerData.skpasses) || 0;
            existingStats.playerScore += parseInt(playerData.score) || 0;
            existingStats.possession += parseInt(playerData.skpossession) || 0;
            existingStats.faceoffsWon += parseInt(playerData.skfow) || 0;
            existingStats.faceoffsLost += parseInt(playerData.skfol) || 0;
            existingStats.penaltyKillCorsiZone += parseInt(playerData.skpkc) || 0;
            existingStats.penaltyAssists += 0 // Penalty assists not available in EASHL data;
            
            existingStats.team = teamName;
            existingStats.teamLogo = teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png';
            existingStats.division = teamDivisionMap.get(teamName) || existingStats.division;
          });
        }
      } else {
        // Process EASHL data: players are organized by club ID
        if (match.eashlData?.players) {
          Object.entries(match.eashlData.players).forEach(([clubId, clubPlayers]: [string, any]) => {
            // Map club ID to team name
            let teamName = 'Unknown';
            if (match.homeClub?.eashlClubId === clubId) {
              teamName = match.homeClub.name;
            } else if (match.awayClub?.eashlClubId === clubId) {
              teamName = match.awayClub.name;
            }
            
            // Only include players from teams officially in the selected season
            if (!seasonTeams.has(teamName)) {
              return;
            }
            
            if (typeof clubPlayers === 'object' && clubPlayers !== null) {
              Object.entries(clubPlayers).forEach(([playerId, playerData]: [string, any]) => {
                if (!playerData.position || this.isGoalie(playerData.position)) {
                  return; // Skip goalies or players without position
                }

                const playerIdNum = parseInt(playerId);
                let existingStats = statsMap.get(playerIdNum);

                if (!existingStats) {
                  existingStats = {
                    playerId: playerIdNum,
                    name: playerData.playername || 'Unknown',
                    team: teamName,
                    teamLogo: teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png',
                    number: parseInt(playerData.jerseynum) || 0,
                    position: this.formatPosition(playerData.position),
                    positionCounts: { [this.formatPosition(playerData.position)]: 1 },
                    division: teamDivisionMap.get(teamName) || 'Unknown',
                    gamesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    points: 0,
                    plusMinus: 0,
                    shots: 0,
                    hits: 0,
                    blockedShots: 0,
                    penaltyMinutes: 0,
                    timeOnIce: playerData.sktoi || '0:00',
                    powerPlayGoals: 0,
                    shortHandedGoals: 0,
                    gameWinningGoals: 0,
                    takeaways: 0,
                    giveaways: 0,
                    interceptions: 0,
                    passAttempts: 0,
                    passes: 0,
                    passPercentage: 0,
                    shotPercentage: 0,
                    faceoffsWon: 0,
                    faceoffsLost: 0,
                    faceoffPercentage: 0,
                    playerScore: 0,
                    possession: 0,
                    penaltyKillCorsiZone: 0,
                    penaltyAssists: 0
                  };
                  statsMap.set(playerIdNum, existingStats);
                }

                existingStats.gamesPlayed++;
                
                // Track position frequency and update to most common position
                const currentPos = this.formatPosition(playerData.position);
                existingStats.positionCounts[currentPos] = (existingStats.positionCounts[currentPos] || 0) + 1;
                existingStats.position = this.getMostCommonPosition(existingStats.positionCounts);
                
                existingStats.goals += parseInt(playerData.skgoals) || 0;
                existingStats.assists += parseInt(playerData.skassists) || 0;
                existingStats.points = existingStats.goals + existingStats.assists;
                existingStats.plusMinus += parseInt(playerData.skplusmin) || 0;
                
                // Process all available EASHL stats
                existingStats.shots += parseInt(playerData.skshots) || 0;
                existingStats.hits += parseInt(playerData.skhits) || 0;
                existingStats.blockedShots += parseInt(playerData.skblk) || 0;
                existingStats.penaltyMinutes += parseInt(playerData.skpim) || 0;
                existingStats.timeOnIce = playerData.sktoi || '0:00';
                existingStats.powerPlayGoals += parseInt(playerData.skppg) || 0;
                existingStats.shortHandedGoals += parseInt(playerData.skshg) || 0;
                existingStats.gameWinningGoals += parseInt(playerData.skgwg) || 0;
                existingStats.takeaways += parseInt(playerData.sktakeaways) || 0;
                existingStats.giveaways += parseInt(playerData.skgiveaways) || 0;
                existingStats.interceptions += parseInt(playerData.skint) || 0;
                existingStats.passAttempts += parseInt(playerData.skpassattempts) || 0;
                existingStats.passes += parseInt(playerData.skpasses) || 0;
                existingStats.playerScore += parseInt(playerData.score) || 0;
                existingStats.possession += parseInt(playerData.skpossession) || 0;
                existingStats.faceoffsWon += parseInt(playerData.skfow) || 0;
                existingStats.faceoffsLost += parseInt(playerData.skfol) || 0;
                existingStats.penaltyKillCorsiZone += parseInt(playerData.skpkc) || 0;
                existingStats.penaltyAssists += 0 // Penalty assists not available in EASHL data;
                
                existingStats.team = teamName;
                existingStats.teamLogo = teamLogoMap.get(teamName) || 'assets/images/1ithlwords.png';
                existingStats.division = teamDivisionMap.get(teamName) || existingStats.division;
              });
            }
          });
        }
      }
    });
    
    const allPlayerStats = Array.from(statsMap.values());
    
    // Group stats by division for all seasons (including Summer Tourney)
    const divisionStatsMap = new Map<string, PlayerStats[]>();
    allPlayerStats.forEach(stat => {
      const divisionName = stat.division || 'Unassigned';
      if (!divisionStatsMap.has(divisionName)) {
        divisionStatsMap.set(divisionName, []);
      }
      divisionStatsMap.get(divisionName)!.push(stat);
    });
    
    this.groupedStats = Array.from(divisionStatsMap.entries()).map(([division, stats]) => {
      const divisionData = this.divisions.find(d => d.name === division);
      return { 
        division, 
        divisionData,
        stats: stats.sort((a, b) => b.points - a.points || b.goals - a.goals) 
      };
    }).sort((a, b) => (a.divisionData?.order || 0) - (b.divisionData?.order || 0));
    
    this.applyDivisionFilter();
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
  
  sortPlayerStats(stats: PlayerStats[], column: string, direction: 'asc' | 'desc'): void {
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
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
        case 'gamesPlayed':
          comparison = a.gamesPlayed - b.gamesPlayed;
          break;
        case 'goals':
          comparison = a.goals - b.goals;
          break;
        case 'assists':
          comparison = a.assists - b.assists;
          break;
        case 'points':
          comparison = a.points - b.points;
          break;
        case 'plusMinus':
          comparison = a.plusMinus - b.plusMinus;
          break;

        case 'shots':
          comparison = a.shots - b.shots;
          break;
        case 'hits':
          comparison = a.hits - b.hits;
          break;
        case 'blockedShots':
          comparison = a.blockedShots - b.blockedShots;
          break;
        case 'penaltyMinutes':
          comparison = a.penaltyMinutes - b.penaltyMinutes;
          break;
        case 'powerPlayGoals':
          comparison = a.powerPlayGoals - b.powerPlayGoals;
          break;
        case 'shortHandedGoals':
          comparison = a.shortHandedGoals - b.shortHandedGoals;
          break;
        case 'gameWinningGoals':
          comparison = a.gameWinningGoals - b.gameWinningGoals;
          break;
        case 'takeaways':
          comparison = a.takeaways - b.takeaways;
          break;
        case 'giveaways':
          comparison = a.giveaways - b.giveaways;
          break;
        case 'passAttempts':
          comparison = a.passAttempts - b.passAttempts;
          break;
        case 'passes':
          comparison = a.passes - b.passes;
          break;
        case 'passPercentage':
          comparison = a.passPercentage - b.passPercentage;
          break;
        case 'shotPercentage':
          comparison = a.shotPercentage - b.shotPercentage;
          break;
        case 'faceoffsWon':
          comparison = a.faceoffsWon - b.faceoffsWon;
          break;
        case 'faceoffPercentage':
          comparison = a.faceoffPercentage - b.faceoffPercentage;
          break;
        case 'interceptions':
          comparison = a.interceptions - b.interceptions;
          break;
        case 'timeOnIce':
          // Convert time format to minutes for comparison
          const timeA = this.parseTimeToMinutes(a.timeOnIce);
          const timeB = this.parseTimeToMinutes(b.timeOnIce);
          comparison = timeA - timeB;
          break;
        case 'penaltyAssists':
          comparison = a.penaltyAssists - b.penaltyAssists;
          break;
        default:
          comparison = a.points - b.points;
      }
      
      // Apply sorting direction
      return direction === 'asc' ? comparison : -comparison;
    });
  }
  
  // Handle column header click for sorting
  onSortColumn(column: string): void {
    // If clicking the same column, toggle direction
    const direction = this.sortColumn === column && this.sortDirection === 'desc' ? 'asc' : 'desc';
    
    // Sort the stats within each division group
    this.groupedStats.forEach(group => {
      this.sortPlayerStats(group.stats, column, direction);
    });
  }
  
  getColumnSortClass(column: string): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'desc' ? 'sort-desc' : 'sort-asc';
  }
  


  private isGoalie(position: string | undefined | null): boolean {
    if (!position) return false;
    const lowerPos = position.toLowerCase().replace(/\s/g, '');
    return lowerPos === 'g' || lowerPos === 'goalie' || lowerPos === 'goaltender';
  }

  formatPosition(position: string): string {
    const positionMap: { [key: string]: string } = {
      'center': 'C',
      'leftwing': 'LW',
      'rightwing': 'RW',
      'defenseman': 'D',
      'defensemen': 'D',
      'goaltender': 'G',
      'goalie': 'G'
    };
    const key = position.toLowerCase().replace(/\s/g, '');
    return positionMap[key] || position;
  }

  private getMostCommonPosition(positionCounts: { [position: string]: number }): string {
    let mostCommon = '';
    let maxCount = 0;
    
    for (const [position, count] of Object.entries(positionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = position;
      }
    }
    
    return mostCommon || 'Unknown';
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

  // Helper method to parse time format (e.g., "15:30") to total minutes
  private parseTimeToMinutes(timeStr: string): number {
    if (!timeStr || timeStr === '0:00' || timeStr === 'N/A') {
      return 0;
    }
    
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes + (seconds / 60);
    }
    
    return 0;
  }
}
