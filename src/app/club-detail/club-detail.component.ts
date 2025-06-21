import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatchService, Match, PlayerMatchStats } from '../store/services/match.service';
import { ApiService } from '../store/services/api.service';
import { forkJoin } from 'rxjs';
import { MatchHistoryComponent } from './match-history/match-history.component';
import { Club, ClubStats } from '../store/models/models/club.interface';
import { Player } from '../store/models/models/player.interface';
import { PlayerStats } from '../store/models/models/player-stats.interface';

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

// Keep these stats interfaces as they're specific to this component
interface SkaterStats {
  playerId: number;
  name: string;
  number: number;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
}

interface GoalieStats {
  playerId: number;
  name: string;
  number: number;
  gamesPlayed: number;
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
  goals: 0,
  assists: 0,
  points: 0,
  plusMinus: 0
};

const DEFAULT_GOALIE_STATS: GoalieStats = {
  playerId: 0,
  name: '',
  number: 0,
  gamesPlayed: 0,
  savePercentage: 0,
  goalsAgainstAverage: 0,
  shutouts: 0
};

@Component({
  selector: 'app-club-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatchHistoryComponent],
  templateUrl: './club-detail.component.html',
  styleUrls: ['./club-detail.component.css']
})
export class ClubDetailComponent implements OnInit {
  club: Club | undefined;
  backendClub: BackendClub | undefined;
  matches: Match[] = [];
  skaterStats: SkaterStats[] = [];
  goalieStats: GoalieStats[] = [];
  loading: boolean = false;
  error: string | null = null;
  allClubs: BackendClub[] = [];
  
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
    private apiService: ApiService
  ) {}

  ngOnInit() {
    // Get the club ID from the URL
    this.route.params.subscribe(params => {
      const clubId = params['id'];
      this.loadClubData(clubId);
    });
  }

  private loadClubData(clubId: string) {
    this.loading = true;
    this.error = null;

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
              clubName: backendClub.name,
              image: backendClub.logoUrl || 'assets/images/default-team.png',
              manager: backendClub.manager,
              colour: backendClub.primaryColour || '#666',
              roster: [],
              stats: { ...this.defaultStats }
            };

            // First, load the roster and assign it to the club
            this.apiService.getClubRoster(clubId).subscribe({
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
                this.loadEashlGameData(clubId);
                
                this.loading = false;
              },
              error: (err) => {
                console.error('Error loading roster:', err);
                this.error = 'Failed to load roster';
                this.loading = false;
              }
            });
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

  private loadEashlGameData(clubId: string) {
    // Get all games for this club and process EASHL data
    this.apiService.getGames().subscribe({
      next: (games) => {
        const clubGames = games.filter((game: any) => 
          (game.homeClubId === clubId || game.awayClubId === clubId) && 
          game.eashlData
        );
        
        if (this.club && clubGames.length > 0) {
          // Map games to the Match[] interface for the history component
          this.matches = clubGames.map(game => {
            const homeClub = this.allClubs.find(c => c._id === game.homeClubId);
            const awayClub = this.allClubs.find(c => c._id === game.awayClubId);

            const playerStats: PlayerMatchStats[] = [];
            if (game.eashlData?.players) {
              Object.entries(game.eashlData.players).forEach(([clubEashlId, clubPlayers]: [string, any]) => {
                Object.entries(clubPlayers).forEach(([eaPlayerId, playerData]: [string, any]) => {
                  let teamName = 'Unknown';
                  if (homeClub && String(clubEashlId) === String(homeClub.eashlClubId)) {
                    teamName = homeClub.name;
                  } else if (awayClub && String(clubEashlId) === String(awayClub.eashlClubId)) {
                    teamName = awayClub.name;
                  }
                  playerStats.push({
                    playerId: parseInt(eaPlayerId),
                    name: playerData.playername,
                    team: teamName,
                    number: 0, // Jersey number not available in this part of the API
                    position: playerData.position,
                    goals: parseInt(playerData.skgoals) || 0,
                    assists: parseInt(playerData.skassists) || 0,
                    plusMinus: parseInt(playerData.skplusmin) || 0,
                    saves: parseInt(playerData.glsaves) || 0,
                    shotsAgainst: parseInt(playerData.glshots) || 0,
                    goalsAgainst: parseInt(playerData.glga) || 0,
                    shutout: 0 // Shutout data not available in this part of the API
                  });
                });
              });
            }

            return {
              id: game._id,
              homeTeam: homeClub?.name || 'Unknown',
              awayTeam: awayClub?.name || 'Unknown',
              homeScore: game.score?.home || 0,
              awayScore: game.score?.away || 0,
              date: game.date,
              isOvertime: false, 
              isShootout: false,
              playerStats: playerStats
            } as Match;
          });

          // Calculate and assign overall team stats
          this.club.stats = this.calculateTeamStats(clubGames, clubId);
          // Process and assign individual player stats
          this.processEashlPlayerStats(clubGames, clubId);
        }
      },
      error: (err) => {
        console.error('Error loading EASHL game data:', err);
      }
    });
  }

  private calculateTeamStats(games: any[], clubId: string): CalculatedClubStats {
    const stats: CalculatedClubStats = {
      wins: 0,
      losses: 0,
      otLosses: 0, // EASHL API doesn't provide OT/SO loss distinction, so this will be 0
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
    const sortedGames = [...games].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedGames.forEach(game => {
      if (!game.score) return;

      stats.gamesPlayed++;
      let gameResult: 'W' | 'L' | 'OTL' = 'L';
      const isHomeTeam = game.homeClubId === clubId;

      if (isHomeTeam) {
        stats.goalsFor += game.score.home;
        stats.goalsAgainst += game.score.away;
        if (game.score.home > game.score.away) {
          stats.wins++;
          gameResult = 'W';
        } else {
          stats.losses++;
        }
      } else { // Away team
        stats.goalsFor += game.score.away;
        stats.goalsAgainst += game.score.home;
        if (game.score.away > game.score.home) {
          stats.wins++;
          gameResult = 'W';
        } else {
          stats.losses++;
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

    stats.points = stats.wins * 2; // Simple points calculation
    stats.winPercentage = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;
    stats.goalDifferential = stats.goalsFor - stats.goalsAgainst;

    // Note: Streak calculation is simplified as a full implementation is complex.
    // This can be enhanced later if needed.

    return stats;
  }

  private processEashlPlayerStats(games: any[], clubId: string) {
    const playerStatsMap = new Map<string, any>();
    const pageClubEashlId = this.backendClub?.eashlClubId;

    if (!pageClubEashlId) {
      console.error("Club detail page is missing the eashlClubId, cannot process player stats.");
      return;
    }
    
    games.forEach(game => {
      // The 'players' object is keyed by club ID.
      if (game.eashlData?.players && game.eashlData.players[pageClubEashlId]) {
        const clubPlayers = game.eashlData.players[pageClubEashlId];

        // Now, clubPlayers is an object where keys are player IDs
        Object.entries(clubPlayers).forEach(([eaPlayerId, playerData]: [string, any]) => {
          if (!playerStatsMap.has(eaPlayerId)) {
            playerStatsMap.set(eaPlayerId, {
              playerId: eaPlayerId,
              name: playerData.playername || 'Unknown',
              number: 0, // Jersey number not available in this part of the API
              position: playerData.position || 'Unknown',
              gamesPlayed: 0,
              goals: 0,
              assists: 0,
              points: 0,
              plusMinus: 0,
              savePercentage: 0,
              goalsAgainstAverage: 0,
              shutouts: 0
            });
          }
          
          const stats = playerStatsMap.get(eaPlayerId);
          stats.gamesPlayed++;
          
          if (playerData.position.toLowerCase() === 'goalie') {
            stats.savePercentage += parseFloat(playerData.glsavepct) || 0;
            stats.goalsAgainstAverage += parseFloat(playerData.glgaa) || 0;
            // Shutout data not available
          } else {
            stats.goals += parseInt(playerData.skgoals) || 0;
            stats.assists += parseInt(playerData.skassists) || 0;
            stats.points = stats.goals + stats.assists;
            stats.plusMinus += parseInt(playerData.skplusmin) || 0;
          }
        });
      }
    });
    
    // Post-process goalie stats for averages
    playerStatsMap.forEach(stats => {
      if (stats.position.toLowerCase() === 'goalie' && stats.gamesPlayed > 0) {
        stats.savePercentage = stats.savePercentage / stats.gamesPlayed;
        stats.goalsAgainstAverage = stats.goalsAgainstAverage / stats.gamesPlayed;
      }
    });

    // Convert maps to arrays for display
    this.skaterStats = Array.from(playerStatsMap.values())
      .filter(player => player.position.toLowerCase() !== 'goalie');
      
    this.goalieStats = Array.from(playerStatsMap.values())
      .filter(player => player.position.toLowerCase() === 'goalie');
  }

  get signedPlayers(): Player[] {
    if (!this.club || !this.club.roster) {
      return [];
    }
    return this.club.roster.filter(player => player.status === 'Signed');
  }
}
