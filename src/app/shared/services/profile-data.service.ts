import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { AppState } from '../../store';
import { NgRxApiService } from '../../store/services/ngrx-api.service';
import { ApiService } from '../../store/services/api.service';
import { ImageUrlService } from './image-url.service';
import { StatsCalculationService } from './stats-calculation.service';
import { 
  ProfileState, 
  CareerSeasonStats, 
  PlayerSeasonStats, 
  GameStats, 
  ExtendedMatch 
} from '../interfaces/profile.interface';

// Import selectors
import * as UsersSelectors from '../../store/users.selectors';
import * as PlayersSelectors from '../../store/players.selectors';
import * as MatchesSelectors from '../../store/matches.selectors';

@Injectable({
  providedIn: 'root'
})
export class ProfileDataService {
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private apiService: ApiService,
    private imageUrlService: ImageUrlService,
    private statsService: StatsCalculationService
  ) {}

  /**
   * Load user profile data
   * @param userId - User ID from Auth0
   * @returns Observable of profile state
   */
  loadUserProfile(userId: string): Observable<ProfileState> {
    const state: ProfileState = {
      player: null,
      careerStats: [],
      careerTotals: this.statsService.getEmptyPlayerStats(),
      gameByGameStats: [],
      allClubs: [],
      loading: true,
      loadingCareerStats: false,
      loadingGameStats: false,
      error: null
    };

    return new Observable(observer => {
      // Use NgRx to sync with Auth0 and get user data
      this.ngrxApiService.auth0Sync();
      
      // Subscribe to the current user from the store
      this.store.select(UsersSelectors.selectCurrentUser).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (user: any) => {
          if (user) {
            this.loadPlayerData(user._id, user, state, observer);
          }
        },
        error: (err: any) => {
          console.error('Error fetching user profile:', err);
          state.error = 'Failed to load profile. Please try again.';
          state.loading = false;
          observer.next(state);
        }
      });
    });
  }

  /**
   * Load player data including stats and career information
   */
  private loadPlayerData(id: string, user: any, state: ProfileState, observer: any): void {
    state.loading = true;
    state.error = null;

    if (!user) {
      state.error = 'Player not found.';
      state.loading = false;
      observer.next(state);
      return;
    }
    
    const profile = user.playerProfile || {};
    state.player = {
      id: user._id,
      discordUsername: user.discordUsername || '',
      position: profile.position || 'C',
      number: profile.number || '',
      psnId: user.platform === 'PS5' ? user.gamertag : '',
      xboxGamertag: user.platform === 'Xbox' ? user.gamertag : '',
      gamertag: user.gamertag || '',
      country: profile.country || '',
      handedness: profile.handedness || 'Left',
      currentClubId: user.currentClubId || '',
      currentClubName: user.currentClubName || '',
      status: profile.status || 'Free Agent',
      stats: this.statsService.getEmptyPlayerStats(),
      secondaryPositions: profile.secondaryPositions || [],
    };

    // Load actual player statistics from games using NgRx
    this.ngrxApiService.loadPlayerStats(user._id, user.gamertag);
    
    // Subscribe to player stats from the store
    this.store.select(PlayersSelectors.selectPlayerStats).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats: any) => {
        if (stats && stats.length > 0) {
          state.careerTotals = this.statsService.calculatePlayerStatsTotals(stats);
          state.player!.stats = state.careerTotals;
        }
        state.loading = false;
        observer.next(state);
      },
      error: (error: any) => {
        console.error('Error loading player stats:', error);
        state.loading = false;
        observer.next(state);
      }
    });

    // Load all clubs for logo mapping
    this.apiService.getClubs().subscribe({
      next: (clubs: any[]) => {
        state.allClubs = clubs;
        observer.next(state);
      },
      error: (error: any) => {
        console.error('Error loading clubs:', error);
        observer.next(state);
      }
    });

    // Load career statistics and game-by-game stats
    this.loadCareerStats(user, state, observer);
    this.loadGameByGameStats(user, state, observer);
  }

  /**
   * Load career statistics for the player
   */
  private loadCareerStats(user: any, state: ProfileState, observer: any): void {
    state.loadingCareerStats = true;
    
    this.apiService.getClubs().subscribe({
      next: (clubs: any[]) => {
        state.allClubs = clubs;
        
        const userCareerStats: CareerSeasonStats[] = [];
        const totals = this.statsService.getEmptyPlayerStats();

        // Check each club for user's participation
        clubs.forEach((club: any) => {
          if (club.seasons && Array.isArray(club.seasons)) {
            club.seasons.forEach((season: any) => {
              if (season.roster && Array.isArray(season.roster)) {
                const userInRoster = season.roster.some((rosterUserId: any) => 
                  rosterUserId.toString() === user._id.toString()
                );
                
                if (userInRoster) {
                  const seasonName = this.getSeasonName(season);
                  
                  const seasonStats: CareerSeasonStats = {
                    seasonName: seasonName,
                    clubName: club.name,
                    clubLogo: this.imageUrlService.getImageUrl(club.logoUrl),
                    seasonId: typeof season.seasonId === 'object' ? season.seasonId._id : season.seasonId,
                    stats: this.statsService.getEmptyPlayerStats()
                  };
                  
                  userCareerStats.push(seasonStats);
                }
              }
            });
          }
        });

        // Load actual player stats and update career data
        this.ngrxApiService.loadPlayerStats(user._id, user.gamertag);
        
        this.store.select(PlayersSelectors.selectPlayerStats).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (playerStats) => {
            if (playerStats && Array.isArray(playerStats)) {
              const totalStats = this.statsService.calculatePlayerStatsTotals(playerStats);
              Object.assign(totals, totalStats);
            }
            
            // Assign stats to the active team season
            if (totals.gamesPlayed > 0 && userCareerStats.length > 0) {
              const activeTeamSeason = userCareerStats.find(season => 
                season.clubName.toLowerCase().includes('team infernus') ||
                season.clubName.toLowerCase().includes('infernus')
              ) || userCareerStats[0];
              
              if (activeTeamSeason) {
                activeTeamSeason.stats = totals;
              }
              
              state.careerStats = this.statsService.sortSeasonsByDate(userCareerStats);
            } else {
              state.careerStats = this.statsService.sortSeasonsByDate(userCareerStats);
            }
              
            state.careerTotals = totals;
            state.loadingCareerStats = false;
            observer.next(state);
          },
          error: (err: any) => {
            console.error('Error loading player stats for career:', err);
            state.careerStats = this.statsService.sortSeasonsByDate(userCareerStats);
            state.careerTotals = totals;
            state.loadingCareerStats = false;
            observer.next(state);
          }
        });
      },
      error: (err: any) => {
        console.error('Error loading career stats:', err);
        state.loadingCareerStats = false;
        observer.next(state);
      }
    });
  }

  /**
   * Load game-by-game statistics
   */
  private loadGameByGameStats(user: any, state: ProfileState, observer: any): void {
    state.loadingGameStats = true;
    
    this.ngrxApiService.loadMatches();
    
    this.store.select(MatchesSelectors.selectAllMatches).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (matches: any[]) => {
        const playerGames: GameStats[] = [];
        
        matches.forEach(match => {
          if (!match.eashlData || !match.eashlData.players) {
            return;
          }
          
          const isManualEntry = match.eashlData.manualEntry;
          
          if (isManualEntry) {
            this.processManualStats(match, user, playerGames, state.allClubs);
          } else {
            this.processEashlStats(match, user, playerGames, state.allClubs);
          }
        });
        
        state.gameByGameStats = playerGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        state.loadingGameStats = false;
        observer.next(state);
      },
      error: (err: any) => {
        console.error('Error loading game-by-game stats:', err);
        state.loadingGameStats = false;
        observer.next(state);
      }
    });
  }

  /**
   * Process manual stats entry
   */
  private processManualStats(match: ExtendedMatch, user: any, playerGames: GameStats[], allClubs: any[]): void {
    Object.entries(match.eashlData!.players).forEach(([playerId, playerData]: [string, any]) => {
      if (playerData.playername === user.gamertag || playerData.name === user.gamertag) {
        const teamName = playerData.team === 'home' ? match.homeTeam : match.awayTeam;
        const opponentName = playerData.team === 'home' ? match.awayTeam : match.homeTeam;
        
        const gameStats: GameStats = {
          date: match.date,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          team: teamName,
          opponent: opponentName,
          teamLogoUrl: this.imageUrlService.getClubLogoUrl(teamName, allClubs),
          opponentLogoUrl: this.imageUrlService.getClubLogoUrl(opponentName, allClubs),
          result: this.statsService.getGameResult(
            playerData.team === 'home' ? match.homeScore : match.awayScore, 
            playerData.team === 'home' ? match.awayScore : match.homeScore
          ),
          goals: parseInt(playerData.skgoals) || 0,
          assists: parseInt(playerData.skassists) || 0,
          points: (parseInt(playerData.skgoals) || 0) + (parseInt(playerData.skassists) || 0),
          plusMinus: parseInt(playerData.skplusmin) || 0,
          shots: parseInt(playerData.skshots) || 0,
          hits: parseInt(playerData.skhits) || 0,
          pim: parseInt(playerData.skpim) || 0,
          ppg: parseInt(playerData.skppg) || 0,
          shg: parseInt(playerData.skshg) || 0,
          gwg: parseInt(playerData.skgwg) || 0,
          faceoffsWon: parseInt(playerData.skfow) || 0,
          faceoffsLost: parseInt(playerData.skfol) || 0,
          blockedShots: parseInt(playerData.skblk) || 0,
          interceptions: parseInt(playerData.skint) || 0,
          takeaways: parseInt(playerData.sktakeaways) || 0,
          giveaways: parseInt(playerData.skgiveaways) || 0,
          deflections: parseInt(playerData.skdef) || 0,
          penaltiesDrawn: parseInt(playerData.skpd) || 0,
          shotAttempts: parseInt(playerData.sksa) || 0,
          shotPercentage: this.statsService.calculateShotPercentage(
            parseInt(playerData.skgoals) || 0, 
            parseInt(playerData.skshots) || 0
          ),
          passAttempts: parseInt(playerData.skpassattempts) || 0,
          passes: parseInt(playerData.skpasses) || 0,
          timeOnIce: parseInt(playerData.sktoi) || 0,
          position: playerData.position
        };
        playerGames.push(gameStats);
      }
    });
  }

  /**
   * Process EASHL stats entry
   */
  private processEashlStats(match: ExtendedMatch, user: any, playerGames: GameStats[], allClubs: any[]): void {
    Object.entries(match.eashlData!.players).forEach(([clubId, clubPlayers]: [string, any]) => {
      if (typeof clubPlayers === 'object' && clubPlayers !== null) {
        Object.values(clubPlayers).forEach((playerData: any) => {
          if (playerData.playername === user.gamertag) {
            let teamName = 'Unknown';
            let opponentName = 'Unknown';
            if (match.homeClub?.eashlClubId === clubId) {
              teamName = match.homeTeam;
              opponentName = match.awayTeam;
            } else if (match.awayClub?.eashlClubId === clubId) {
              teamName = match.awayTeam;
              opponentName = match.homeTeam;
            }
            
            const gameStats: GameStats = {
              date: match.date,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              team: teamName,
              opponent: opponentName,
              teamLogoUrl: this.imageUrlService.getClubLogoUrl(teamName, allClubs),
              opponentLogoUrl: this.imageUrlService.getClubLogoUrl(opponentName, allClubs),
              result: this.statsService.getGameResult(
                teamName === match.homeTeam ? match.homeScore : match.awayScore,
                teamName === match.homeTeam ? match.awayScore : match.homeScore
              ),
              goals: parseInt(playerData.skgoals) || 0,
              assists: parseInt(playerData.skassists) || 0,
              points: (parseInt(playerData.skgoals) || 0) + (parseInt(playerData.skassists) || 0),
              plusMinus: parseInt(playerData.skplusmin) || 0,
              shots: parseInt(playerData.skshots) || 0,
              hits: parseInt(playerData.skhits) || 0,
              pim: parseInt(playerData.skpim) || 0,
              ppg: parseInt(playerData.skppg) || 0,
              shg: parseInt(playerData.skshg) || 0,
              gwg: parseInt(playerData.skgwg) || 0,
              faceoffsWon: parseInt(playerData.skfow) || 0,
              faceoffsLost: parseInt(playerData.skfol) || 0,
              blockedShots: parseInt(playerData.skblk) || 0,
              interceptions: parseInt(playerData.skint) || 0,
              takeaways: parseInt(playerData.sktakeaways) || 0,
              giveaways: parseInt(playerData.skgiveaways) || 0,
              deflections: parseInt(playerData.skdef) || 0,
              penaltiesDrawn: parseInt(playerData.skpd) || 0,
              shotAttempts: parseInt(playerData.sksa) || 0,
              shotPercentage: this.statsService.calculateShotPercentage(
                parseInt(playerData.skgoals) || 0, 
                parseInt(playerData.skshots) || 0
              ),
              passAttempts: parseInt(playerData.skpassattempts) || 0,
              passes: parseInt(playerData.skpasses) || 0,
              timeOnIce: parseInt(playerData.sktoi) || 0,
              position: playerData.position
            };
            playerGames.push(gameStats);
          }
        });
      }
    });
  }

  /**
   * Get season name from season data
   */
  private getSeasonName(season: any): string {
    let seasonName = 'Unknown Season';
    
    if (season.seasonId) {
      if (typeof season.seasonId === 'object') {
        if (season.seasonId.name) {
          seasonName = season.seasonId.name;
        } else if (season.seasonId._id) {
          const idStr = season.seasonId._id.toString();
          if (idStr.length >= 4) {
            seasonName = `S${idStr.slice(-4)}`;
          } else {
            seasonName = `S${idStr}`;
          }
        }
      } else if (typeof season.seasonId === 'string') {
        if (season.seasonId.length >= 4) {
          seasonName = `S${season.seasonId.slice(-4)}`;
        } else {
          seasonName = `S${season.seasonId}`;
        }
      }
    }
    
    return seasonName;
  }

  /**
   * Get all clubs the player has played for
   */
  getCareerClubs(allClubs: any[], careerStats: CareerSeasonStats[]): any[] {
    if (!allClubs || allClubs.length === 0) {
      return [];
    }
    
    const careerClubNames = new Set<string>();
    careerStats.forEach(stat => {
      if (stat.clubName) {
        careerClubNames.add(stat.clubName);
      }
    });
    
    return allClubs.filter(club => careerClubNames.has(club.name));
  }

  /**
   * Clean up subscriptions
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
