import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Player } from '../store/models/models/player.interface';
import { ApiService } from '../store/services/api.service';
import { Club } from '../store/models/models/club.interface';
import { PositionPillComponent } from '../components/position-pill/position-pill.component';
import { ImageUrlService } from '../shared/services/image-url.service';
import { PlayerStatsService } from '../store/services/player-stats.service';
import { MatchService, EashlMatch } from '../store/services/match.service';

@Component({
  selector: 'app-player-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PositionPillComponent],
  templateUrl: './player-profile.component.html'
})
export class PlayerProfileComponent implements OnInit {
  player: Player | null = null;
  clubLogoMap: { [key: string]: string } = {};
  countryEmojiMap: { [key: string]: string } = {};
  error: string | null = null;
  loading: boolean = true;
  careerStats: any[] = [];
  careerTotals: any = {};
  loadingCareerStats: boolean = false;
  gameByGameStats: any[] = [];
  loadingGameStats: boolean = false;
  allClubs: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private playerStatsService: PlayerStatsService,
    private matchService: MatchService,
    private imageUrlService: ImageUrlService
  ) {}

  // Method to get the full image URL using the centralized service
  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl);
  }

  // Method to get club logo URL by club name
  getClubLogoUrl(clubName: string): string {
    console.log('getClubLogoUrl called for:', clubName);
    console.log('allClubs available:', this.allClubs);
    
    const club = this.allClubs.find(club => club.name === clubName);
    console.log('Found club for', clubName, ':', club);
    
    if (club?.logoUrl) {
      const logoUrl = this.getImageUrl(club.logoUrl);
      console.log('Logo URL for', clubName, ':', logoUrl);
      return logoUrl;
    }
    
    console.log('No logo found for', clubName, '- using default');
    return 'assets/images/1ithlwords.png';
  }

  // Method to get all clubs the player has played for
  getCareerClubs(): any[] {
    if (!this.allClubs || this.allClubs.length === 0) {
      return [];
    }
    
    // Get unique club names from career stats
    const careerClubNames = new Set<string>();
    this.careerStats.forEach(stat => {
      if (stat.clubName) {
        careerClubNames.add(stat.clubName);
      }
    });
    
    // Filter allClubs to only include clubs the player has played for
    const careerClubs = this.allClubs.filter(club => 
      careerClubNames.has(club.name)
    );
    
    console.log('Career clubs found:', careerClubs);
    return careerClubs;
  }

  // Method to navigate to club detail page
  navigateToClub(clubId: string): void {
    if (clubId) {
      console.log('Navigating to club:', clubId);
      this.router.navigate(['/clubs', clubId]);
    }
  }

  ngOnInit(): void {
    this.buildCountryEmojiMap();
    const playerId = this.route.snapshot.paramMap.get('id');
    if (playerId) {
      this.loadPlayerData(playerId);
    } else {
      this.error = 'Player ID not found in URL.';
      this.loading = false;
    }
  }

  buildCountryEmojiMap() {
    const countries = [
      { name: 'USA', emoji: '🇺🇸' }, { name: 'Canada', emoji: '🇨🇦' },
      { name: 'Albania', emoji: '🇦🇱' }, { name: 'Andorra', emoji: '🇦🇩' }, { name: 'Austria', emoji: '🇦🇹' }, 
      { name: 'Belarus', emoji: '🇧🇾' }, { name: 'Belgium', emoji: '🇧🇪' }, { name: 'Bosnia and Herzegovina', emoji: '🇧🇦' },
      { name: 'Bulgaria', emoji: '🇧🇬' }, { name: 'Croatia', emoji: '🇭🇷' }, { name: 'Czechia', emoji: '🇨🇿' },
      { name: 'Denmark', emoji: '🇩🇰' }, { name: 'Estonia', emoji: '🇪🇪' }, { name: 'Finland', emoji: '🇫🇮' },
      { name: 'France', emoji: '🇫🇷' }, { name: 'Germany', emoji: '🇩🇪' }, { name: 'Greece', emoji: '🇬🇷' },
      { name: 'Hungary', emoji: '🇭🇺' }, { name: 'Iceland', emoji: '🇮🇸' }, { name: 'Ireland', 'emoji': '🇮🇪' },
      { name: 'Italy', emoji: '🇮🇹' }, { name: 'Latvia', emoji: '🇱🇻' }, { name: 'Liechtenstein', emoji: '🇱🇮' },
      { name: 'Lithuania', emoji: '🇱🇹' }, { name: 'Luxembourg', emoji: '🇱🇺' }, { name: 'Malta', emoji: '🇲🇹' },
      { name: 'Moldova', emoji: '🇲🇩' }, { name: 'Monaco', emoji: '🇲🇨' }, { name: 'Montenegro', emoji: '🇲🇪' },
      { name: 'Netherlands', emoji: '🇳🇱' }, { name: 'North Macedonia', emoji: '🇲🇰' }, { name: 'Norway', emoji: '🇳🇴' },
      { name: 'Poland', emoji: '🇵🇱' }, { name: 'Portugal', emoji: '🇵🇹' }, { name: 'Romania', emoji: '🇷🇴' },
      { name: 'Russia', emoji: '🇷🇺' }, { name: 'Serbia', emoji: '🇷🇸' }, { name: 'Slovakia', emoji: '🇸🇰' },
      { name: 'Slovenia', emoji: '🇸🇮' }, { name: 'Spain', emoji: '🇪🇸' }, { name: 'Sweden', emoji: '🇸🇪' },
      { name: 'Switzerland', emoji: '🇨🇭' }, { name: 'Ukraine', emoji: '🇺🇦' }, { name: 'United Kingdom', emoji: '🇬🇧' }
    ];
    countries.forEach(c => this.countryEmojiMap[c.name] = c.emoji);
  }

  loadPlayerData(id: string) {
    this.loading = true;
    this.error = null;

    this.apiService.getUser(id).subscribe({
      next: (user: any) => {
        if (!user) {
          this.error = 'Player not found.';
          this.loading = false;
          return;
        }
        
        const profile = user.playerProfile || {};
        this.player = {
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
          stats: {
            playerId: user._id,
            gamesPlayed: 0,
            goals: 0,
            assists: 0,
            points: 0,
            plusMinus: 0,
            pim: 0,
            ppg: 0,
            shg: 0,
            gwg: 0,
            shots: 0,
            shotPct: 0,
            hits: 0,
            takeaways: 0,
            giveaways: 0,
            faceoffPct: 0,
            blockedShots: 0,
            savePercentage: 0,
            goalsAgainst: 0,
            gaa: 0,
            goalsAgainstAverage: 0,
            shutouts: 0,
            wins: 0,
            losses: 0,
            otl: 0
          },
          secondaryPositions: profile.secondaryPositions || [],
          // clubLogo will be loaded next
        };

        // Load actual player statistics from games
        this.playerStatsService.getPlayerStats(user._id, user.gamertag).subscribe({
          next: (playerStats) => {
            console.log('Player stats loaded:', playerStats);
            if (this.player) {
              this.player.stats = playerStats;
            }
          },
          error: (err) => {
            console.error('Error loading player stats:', err);
            // Keep the default stats if there's an error
          }
        });

        // If the user has a club, fetch the club details to get the logo
        if (this.player.currentClubId) {
          this.apiService.getClub(this.player.currentClubId).subscribe({
            next: (club: Club) => {
              if (this.player) {
                this.player.clubLogo = this.getImageUrl(club.logoUrl);
              }
            },
            // It's not critical if the logo fails to load, so we just log the error
            error: (err: any) => console.error('Error loading club logo:', err)
          });
        }
        
        // Load career statistics first, then game-by-game stats
        this.loadCareerStats(user);
        
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load player data. You may not have permission to view this profile.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadCareerStats(user: any) {
    this.loadingCareerStats = true;
    
    // Get all clubs to check which ones the user has played for
    this.apiService.getClubs().subscribe({
      next: (clubs) => {
        // Store all clubs for logo lookup
        this.allClubs = clubs;
        
        const userCareerStats: any[] = [];
        let totals = {
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          goals: 0,
          assists: 0,
          points: 0,
          plusMinus: 0,
          pim: 0,
          shots: 0,
          hits: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          faceoffsWon: 0,
          faceoffsLost: 0,
          blockedShots: 0,
          interceptions: 0,
          takeaways: 0,
          giveaways: 0,
          deflections: 0,
          penaltiesDrawn: 0,
          shotAttempts: 0,
          shotPct: 0,
          passAttempts: 0,
          passesCompleted: 0,
          toi: 0,
          savePercentage: 0,
          goalsAgainst: 0,
          shutouts: 0
        };

        console.log('Clubs loaded for career stats:', clubs);
        
        // Check each club for user's participation
        clubs.forEach((club: any) => {
          console.log(`Checking club: ${club.name}`, club);
          if (club.seasons && Array.isArray(club.seasons)) {
            console.log(`Club ${club.name} has ${club.seasons.length} seasons:`, club.seasons);
            club.seasons.forEach((season: any) => {
              console.log(`Season data:`, season);
              if (season.roster && Array.isArray(season.roster)) {
                const userInRoster = season.roster.some((rosterUserId: any) => 
                  rosterUserId.toString() === user._id.toString()
                );
                
                if (userInRoster) {
                  // User played for this club in this season
                  let seasonName = 'Unknown Season';
                  console.log('Season ID data:', season.seasonId);
                  console.log('Club data:', club);
                  
                  // Get season name from the actual season data
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
                  
                  console.log('Final season name:', seasonName);
                  
                  const seasonStats = {
                    seasonName: seasonName,
                    clubName: club.name,
                    clubLogo: this.getImageUrl(club.logoUrl),
                    seasonId: typeof season.seasonId === 'object' ? season.seasonId._id : season.seasonId,
                    stats: {
                      gamesPlayed: 0,
                      wins: 0,
                      losses: 0,
                      goals: 0,
                      assists: 0,
                      points: 0,
                      plusMinus: 0,
                      pim: 0,
                      shots: 0,
                      hits: 0,
                      ppg: 0,
                      shg: 0,
                      gwg: 0,
                      faceoffsWon: 0,
                      faceoffsLost: 0,
                      blockedShots: 0,
                      interceptions: 0,
                      takeaways: 0,
                      giveaways: 0,
                      deflections: 0,
                      penaltiesDrawn: 0,
                      shotAttempts: 0,
                      shotPct: 0,
                      passAttempts: 0,
                      passesCompleted: 0,
                      toi: 0
                    }
                  };
                  
                  userCareerStats.push(seasonStats);
                }
              }
            });
          }
        });

        // Now fetch the actual player stats and update the career data
        this.playerStatsService.getPlayerStats(user._id, user.gamertag).subscribe({
          next: (playerStats) => {
            console.log('Career stats loaded:', playerStats);
            
            // Update career totals with real stats
            if (playerStats) {
              totals.gamesPlayed = playerStats.gamesPlayed || 0;
              totals.wins = playerStats.wins || 0;
              totals.losses = playerStats.losses || 0;
              totals.goals = playerStats.goals || 0;
              totals.assists = playerStats.assists || 0;
              totals.points = playerStats.points || 0;
              totals.plusMinus = playerStats.plusMinus || 0;
              totals.pim = playerStats.pim || 0;
              totals.shots = playerStats.shots || 0;
              totals.hits = playerStats.hits || 0;
              totals.ppg = playerStats.ppg || 0;
              totals.shg = playerStats.shg || 0;
              totals.gwg = playerStats.gwg || 0;
              totals.faceoffsWon = playerStats.faceoffsWon || 0;
              totals.faceoffsLost = playerStats.faceoffsLost || 0;
              totals.blockedShots = playerStats.blockedShots || 0;
              totals.interceptions = playerStats.interceptions || 0;
              totals.takeaways = playerStats.takeaways || 0;
              totals.giveaways = playerStats.giveaways || 0;
              totals.deflections = playerStats.deflections || 0;
              totals.penaltiesDrawn = playerStats.penaltiesDrawn || 0;
              totals.shotAttempts = playerStats.shotAttempts || 0;
              totals.shotPct = playerStats.shotPct || 0;
              totals.passAttempts = playerStats.passAttempts || 0;
              totals.passesCompleted = playerStats.passes || 0;
              totals.toi = playerStats.toi || 0;
              totals.savePercentage = playerStats.savePercentage || 0;
              totals.goalsAgainst = playerStats.goalsAgainst || 0;
              totals.shutouts = playerStats.shutouts || 0;
            }
            
            // Show all teams the player is rostered on, but assign real stats to the team they actually played for
            if (totals.gamesPlayed > 0 && userCareerStats.length > 0) {
              // Find the team where the player actually played (has real stats)
              // For now, we'll assign stats to the first team, but this should be improved
              // to check actual game data to determine which team gets which stats
              const activeTeamSeason = userCareerStats.find(season => 
                season.clubName.toLowerCase().includes('team infernus') ||
                season.clubName.toLowerCase().includes('infernus')
              ) || userCareerStats[0]; // Fallback to first team
              
              if (activeTeamSeason) {
                // Assign all real stats to the active team season
                activeTeamSeason.stats = {
                  gamesPlayed: totals.gamesPlayed,
                  wins: totals.wins,
                  losses: totals.losses,
                  goals: totals.goals,
                  assists: totals.assists,
                  points: totals.points,
                  plusMinus: totals.plusMinus,
                  pim: totals.pim,
                  shots: totals.shots,
                  hits: totals.hits,
                  ppg: totals.ppg || 0,
                  shg: totals.shg || 0,
                  gwg: totals.gwg || 0,
                  faceoffsWon: totals.faceoffsWon || 0,
                  faceoffsLost: totals.faceoffsLost || 0,
                  blockedShots: totals.blockedShots || 0,
                  interceptions: totals.interceptions || 0,
                  takeaways: totals.takeaways || 0,
                  giveaways: totals.giveaways || 0,
                  deflections: totals.deflections || 0,
                  penaltiesDrawn: totals.penaltiesDrawn || 0,
                  shotAttempts: totals.shotAttempts || 0,
                  shotPct: totals.shotPct || 0,
                  passAttempts: totals.passAttempts || 0,
                  passesCompleted: totals.passesCompleted || 0,
                  toi: totals.toi || 0
                };
              }
              
                          // Show all teams (including others with 0 stats)
            this.careerStats = this.sortSeasonsByDate(userCareerStats);
          } else {
            // No real stats, show all teams with 0 stats
            this.careerStats = this.sortSeasonsByDate(userCareerStats);
          }
            
            this.careerTotals = totals;
            this.loadingCareerStats = false;
            
            // Now that career stats are loaded, load game-by-game stats
            this.loadGameByGameStats(user);
          },
          error: (err) => {
            console.error('Error loading player stats for career:', err);
            // Use the basic career data without real stats
            this.careerStats = this.sortSeasonsByDate(userCareerStats);
            this.careerTotals = totals;
            this.loadingCareerStats = false;
            
            // Still try to load game-by-game stats even if career stats fail
            this.loadGameByGameStats(user);
          }
        });
      },
      error: (err) => {
        console.error('Error loading career stats:', err);
        this.loadingCareerStats = false;
      }
    });
  }

  loadGameByGameStats(user: any) {
    this.loadingGameStats = true;
    
    this.matchService.getMatches().subscribe({
      next: (matches) => {
        const playerGames: any[] = [];
        
        matches.forEach(match => {
          if (!match.eashlData || !match.eashlData.players) {
            return;
          }
          
          // Check if this is a manual stats entry
          const isManualEntry = match.eashlData.manualEntry;
          
          if (isManualEntry) {
            // Process manual stats: players are stored with a 'team' field
            Object.entries(match.eashlData.players).forEach(([playerId, playerData]: [string, any]) => {
              if (playerData.playername === user.gamertag || playerData.name === user.gamertag) {
                const teamName = playerData.team === 'home' ? match.homeTeam : match.awayTeam;
                const opponentName = playerData.team === 'home' ? match.awayTeam : match.homeTeam;
                
                const gameStats = {
                  date: match.date,
                  homeTeam: match.homeTeam,
                  awayTeam: match.awayTeam,
                  homeScore: match.homeScore,
                  awayScore: match.homeScore,
                  team: teamName,
                  opponent: opponentName,
                  teamLogoUrl: this.getClubLogoUrl(teamName),
                  opponentLogoUrl: this.getClubLogoUrl(opponentName),
                  result: this.getGameResult(playerData.team === 'home' ? match.homeScore : match.awayScore, 
                                           playerData.team === 'home' ? match.awayScore : match.homeScore),
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
                shotPercentage: this.calculateShotPercentage(parseInt(playerData.skgoals) || 0, parseInt(playerData.skshots) || 0),
                passAttempts: parseInt(playerData.skpassattempts) || 0,
                passes: parseInt(playerData.skpasses) || 0,
                timeOnIce: parseInt(playerData.sktoi) || 0,
                position: playerData.position
              };
                playerGames.push(gameStats);
              }
            });
          } else {
            // Process EASHL data: players are organized by club ID
            Object.entries(match.eashlData.players).forEach(([clubId, clubPlayers]: [string, any]) => {
              if (typeof clubPlayers === 'object' && clubPlayers !== null) {
                Object.values(clubPlayers).forEach((playerData: any) => {
                  if (playerData.playername === user.gamertag) {
                    // Determine team name from club ID
                    let teamName = 'Unknown';
                    let opponentName = 'Unknown';
                    if (match.homeClub?.eashlClubId === clubId) {
                      teamName = match.homeTeam;
                      opponentName = match.awayTeam;
                    } else if (match.awayClub?.eashlClubId === clubId) {
                      teamName = match.awayTeam;
                      opponentName = match.homeTeam;
                    }
                    
                    const gameStats = {
                      date: match.date,
                      homeTeam: match.homeTeam,
                      awayTeam: match.awayTeam,
                      homeScore: match.homeScore,
                      awayScore: match.awayScore,
                      team: teamName,
                      opponent: opponentName,
                      teamLogoUrl: this.getClubLogoUrl(teamName),
                      opponentLogoUrl: this.getClubLogoUrl(opponentName),
                      result: this.getGameResult(teamName === match.homeTeam ? match.homeScore : match.awayScore,
                                               teamName === match.homeTeam ? match.awayScore : match.homeScore),
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
                      shotPercentage: this.calculateShotPercentage(parseInt(playerData.skgoals) || 0, parseInt(playerData.skshots) || 0),
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
        });
        
        // Sort games by date (most recent first)
        this.gameByGameStats = playerGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.loadingGameStats = false;
      },
      error: (err) => {
        console.error('Error loading game-by-game stats:', err);
        this.loadingGameStats = false;
      }
    });
  }

  private getGameResult(teamScore: number, opponentScore: number): string {
    if (teamScore > opponentScore) {
      return 'W';
    } else if (teamScore < opponentScore) {
      return 'L';
    } else {
      return 'T';
    }
  }

  formatGameDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    });
  }

  calculateShotPercentage(goals: number, shots: number): number {
    if (shots === 0) return 0;
    return parseFloat(((goals / shots) * 100).toFixed(1));
  }

  formatTimeOnIce(seconds: number): string {
    if (!seconds || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getTeamLogo(team: string): string {
    if (!team) return 'assets/images/square-default.png';
    const teamMap: { [key: string]: string } = {
      'roosters': 'square-iserlohnroosters.png',
      // Add more mappings as needed
    };
    const key = team.replace(/\s+/g, '').toLowerCase();
    if (teamMap[key]) {
      return 'assets/images/' + teamMap[key];
    }
    return 'assets/images/square-' + key + '.png';
  }

  private sortSeasonsByDate(seasons: any[]): any[] {
    return seasons.sort((a, b) => {
      // Extract season number from season name (e.g., "S2024" -> 2024)
      const getSeasonNumber = (seasonName: string): number => {
        const match = seasonName.match(/S(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const seasonA = getSeasonNumber(a.seasonName);
      const seasonB = getSeasonNumber(b.seasonName);
      
      // Sort newest to oldest (descending order)
      return seasonB - seasonA;
    });
  }
}
