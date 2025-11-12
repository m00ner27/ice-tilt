import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';
import { Player } from '../store/models/models/player.interface';
import { Club } from '../store/models/models/club.interface';
import { PositionPillComponent } from '../components/position-pill/position-pill.component';
import { ImageUrlService } from '../shared/services/image-url.service';

// Import selectors
import * as UsersSelectors from '../store/users.selectors';
import * as ClubsSelectors from '../store/clubs.selectors';
import * as SeasonsSelectors from '../store/seasons.selectors';
import * as MatchesSelectors from '../store/matches.selectors';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PositionPillComponent
  ],
  templateUrl: './players.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observable selectors
  users$: Observable<any[]>;
  clubs$: Observable<Club[]>;
  seasons$: Observable<any[]>;
  matches$: Observable<any[]>;
  usersLoading$: Observable<boolean>;
  usersError$: Observable<any>;
  
  // Local state for filtering
  filteredPlayers: Player[] = [];
  clubLogoMap: { [key: string]: string } = {};
  countryEmojiMap: { [key: string]: string } = {};
  statusFilter: 'All' | 'Free Agent' | 'Signed' | 'Pending' = 'All';
  positionFilter: 'All' | 'Forward' | 'Defense' | 'Goalie' = 'All';
  secondaryPositionFilter: 'All' | 'Forward' | 'Defense' | 'Goalie' = 'All';
  regionFilter: 'All' | 'North America' | 'Europe' = 'All';
  seasonFilter: string = '';
  searchTerm: string = '';
  
  positionGroupMap: { [key: string]: string } = {
    'C': 'Forward', 'LW': 'Forward', 'RW': 'Forward',
    'LD': 'Defense', 'RD': 'Defense',
    'G': 'Goalie'
  };
  
  // Region mapping for countries
  regionMap: { [key: string]: string } = {
    'USA': 'North America', 'Canada': 'North America',
    'Albania': 'Europe', 'Andorra': 'Europe', 'Austria': 'Europe', 
    'Belarus': 'Europe', 'Belgium': 'Europe', 'Bosnia and Herzegovina': 'Europe',
    'Bulgaria': 'Europe', 'Croatia': 'Europe', 'Czechia': 'Europe',
    'Denmark': 'Europe', 'Estonia': 'Europe', 'Finland': 'Europe',
    'France': 'Europe', 'Germany': 'Europe', 'Greece': 'Europe',
    'Hungary': 'Europe', 'Iceland': 'Europe', 'Ireland': 'Europe',
    'Italy': 'Europe', 'Latvia': 'Europe', 'Liechtenstein': 'Europe',
    'Lithuania': 'Europe', 'Luxembourg': 'Europe', 'Malta': 'Europe',
    'Moldova': 'Europe', 'Monaco': 'Europe', 'Montenegro': 'Europe',
    'Netherlands': 'Europe', 'North Macedonia': 'Europe', 'Norway': 'Europe',
    'Poland': 'Europe', 'Portugal': 'Europe', 'Romania': 'Europe',
    'Russia': 'Europe', 'Serbia': 'Europe', 'Slovakia': 'Europe',
    'Slovenia': 'Europe', 'Spain': 'Europe', 'Sweden': 'Europe',
    'Switzerland': 'Europe', 'Ukraine': 'Europe', 'United Kingdom': 'Europe'
  };

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService,
    private imageUrlService: ImageUrlService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize selectors
    this.users$ = this.store.select(UsersSelectors.selectAllUsers);
    this.clubs$ = this.store.select(ClubsSelectors.selectAllClubs);
    this.seasons$ = this.store.select(SeasonsSelectors.selectAllSeasons);
    this.matches$ = this.store.select(MatchesSelectors.selectAllMatches);
    this.usersLoading$ = this.store.select(UsersSelectors.selectUsersLoading);
    this.usersError$ = this.store.select(UsersSelectors.selectUsersError);
  }

  ngOnInit() {
    this.buildCountryEmojiMap();
    
    // Load data using NgRx (only load what's needed)
    this.ngrxApiService.loadUsers();
    
    // Subscribe to data changes
    this.setupDataSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDataSubscriptions() {
    // Subscribe to seasons to set default filter
    this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
      if (seasons.length > 0 && !this.seasonFilter) {
        this.seasonFilter = seasons[0].name;
      }
    });

    // Subscribe to clubs to build logo map
    this.clubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
      clubs.forEach(club => {
        if (club.name && club.logoUrl) {
          this.clubLogoMap[club.name.toLowerCase()] = this.getImageUrl(club.logoUrl);
        }
      });
    });

    // Combine users, clubs, and seasons to process player data
    combineLatest([
      this.users$,
      this.clubs$,
      this.seasons$
    ]).pipe(takeUntil(this.destroy$)).subscribe(([users, clubs, seasons]) => {
      this.processPlayerData(users, clubs, seasons);
      this.cdr.markForCheck();
    });
  }

  buildCountryEmojiMap() {
    const countries = [
      { name: 'USA', emoji: '🇺🇸' }, { name: 'Canada', emoji: '🇨🇦' },
      { name: 'Albania', emoji: '🇦🇱' }, { name: 'Andorra', emoji: '🇦🇩' }, { name: 'Austria', emoji: '🇦🇹' }, 
      { name: 'Belarus', emoji: '🇧🇾' }, { name: 'Belgium', emoji: '🇧🇪' }, { name: 'Bosnia and Herzegovina', emoji: '🇧🇦' },
      { name: 'Bulgaria', emoji: '🇧🇬' }, { name: 'Croatia', emoji: '🇭🇷' }, { name: 'Czechia', emoji: '🇨🇿' },
      { name: 'Denmark', emoji: '🇩🇰' }, { name: 'Estonia', emoji: '🇪🇪' }, { name: 'Finland', emoji: '🇫🇮' },
      { name: 'France', emoji: '🇫🇷' }, { name: 'Germany', emoji: '🇩🇪' }, { name: 'Greece', emoji: '🇬🇷' },
      { name: 'Hungary', emoji: '🇭🇺' }, { name: 'Iceland', emoji: '🇮🇸' }, { name: 'Ireland', emoji: '🇮🇪' },
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

  getSeasonIdByName(seasonName: string, seasons: any[]): string {
    const season = seasons.find(s => s.name === seasonName);
    return season ? season._id : '';
  }

  processPlayerData(users: any[], clubs: Club[], seasons: any[]) {
    // Map backend user structure to Player interface
    const players: Player[] = users.map((user: any) => {
      const profile = user.playerProfile || {};
      
      // Determine player's status and club for the selected season
      let clubName = '';
      let clubId = '';
      let status: 'Free Agent' | 'Signed' | 'Pending' = 'Free Agent';
      let logo = undefined;
      
      if (this.seasonFilter) {
        // Use season-specific data if available
        const seasonId = this.getSeasonIdByName(this.seasonFilter, seasons);
        
        if (seasonId) {
          // Check if user is on any club's roster for this season
          const club = clubs.find(c => {
            if (c.seasons && Array.isArray(c.seasons)) {
              return c.seasons.some((s: any) => {
                // Handle both string and object seasonId formats
                let currentSeasonId = s.seasonId;
                if (typeof s.seasonId === 'object' && s.seasonId._id) {
                  currentSeasonId = s.seasonId._id;
                }
                
                if (currentSeasonId && currentSeasonId.toString() === seasonId.toString()) {
                  if (s.roster && Array.isArray(s.roster)) {
                    const isOnRoster = s.roster.some((rosterUserId: any) => {
                      return rosterUserId.toString() === user._id.toString();
                    });
                    return isOnRoster;
                  }
                }
                return false;
              });
            }
            return false;
          });
          
          if (club) {
            clubName = club.name;
            clubId = club._id;
            status = 'Signed';
            logo = this.getImageUrl(club.logoUrl);
          }
        }
      }
      
      return {
        id: user._id || user.id,
        discordUsername: user.discordUsername || '',
        position: profile.position || 'C',
        secondaryPositions: profile.secondaryPositions || [],
        number: profile.number || '',
        psnId: user.psnId || (user.platform === 'PS5' ? user.gamertag : ''),
        xboxGamertag: user.xboxGamertag || (user.platform === 'Xbox' ? user.gamertag : ''),
        gamertag: user.gamertag || '',
        country: profile.country || '',
        handedness: profile.handedness || 'Left',
        currentClubId: clubId,
        currentClubName: clubName,
        status: status,
        lastActive: user.lastActive || '',
        stats: profile.stats || {},
        clubLogo: logo,
        userId: user._id,
        userGamertag: user.gamertag
      };
    });
    
    // Load club logos based on most games played
    this.loadClubLogosByGamesPlayed(players);
    this.applyFilters(players);
  }

  loadClubLogosByGamesPlayed(players: Player[]) {
    // Load all matches to calculate games played per club
    this.matches$.pipe(takeUntil(this.destroy$)).subscribe(matches => {
      players.forEach(player => {
        if ((player as any).userId && (player as any).userGamertag) {
          this.getClubWithMostGamesPlayed(player, matches);
        }
      });
    });
  }

  getClubWithMostGamesPlayed(player: any, matches: any[]) {
    const clubGamesPlayed: { [clubId: string]: number } = {};
    
    // Count games played for each club
    matches.forEach(match => {
      if (match.eashlData && match.eashlData.players) {
        Object.entries(match.eashlData.players).forEach(([clubId, clubPlayers]: [string, any]) => {
          if (typeof clubPlayers === 'object' && clubPlayers !== null) {
            const playerFound = Object.values(clubPlayers).some((playerData: any) => {
              return playerData && playerData.playername === (player as any).userGamertag;
            });
            
            if (playerFound) {
              clubGamesPlayed[clubId] = (clubGamesPlayed[clubId] || 0) + 1;
            }
          }
        });
      }
    });
    
    // Find the club with the most games played
    let mostGamesClubId = '';
    let maxGames = 0;
    
    Object.entries(clubGamesPlayed).forEach(([clubId, games]) => {
      if (games > maxGames) {
        maxGames = games;
        mostGamesClubId = clubId;
      }
    });
    
    // Update player's club logo if we found a club with games played
    if (mostGamesClubId && maxGames > 0) {
      this.clubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
        const club = clubs.find(c => c.eashlClubId === mostGamesClubId);
        if (club) {
          player.clubLogo = this.getImageUrl(club.logoUrl);
          player.currentClubName = club.name;
        }
      });
    }
  }

  getImageUrl(logoUrl: string | undefined): string {
    return this.imageUrlService.getImageUrl(logoUrl, 'assets/images/1ithlwords.png');
  }

  applyFilters(players: Player[]) {
    this.filteredPlayers = players.filter(player => {
      const matchesStatus = this.statusFilter === 'All' || player.status === this.statusFilter;
      
      const positionGroup = this.positionGroupMap[player.position] || 'Unknown';
      const matchesPosition = this.positionFilter === 'All' || positionGroup === this.positionFilter;

      // Check if player has secondary positions that match the filter
      let matchesSecondaryPosition = this.secondaryPositionFilter === 'All';
      if (this.secondaryPositionFilter !== 'All' && player.secondaryPositions && player.secondaryPositions.length > 0) {
        matchesSecondaryPosition = player.secondaryPositions.some(pos => {
          const secondaryPosGroup = this.positionGroupMap[pos] || 'Unknown';
          return secondaryPosGroup === this.secondaryPositionFilter;
        });
      }

      const playerRegion = this.regionMap[player.country || ''] || 'Unknown';
      const matchesRegion = this.regionFilter === 'All' || playerRegion === this.regionFilter;

      const matchesSearch = (player.discordUsername?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                          (player.psnId?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                          (player.xboxGamertag?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false);
      
      return matchesStatus && matchesPosition && matchesSecondaryPosition && matchesRegion && matchesSearch;
    });
  }

  onStatusFilterChange(status: 'All' | 'Free Agent' | 'Signed' | 'Pending') {
    this.statusFilter = status;
    this.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.clubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
        this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
          this.processPlayerData(users, clubs, seasons);
          this.cdr.markForCheck();
        });
      });
    });
  }

  onPositionFilterChange(position: 'All' | 'Forward' | 'Defense' | 'Goalie') {
    this.positionFilter = position;
    this.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.clubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
        this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
          this.processPlayerData(users, clubs, seasons);
          this.cdr.markForCheck();
        });
      });
    });
  }

  onSecondaryPositionFilterChange(position: 'All' | 'Forward' | 'Defense' | 'Goalie') {
    this.secondaryPositionFilter = position;
    this.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.clubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
        this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
          this.processPlayerData(users, clubs, seasons);
          this.cdr.markForCheck();
        });
      });
    });
  }

  onRegionFilterChange(region: 'All' | 'North America' | 'Europe') {
    this.regionFilter = region;
    this.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.clubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
        this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
          this.processPlayerData(users, clubs, seasons);
          this.cdr.markForCheck();
        });
      });
    });
  }

  onSeasonFilterChange(season: string) {
    this.seasonFilter = season;
    this.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.clubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
        this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
          this.processPlayerData(users, clubs, seasons);
          this.cdr.markForCheck();
        });
      });
    });
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.clubs$.pipe(takeUntil(this.destroy$)).subscribe(clubs => {
        this.seasons$.pipe(takeUntil(this.destroy$)).subscribe(seasons => {
          this.processPlayerData(users, clubs, seasons);
          this.cdr.markForCheck();
        });
      });
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
    return 'assets/images/square-default.png';
  }
}