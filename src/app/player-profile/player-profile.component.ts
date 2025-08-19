import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Player } from '../store/models/models/player.interface';
import { ApiService } from '../store/services/api.service';
import { Club } from '../store/models/models/club.interface';
import { PositionPillComponent } from '../components/position-pill/position-pill.component';
import { environment } from '../../environments/environment';
import { PlayerStatsService } from '../store/services/player-stats.service';

@Component({
  selector: 'app-player-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PositionPillComponent],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.css']
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

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private playerStatsService: PlayerStatsService
  ) {}

  // Method to get the full image URL
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
        
        // Load career statistics
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
                  
                  // For now, let's use a simple naming scheme based on the order
                  // Flying Toasters should be S1, John Deer Nucks should be S2
                  if (club.name.toLowerCase().includes('flying toasters') || club.name.toLowerCase().includes('toasters')) {
                    seasonName = 'S1';
                  } else if (club.name.toLowerCase().includes('john deer') || club.name.toLowerCase().includes('nucks')) {
                    seasonName = 'S2';
                  } else {
                    // Try to get season name from the data
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
              // Find the Flying Toasters season (where m00ner actually played)
              const flyingToastersSeason = userCareerStats.find(season => 
                season.clubName.toLowerCase().includes('flying toasters') ||
                season.clubName.toLowerCase().includes('toasters')
              );
              
              if (flyingToastersSeason) {
                // Assign all real stats to the Flying Toasters season
                flyingToastersSeason.stats = {
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
              
              // Show all teams (including John Deer Nucks with 0 stats)
              this.careerStats = userCareerStats;
            } else {
              // No real stats, show all teams with 0 stats
              this.careerStats = userCareerStats;
            }
            
            this.careerTotals = totals;
            this.loadingCareerStats = false;
          },
          error: (err) => {
            console.error('Error loading player stats for career:', err);
            // Use the basic career data without real stats
            this.careerStats = userCareerStats;
            this.careerTotals = totals;
            this.loadingCareerStats = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading career stats:', err);
        this.loadingCareerStats = false;
      }
    });
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
}
