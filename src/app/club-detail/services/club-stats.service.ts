import { Injectable } from '@angular/core';
import { ApiService } from '../../store/services/api.service';
import { firstValueFrom } from 'rxjs';

export interface SkaterStats {
  playerId: number;
  name: string;
  number: number;
  position: string;
  role: 'skater';
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots: number;
  shotPercentage: number;
  hits: number;
  blockedShots: number;
  pim: number;
  penaltyAssists: number;
  penaltyPercentage: number;
  ppg: number;
  shg: number;
  gwg: number;
  takeaways: number;
  giveaways: number;
  passes: number;
  passAttempts: number;
  passPercentage: number;
  faceoffsWon: number;
  faceoffsLost: number;
  faceoffPercentage: number;
  interceptions: number;
  playerScore: number;
  penaltyKillCorsiZone: number;
  isSigned: boolean;
}

export interface GoalieStats {
  playerId: number;
  name: string;
  number: number;
  position: 'G';
  role: 'goalie';
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  saves: number;
  shotsAgainst: number;
  goalsAgainst: number;
  savePercentage: number;
  goalsAgainstAverage: number;
  shutouts: number;
  otl: number;
  isSigned: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClubStatsService {
  constructor(private apiService: ApiService) {}

  /**
   * Build username-to-playerId map from roster
   * Maps all usernames (from usernames array and gamertag) to playerId and primary username
   */
  private buildRosterUsernameMap(roster: any[]): Map<string, { playerId: string, primaryUsername: string, allUsernames: string[] }> {
    const map = new Map<string, { playerId: string, primaryUsername: string, allUsernames: string[] }>();
    
    roster.forEach((player) => {
      const playerId = player._id || player.id;
      if (!playerId) return;
      
      let usernames: string[] = [];
      let primaryUsername = '';
      
      // Always include the gamertag for backward compatibility
      if (player.gamertag) {
        usernames.push(player.gamertag);
        primaryUsername = player.gamertag; // Default primary to gamertag if not found in usernames array
      }

      if (player.usernames && Array.isArray(player.usernames) && player.usernames.length > 0) {
        player.usernames.forEach((u: any) => {
          const username = typeof u === 'string' ? u : (u?.username || '');
          if (username && !usernames.includes(username)) { // Avoid duplicates if gamertag is also in usernames
            usernames.push(username);
          }
          if (u?.isPrimary) {
            primaryUsername = username;
          }
        });
      }
      
      // Ensure a primary username is set if one wasn't explicitly marked
      if (!primaryUsername && usernames.length > 0) {
        primaryUsername = usernames[0];
      }

      // Map each username to the player info
      usernames.forEach(username => {
        if (username) {
          const normalizedUsername = username.toLowerCase().trim();
          map.set(normalizedUsername, { playerId: playerId.toString(), primaryUsername, allUsernames: usernames });
        }
      });
    });
    
    return map;
  }

  private findPlayerInEashlData(eashlData: any, playerName: string, clubName: string): any {
    if (!eashlData || !eashlData.players) return null;
    
    const teamKeys = Object.keys(eashlData.players);
    for (const teamKey of teamKeys) {
      const teamPlayersData = eashlData.players[teamKey];
      const playersArray = Array.isArray(teamPlayersData) ? teamPlayersData : Object.values(teamPlayersData);
      
      const player = playersArray.find((p: any) => 
        p.playername === playerName || p.name === playerName
      );
      
      if (player) {
        return player;
      }
    }
    
    return null;
  }

  /**
   * Process player stats from matches for a club
   */
  async processPlayerStatsFromMatches(
    clubMatches: any[],
    roster: any[],
    backendClub: any
  ): Promise<{ skaterStats: SkaterStats[], goalieStats: GoalieStats[] }> {
    console.log('=== CLUB STATS SERVICE DEBUG ===');
    console.log('Processing player stats from matches for club:', backendClub?.name);
    console.log('Club matches available:', clubMatches.length);
    console.log('Roster players:', roster.length);
    console.log('========================');
    
    // Defensive filter: Exclude any playoff games that might have slipped through
    // User wants playoff stats completely excluded from club detail page
    const regularSeasonMatches = clubMatches.filter(match => {
      const isPlayoff = match.isPlayoff === true || match.isPlayoff === 'true' || match.isPlayoff === 1;
      const hasPlayoffIds = match.playoffBracketId || match.playoffSeriesId || match.playoffRoundId;
      
      if (isPlayoff || hasPlayoffIds) {
        console.warn('WARNING: Playoff game found in clubMatches, excluding:', {
          id: match._id || match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          isPlayoff: match.isPlayoff,
          playoffBracketId: match.playoffBracketId,
          playoffSeriesId: match.playoffSeriesId
        });
        return false;
      }
      return true;
    });
    
    console.log('After defensive filter:', regularSeasonMatches.length, 'regular season matches (excluded', clubMatches.length - regularSeasonMatches.length, 'playoff games)');
    
    // Fetch all players to build global username-to-playerId map
    const allPlayers = await firstValueFrom(this.apiService.getAllPlayers());
    
    // Build global username-to-playerId map from all players' usernames arrays
    const globalUsernameToPlayerId = new Map<string, string>();
    const globalPlayerIdToPrimaryUsername = new Map<string, string>();
    
    allPlayers.forEach((player: any) => {
      const playerId = (player._id || player.id)?.toString();
      if (!playerId) return;
      
      let usernames: string[] = [];
      let primaryUsername = '';
      
      // Always include gamertag for backward compatibility
      if (player.gamertag) {
        usernames.push(player.gamertag);
        primaryUsername = player.gamertag; // Default primary to gamertag
      }
      
      if (player.usernames && Array.isArray(player.usernames) && player.usernames.length > 0) {
        player.usernames.forEach((u: any) => {
          const username = typeof u === 'string' ? u : (u?.username || '');
          if (username && !usernames.includes(username)) {
            usernames.push(username);
          }
          if (u?.isPrimary) {
            primaryUsername = username;
          }
        });
      }
      
      // Ensure a primary username is set
      if (!primaryUsername && usernames.length > 0) {
        primaryUsername = usernames[0];
      }
      
      // Map each username to playerId
      usernames.forEach(username => {
        if (username) {
          globalUsernameToPlayerId.set(username.toLowerCase().trim(), playerId);
        }
      });
      
      if (primaryUsername) {
        globalPlayerIdToPrimaryUsername.set(playerId, primaryUsername);
      }
    });
    
    console.log('Global username map size:', globalUsernameToPlayerId.size);
    console.log('Global playerId to primary username map size:', globalPlayerIdToPrimaryUsername.size);
    
    // Debug: Check if Arthuukin and H0nsk1_ are mapped correctly
    const arthuukinPlayerId = globalUsernameToPlayerId.get('arthuukin');
    const h0nsk1PlayerId = globalUsernameToPlayerId.get('h0nsk1_');
    console.log('DEBUG: arthuukin -> playerId:', arthuukinPlayerId);
    console.log('DEBUG: h0nsk1_ -> playerId:', h0nsk1PlayerId);
    if (arthuukinPlayerId && h0nsk1PlayerId) {
      console.log('DEBUG: Same playerId?', arthuukinPlayerId === h0nsk1PlayerId);
      console.log('DEBUG: Primary username for this playerId:', globalPlayerIdToPrimaryUsername.get(arthuukinPlayerId));
    }
    
    // Build username-to-playerId map from roster (for signed status and roster lookup)
    const rosterUsernameMap = this.buildRosterUsernameMap(roster);
    console.log('Roster username map:', Array.from(rosterUsernameMap.entries()).map(([key, value]) => `${key} -> ${value.playerId} (primary: ${value.primaryUsername})`));
    
    // First, collect all players who played for this team from match data (including unsigned ones)
    // Use playerId instead of username to combine stats from multiple usernames
    const allPlayersWhoPlayed = new Set<string>(); // Store playerIds
    
    regularSeasonMatches.forEach(match => {
      // Determine if the current club is home or away
      const isHomeTeam = match.homeClubId?._id === backendClub?._id || match.homeTeam === backendClub?.name;
      const isAwayTeam = match.awayClubId?._id === backendClub?._id || match.awayTeam === backendClub?.name;

      // Prioritize manual stats over EASHL data since manual stats have proper player names
      if (match.playerStats && match.playerStats.length > 0) {
        console.log(`Collecting manual stats players for match ${match._id || match.id}`);
        const ourPlayers = match.playerStats.filter((player: any) => {
          const matches = player.team === backendClub?.name;
          return matches;
        });
        ourPlayers.forEach((playerData: any) => {
          if (playerData && playerData.name) {
            // Find playerId by matching username - use global map first
            const normalizedName = playerData.name.toLowerCase().trim();
            const playerId = globalUsernameToPlayerId.get(normalizedName);
            if (playerId) {
              console.log('Adding manual player to collection:', playerData.name, '-> playerId:', playerId);
              allPlayersWhoPlayed.add(playerId);
            } else {
              // Fallback to roster map if not in global map
              const playerInfo = rosterUsernameMap.get(normalizedName);
              if (playerInfo) {
                console.log('Adding manual player to collection (from roster):', playerData.name, '-> playerId:', playerInfo.playerId);
                allPlayersWhoPlayed.add(playerInfo.playerId);
              } else {
                // If not found anywhere, use name as fallback (unsigned player)
                console.log('Adding manual player to collection (not found):', playerData.name);
            allPlayersWhoPlayed.add(playerData.name);
              }
            }
          }
        });
      } else if (match.eashlData?.players) {
        // Process EASHL data - players is an object, not an array
        console.log(`Collecting EASHL players for match ${match._id || match.id}`);
        console.log('EASHL players structure:', match.eashlData.players);
        console.log('EASHL players type:', typeof match.eashlData.players);
        console.log('EASHL players isArray:', Array.isArray(match.eashlData.players));
        console.log('Our team name:', backendClub?.name);

        const teamKeys = Object.keys(match.eashlData.players);
        console.log('EASHL team keys for collection:', teamKeys);
        
        // Debug each team's data structure
        teamKeys.forEach(teamKey => {
          const teamData = match.eashlData.players[teamKey];
          console.log(`Team ${teamKey} data:`, teamData);
          console.log(`Team ${teamKey} type:`, typeof teamData);
          console.log(`Team ${teamKey} isArray:`, Array.isArray(teamData));
          if (Array.isArray(teamData)) {
            console.log(`Team ${teamKey} length:`, teamData.length);
            console.log(`Team ${teamKey} first player:`, teamData[0]);
          } else {
            console.log(`Team ${teamKey} keys:`, Object.keys(teamData));
            // Debug the actual player data structure
            const playerKeys = Object.keys(teamData);
            if (playerKeys.length > 0) {
              const firstPlayerKey = playerKeys[0];
              console.log(`Team ${teamKey} first player key:`, firstPlayerKey);
              console.log(`Team ${teamKey} first player data:`, teamData[firstPlayerKey]);
              console.log(`Team ${teamKey} first player name:`, teamData[firstPlayerKey]?.name);
            }
          }
        });

        let ourTeamKey: string | undefined;

        // Try to find our team by club name first
        for (const teamKey of teamKeys) {
          const teamPlayersData = match.eashlData.players[teamKey];
          console.log(`Checking team ${teamKey} for roster players...`);
          console.log(`Team ${teamKey} players:`, teamPlayersData);
          console.log(`Team ${teamKey} players type:`, typeof teamPlayersData);
          console.log(`Team ${teamKey} players isArray:`, Array.isArray(teamPlayersData));
          
          // Convert object to array if needed
          let teamPlayers: any[];
          if (Array.isArray(teamPlayersData)) {
            teamPlayers = teamPlayersData;
          } else if (typeof teamPlayersData === 'object' && teamPlayersData !== null) {
            // Convert object to array
            teamPlayers = Object.values(teamPlayersData);
            console.log(`Converted team ${teamKey} object to array:`, teamPlayers);
            console.log(`Converted team ${teamKey} array length:`, teamPlayers.length);
            console.log(`Converted team ${teamKey} first player:`, teamPlayers[0]);
            console.log(`Converted team ${teamKey} first player name:`, teamPlayers[0]?.name);
          } else {
            console.log(`Team ${teamKey} is not an array or object, skipping...`);
            continue;
          }
          
          // Check if any player in this team is on our roster (case-insensitive, check all usernames)
          const teamContainsRosterPlayer = teamPlayers.some((player: any) => {
            const playerName = player.name?.toLowerCase().trim();
            if (!playerName) return false;
            return rosterUsernameMap.has(playerName);
          });
          console.log(`Team ${teamKey} contains roster player:`, teamContainsRosterPlayer);
          if (teamContainsRosterPlayer) {
            ourTeamKey = teamKey;
            console.log(`Found our team key for collection: ${ourTeamKey} (has roster player)`);
            break;
          }
        }

        // Fallback if no team found by roster players (e.g., if roster is empty or players are not yet signed)
        if (!ourTeamKey) {
          console.log('No team found by club name, trying home/away status fallback...');
          // Check if the match object itself has isHomeTeam/isAwayTeam flags
          // This is a more reliable way to determine which team is ours
          for (const teamKey of teamKeys) {
            const teamPlayersData = match.eashlData.players[teamKey];
            
            // Convert object to array if needed
            let teamPlayers: any[];
            if (Array.isArray(teamPlayersData)) {
              teamPlayers = teamPlayersData;
            } else if (typeof teamPlayersData === 'object' && teamPlayersData !== null) {
              // Convert object to array
              teamPlayers = Object.values(teamPlayersData);
              console.log(`Fallback - converted team ${teamKey} object to array:`, teamPlayers);
            } else {
              console.log(`Fallback - team ${teamKey} is not an array or object, skipping...`);
              continue;
            }
            
            const teamPlayersAreHome = teamPlayers.some((p: any) => p.isHomeTeam === true);
            const teamPlayersAreAway = teamPlayers.some((p: any) => p.isHomeTeam === false);
            console.log(`Team ${teamKey} home/away check: isHomeTeam=${isHomeTeam}, teamPlayersAreHome=${teamPlayersAreHome}, teamPlayersAreAway=${teamPlayersAreAway}`);
            if ((isHomeTeam && teamPlayersAreHome) || (isAwayTeam && teamPlayersAreAway)) {
              ourTeamKey = teamKey;
              console.log(`Found our team key for collection: ${ourTeamKey} (home/away status fallback)`);
              break;
            }
          }
        }

        // Fallback if still no team found (e.g., if isHomeTeam is undefined for all players)
        if (!ourTeamKey) {
          console.log('No team found by home/away status, trying team order fallback...');
          // If our club is the home team in the match, assume the first team in EASHL data is ours
          // If our club is the away team, assume the second team is ours
          if (isHomeTeam && teamKeys.length > 0) {
            ourTeamKey = teamKeys[0];
            console.log(`Found our team key for collection: ${ourTeamKey} (team order fallback - home team)`);
          } else if (isAwayTeam && teamKeys.length > 1) {
            ourTeamKey = teamKeys[1];
            console.log(`Found our team key for collection: ${ourTeamKey} (team order fallback - away team)`);
          } else if (teamKeys.length > 0) {
            // If we can't determine home/away, and there's only one team, assume it's ours
            // Or if there are two teams, and we are the away team, but the first team is not home, assume the second is ours
            // This is a very weak fallback, but better than nothing
            ourTeamKey = teamKeys[0];
            console.log(`Found our team key for collection: ${ourTeamKey} (team order fallback - default to first)`);
          }
        }

        if (ourTeamKey) {
          console.log(`Collecting players from team ${ourTeamKey} for ${backendClub?.name}:`);
          const teamPlayersData = match.eashlData.players[ourTeamKey];
          console.log('Team players data:', teamPlayersData);
          console.log('Team players type:', typeof teamPlayersData);
          console.log('Team players isArray:', Array.isArray(teamPlayersData));
          
          // Convert object to array if needed
          let teamPlayers: any[];
          if (Array.isArray(teamPlayersData)) {
            teamPlayers = teamPlayersData;
          } else if (typeof teamPlayersData === 'object' && teamPlayersData !== null) {
            // Convert object to array
            teamPlayers = Object.values(teamPlayersData);
            console.log(`Converted team ${ourTeamKey} object to array:`, teamPlayers);
          } else {
            console.error(`Team ${ourTeamKey} players is not an array or object!`, teamPlayersData);
            return;
          }
          
          console.log('Team players:', teamPlayers.map((p: any) => p.name));
          const teamContainsRosterPlayer = teamPlayers.some((player: any) => {
            const playerName = player.name?.toLowerCase().trim();
            if (!playerName) return false;
            return rosterUsernameMap.has(playerName);
          });
          console.log('Team', ourTeamKey, 'contains roster players:', teamContainsRosterPlayer);
          console.log('Roster players:', roster.map(p => p.gamertag).join(', '));
          console.log('Team players:', teamPlayers.map((p: any) => p.name).join(', '));

          teamPlayers.forEach((playerData: any) => {
            if (playerData && playerData.name) {
              // Find playerId by matching username - use global map first
              const normalizedName = playerData.name.toLowerCase().trim();
              const playerId = globalUsernameToPlayerId.get(normalizedName);
              if (playerId) {
                console.log('Adding EASHL player to collection:', playerData.name, '-> playerId:', playerId);
                allPlayersWhoPlayed.add(playerId);
              } else {
                // Fallback to roster map if not in global map
                const playerInfo = rosterUsernameMap.get(normalizedName);
                if (playerInfo) {
                  console.log('Adding EASHL player to collection (from roster):', playerData.name, '-> playerId:', playerInfo.playerId);
                  allPlayersWhoPlayed.add(playerInfo.playerId);
                } else {
                  // If not found anywhere, use name as fallback (unsigned player)
                  console.log('Adding EASHL player to collection (not found):', playerData.name);
              allPlayersWhoPlayed.add(playerData.name);
                }
              }
            }
          });
        } else {
          console.warn(`Could not determine our team key for match ${match._id || match.id}. Skipping player collection for this match.`);
        }
      }
    });

    // Create a set of roster playerIds for quick lookup
    const rosterPlayerIds = new Set(roster.map(p => {
      const id = (p._id || p.id)?.toString();
      return id;
    }).filter(Boolean));
    console.log('Roster player IDs for stats processing:', Array.from(rosterPlayerIds));
    
    // Debug: Check if Arthuukin/H0nsk1_ playerId is in roster
    if (arthuukinPlayerId || h0nsk1PlayerId) {
      const playerIdToCheck = arthuukinPlayerId || h0nsk1PlayerId;
      console.log('DEBUG: Is playerId in roster?', rosterPlayerIds.has(playerIdToCheck));
      console.log('DEBUG: Roster contains playerId?', Array.from(rosterPlayerIds).includes(playerIdToCheck));
    }
    
    // Create a set of roster player names (primary usernames) for quick lookup
    const rosterPlayerNames = new Set<string>();
    roster.forEach(p => {
      let primaryUsername = '';
      if (p.usernames && Array.isArray(p.usernames) && p.usernames.length > 0) {
        const primary = p.usernames.find((u: any) => u?.isPrimary);
        primaryUsername = primary?.username || p.usernames[0]?.username || '';
      } else if (p.gamertag) {
        primaryUsername = p.gamertag;
      }
      if (primaryUsername) {
        rosterPlayerNames.add(primaryUsername.toLowerCase());
      }
    });

    // Initialize player stats map with all players who played for this club
    // Key by playerId to combine stats from multiple usernames
    const initialPlayerStatsMap = new Map<string, any>();
    allPlayersWhoPlayed.forEach(playerIdOrName => {
      // Get primary username from global map (playerIdOrName should be a playerId if found in global map)
      let primaryUsername = globalPlayerIdToPrimaryUsername.get(playerIdOrName) || playerIdOrName;
      let player: any = null;
      let playerNumber = 0;
      
      // Try to find by ID first (playerIdOrName is a playerId if it came from global map)
      player = roster.find(p => (p._id || p.id)?.toString() === playerIdOrName);
      
      // If not found by ID, it might be a name (unsigned player)
      if (!player && !globalPlayerIdToPrimaryUsername.has(playerIdOrName)) {
        // This is likely an unsigned player name, try to find in roster by username
        const playerInfo = Array.from(rosterUsernameMap.entries()).find(([username, info]) => 
          info.playerId === playerIdOrName
        );
        if (playerInfo) {
          const playerInfoValue = playerInfo[1];
          player = roster.find(p => (p._id || p.id)?.toString() === playerInfoValue.playerId);
          primaryUsername = playerInfoValue.primaryUsername;
        } else {
          // Fallback: try to find by gamertag match
          player = roster.find(p => {
            const normalizedGamertag = p.gamertag?.toLowerCase().trim();
            return normalizedGamertag === playerIdOrName.toLowerCase().trim();
          });
          if (player) {
            const playerInfo = rosterUsernameMap.get(playerIdOrName.toLowerCase().trim());
            primaryUsername = playerInfo?.primaryUsername || player.gamertag || playerIdOrName;
          }
        }
      } else if (player) {
        // Found by ID, get primary username from global map first, then roster
        const playerIdStr = (player._id || player.id)?.toString();
        primaryUsername = globalPlayerIdToPrimaryUsername.get(playerIdStr) || primaryUsername;
        if (!primaryUsername || primaryUsername === playerIdOrName) {
          // Fallback to roster map or player data
          const playerInfo = Array.from(rosterUsernameMap.values()).find(info => info.playerId === playerIdStr);
          if (playerInfo) {
            primaryUsername = playerInfo.primaryUsername;
          } else if (player.usernames && Array.isArray(player.usernames) && player.usernames.length > 0) {
            const primary = player.usernames.find((u: any) => u.isPrimary);
            primaryUsername = primary?.username || player.usernames[0]?.username || player.gamertag || playerIdOrName;
          } else {
            primaryUsername = player.gamertag || playerIdOrName;
          }
        }
      }
      
      // Use playerIdOrName as playerId if it's already a playerId, otherwise use player's ID or fallback to name
      let finalPlayerId: string;
      if (globalPlayerIdToPrimaryUsername.has(playerIdOrName)) {
        // playerIdOrName is already a playerId from the global map
        finalPlayerId = playerIdOrName;
      } else if (player) {
        // Found player in roster, use their ID
        const playerIdValue = player._id || player.id;
        finalPlayerId = playerIdValue ? String(playerIdValue) : playerIdOrName;
      } else {
        // Fallback to playerIdOrName (might be a name for unsigned player)
        finalPlayerId = String(playerIdOrName);
      }
      const playerId: string = finalPlayerId;
      playerNumber = player?.number || 0;
      
      // Debug logging for Arthuukin/H0nsk1_
      if (playerIdOrName && (String(playerIdOrName).toLowerCase().includes('arthuukin') || String(playerIdOrName).toLowerCase().includes('h0nsk1'))) {
        console.log('DEBUG INIT: playerIdOrName:', playerIdOrName, 'finalPlayerId:', finalPlayerId, 'isInRoster:', rosterPlayerIds.has(finalPlayerId));
      }

      const baseSkaterStats: SkaterStats = {
        playerId: parseInt(playerId) || 0,
        name: primaryUsername, // Use primary username for display
        number: playerNumber,
        position: 'Unknown', // Will be determined by game performance
        role: 'skater', // Track the role
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
        penaltyAssists: 0,
        penaltyPercentage: 0,
        ppg: 0,
        shg: 0,
        gwg: 0,
        takeaways: 0,
        giveaways: 0,
        passes: 0,
        passAttempts: 0,
        passPercentage: 0,
        faceoffsWon: 0,
        faceoffsLost: 0,
        faceoffPercentage: 0,
        interceptions: 0,
        playerScore: 0,
        penaltyKillCorsiZone: 0,
        isSigned: rosterPlayerIds.has(playerId)
      };

      const baseGoalieStats: GoalieStats = {
        playerId: parseInt(playerId) || 0,
        name: primaryUsername, // Use primary username for display
        number: playerNumber,
        position: 'G',
        role: 'goalie', // Track the role
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        otLosses: 0,
        saves: 0,
        shotsAgainst: 0,
        goalsAgainst: 0,
        savePercentage: 0,
        goalsAgainstAverage: 0,
        shutouts: 0,
        otl: 0,
        isSigned: rosterPlayerIds.has(playerId)
      };

      // Create separate entries for skater and goalie roles, keyed by playerId
      initialPlayerStatsMap.set(`${playerId}_skater`, baseSkaterStats);
      initialPlayerStatsMap.set(`${playerId}_goalie`, baseGoalieStats);
    });

    // Also initialize stats for roster players who might not have played yet
    roster.forEach(player => {
      if (!player) return;

      const playerId = (player._id || player.id)?.toString();
      if (!playerId) return;
      
      // Get primary username from global map first, then fallback to roster data
      let primaryUsername = globalPlayerIdToPrimaryUsername.get(playerId);
      if (!primaryUsername) {
        if (player.usernames && Array.isArray(player.usernames) && player.usernames.length > 0) {
          const primary = player.usernames.find((u: any) => u.isPrimary);
          primaryUsername = primary?.username || player.usernames[0]?.username || player.gamertag || '';
        } else {
          primaryUsername = player.gamertag || '';
        }
      }
      
      if (!primaryUsername) return; // Skip if no username at all
      
      const playerNumber = player.number || 0;

      if (!initialPlayerStatsMap.has(`${playerId}_skater`)) {
        const baseSkaterStats: SkaterStats = {
          playerId: parseInt(playerId) || 0,
          name: primaryUsername,
          number: playerNumber,
          position: 'Unknown',
          role: 'skater',
          gamesPlayed: 0, wins: 0, losses: 0, otLosses: 0, goals: 0, assists: 0, points: 0, plusMinus: 0,
          shots: 0, shotPercentage: 0, hits: 0, blockedShots: 0, pim: 0, penaltyAssists: 0, penaltyPercentage: 0, ppg: 0, shg: 0, gwg: 0,
          takeaways: 0, giveaways: 0, passes: 0, passAttempts: 0, passPercentage: 0,           faceoffsWon: 0,
          faceoffsLost: 0, faceoffPercentage: 0, interceptions: 0, playerScore: 0, penaltyKillCorsiZone: 0,
          isSigned: true
        };
        initialPlayerStatsMap.set(`${playerId}_skater`, baseSkaterStats);
      }

      if (!initialPlayerStatsMap.has(`${playerId}_goalie`)) {
        const baseGoalieStats: GoalieStats = {
          playerId: parseInt(playerId) || 0,
          name: primaryUsername,
          number: playerNumber,
          position: 'G',
          role: 'goalie',
          gamesPlayed: 0, wins: 0, losses: 0, otLosses: 0,
          saves: 0, shotsAgainst: 0, goalsAgainst: 0, savePercentage: 0, goalsAgainstAverage: 0, shutouts: 0, otl: 0,
          isSigned: true
        };
        initialPlayerStatsMap.set(`${playerId}_goalie`, baseGoalieStats);
      }
    });

    // Use the initialized map
    const playerStatsMap = initialPlayerStatsMap;

    console.log('Player stats map before processing matches:', Array.from(playerStatsMap.keys()));

    // Process matches to calculate stats
    console.log('Processing', regularSeasonMatches.length, 'regular season matches for stats calculation (excluded', clubMatches.length - regularSeasonMatches.length, 'playoff games)');
    regularSeasonMatches.forEach((match, index) => {
      console.log(`=== BEFORE MATCH ${index + 1} PROCESSING ===`);
      console.log('TeeKneeWeKnee stats before match:', playerStatsMap.get('TeeKneeWeKnee_skater'));
      console.log('AlxSkyes stats before match:', playerStatsMap.get('AlxSkyes_skater'));
      console.log('DANNYZJ7854 stats before match:', playerStatsMap.get('DANNYZJ7854_skater'));
      console.log(`Match ${index + 1}:`, {
        id: match._id || match.id,
        hasEashlData: !!match.eashlData,
        hasPlayers: !!(match.eashlData && match.eashlData.players),
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        isManualEntry: match.eashlData?.manualEntry
      });

      // Determine if the current club is home or away in this specific match
      const isHomeTeamInMatch = match.homeClubId?._id === backendClub?._id || match.homeTeam === backendClub?.name;
      const isAwayTeamInMatch = match.awayClubId?._id === backendClub?._id || match.awayTeam === backendClub?.name;

      let won = false;
      let lost = false;
      let otLoss = false;

      if (isHomeTeamInMatch) {
        won = match.homeScore > match.awayScore;
        lost = match.homeScore < match.awayScore && !match.isOvertime && !match.isShootout;
        otLoss = match.homeScore < match.awayScore && (match.isOvertime || match.isShootout);
      } else if (isAwayTeamInMatch) {
        won = match.awayScore > match.homeScore;
        lost = match.awayScore < match.homeScore && !match.isOvertime && !match.isShootout;
        otLoss = match.awayScore < match.homeScore && (match.isOvertime || match.isShootout);
      }

      // Prioritize processed playerStats over raw EASHL data
      if (match.playerStats && match.playerStats.length > 0) {
        console.log(`=== PROCESSING PLAYERSTATS FOR MATCH ${match._id || match.id} ===`);
        console.log(`PlayerStats length:`, match.playerStats.length);
        console.log(`PlayerStats sample:`, match.playerStats[0]);
        console.log(`PlayerStats sample keys:`, Object.keys(match.playerStats[0] || {}));
        console.log(`Looking for team:`, backendClub?.name);
        const ourPlayers = match.playerStats.filter((player: any) => player.team === backendClub?.name);
        console.log(`Found ${ourPlayers.length} players for our team`);
        console.log(`Our players:`, ourPlayers.map((p: any) => ({ name: p.name, team: p.team })));
        ourPlayers.forEach((playerData: any) => {
          if (!playerData || !playerData.name) return;

          console.log(`--- Processing player: ${playerData.name} ---`);
          console.log(`Player data:`, playerData);
          console.log(`Player blockedShots:`, playerData.blockedShots);
          console.log(`Player powerPlayGoals:`, playerData.powerPlayGoals);
          console.log(`Player shortHandedGoals:`, playerData.shortHandedGoals);
          console.log(`Player gameWinningGoals:`, playerData.gameWinningGoals);
        console.log(`Player penaltyMinutes:`, playerData.penaltyMinutes);
        console.log(`Player penaltyAssists:`, playerData.penaltyAssists);
        console.log(`Player penaltyKillCorsiZone:`, playerData.penaltyKillCorsiZone);
        console.log(`=== PASS STATS DEBUG for ${playerData.name} ===`);
        console.log(`Player passes:`, playerData.passes);
        console.log(`Player passesCompleted:`, playerData.passesCompleted);
        console.log(`Player passAttempts:`, playerData.passAttempts);
        console.log(`Player passPercentage:`, playerData.passPercentage);
        console.log(`Player data keys:`, Object.keys(playerData));
        console.log(`Player data values:`, Object.values(playerData));
        console.log(`=== END PASS STATS DEBUG ===`);

          const playerName = playerData.name;
          const isGoalie = playerData.position === 'G' || playerData.position === 'goalie';
          const roleSuffix = isGoalie ? '_goalie' : '_skater';
          
          // Find playerId by matching username - use global map first
          const normalizedName = playerName.toLowerCase().trim();
          let playerId: string | undefined = globalUsernameToPlayerId.get(normalizedName);
          let primaryUsername = playerId ? globalPlayerIdToPrimaryUsername.get(playerId) : undefined;
          
          // Fallback to roster map if not in global map
          if (!playerId) {
            const playerInfo = rosterUsernameMap.get(normalizedName);
            if (playerInfo) {
              playerId = playerInfo.playerId;
              primaryUsername = playerInfo.primaryUsername;
          } else {
              // If not found anywhere, use name as fallback (unsigned player)
              playerId = playerName;
              primaryUsername = playerName;
            }
          }
          
          // Ensure playerId is always a string
          const finalPlayerId: string = playerId || playerName;
          
          const matchingKey = `${finalPlayerId}${roleSuffix}`;
          
          console.log(`Looking for key: ${matchingKey} (playerName: ${playerName}, playerId: ${finalPlayerId}, primaryUsername: ${primaryUsername})`);
          console.log(`PlayerStatsMap has key:`, playerStatsMap.has(matchingKey));
          
          // Create stats entry if it doesn't exist (for unsigned players)
          if (!playerStatsMap.has(matchingKey)) {
            const baseStats = isGoalie ? {
              playerId: parseInt(finalPlayerId) || 0,
              name: primaryUsername || playerName,
              number: 0,
              position: 'G',
              role: 'goalie' as const,
              gamesPlayed: 0, wins: 0, losses: 0, otLosses: 0,
              saves: 0, shotsAgainst: 0, goalsAgainst: 0, savePercentage: 0, goalsAgainstAverage: 0, shutouts: 0, otl: 0,
              isSigned: rosterPlayerIds.has(finalPlayerId)
            } : {
              playerId: parseInt(finalPlayerId) || 0,
              name: primaryUsername || playerName,
              number: 0,
              position: 'Unknown',
              role: 'skater' as const,
              gamesPlayed: 0, wins: 0, losses: 0, otLosses: 0, goals: 0, assists: 0, points: 0, plusMinus: 0,
              shots: 0, shotPercentage: 0, hits: 0, blockedShots: 0, pim: 0, penaltyAssists: 0, penaltyPercentage: 0, ppg: 0, shg: 0, gwg: 0,
              takeaways: 0, giveaways: 0, passes: 0, passAttempts: 0, passPercentage: 0,
              faceoffsWon: 0, faceoffsLost: 0, faceoffPercentage: 0, interceptions: 0, playerScore: 0, penaltyKillCorsiZone: 0,
              isSigned: rosterPlayerIds.has(finalPlayerId)
            };
            playerStatsMap.set(matchingKey, baseStats);
          }

          if (playerStatsMap.has(matchingKey)) {
            const playerStats = playerStatsMap.get(matchingKey);
            // Update isSigned status if player is in roster
            if (!playerStats.isSigned && rosterPlayerIds.has(finalPlayerId)) {
              playerStats.isSigned = true;
            }
            // Update name to primary username if it changed
            if (primaryUsername && playerStats.name !== primaryUsername) {
              playerStats.name = primaryUsername;
            }
            playerStats.gamesPlayed++;
            if (won) playerStats.wins++;
            else if (lost) playerStats.losses++;
            else if (otLoss) {
              playerStats.otLosses++;
              if (isGoalie) {
                playerStats.otl = (playerStats.otl || 0) + 1;
              }
            }

            if (isGoalie) {
              const saves = playerData.saves || 0;
              const goalsAgainst = playerData.goalsAgainst || 0;
              // In hockey, shots against = saves + goals against (a goal is a shot on goal)
              const shotsAgainst = saves + goalsAgainst;
              
              playerStats.saves += saves;
              playerStats.shotsAgainst += shotsAgainst;
              playerStats.goalsAgainst += goalsAgainst;
              // Calculate shutouts based on goals against for this specific game (0 goals = 1 shutout)
playerStats.shutouts += (goalsAgainst === 0 && shotsAgainst > 0) ? 1 : 0;
              playerStats.savePercentage = playerStats.shotsAgainst > 0 ? (playerStats.saves / playerStats.shotsAgainst) * 100 : 0;
              playerStats.goalsAgainstAverage = playerStats.gamesPlayed > 0 ? (playerStats.goalsAgainst / playerStats.gamesPlayed) : 0;
            } else {
              const goals = playerData.goals || 0;
              const shotsWithoutGoals = playerData.shots || 0;
              // In hockey, goals are shots on goal, so total shots = shots + goals
              const totalShots = shotsWithoutGoals + goals;
              
              playerStats.goals += goals;
              playerStats.assists += playerData.assists || 0;
              playerStats.points += goals + (playerData.assists || 0);
              playerStats.plusMinus += playerData.plusMinus || 0;
              playerStats.shots += totalShots;
              playerStats.hits += playerData.hits || 0;
              
              // Try to get blocked shots from EASHL data if playerStats has 0
              let blockedShots = parseInt(playerData.blockedShots) || 0;
              if (blockedShots === 0 && match.eashlData && match.eashlData.players) {
                // Look for this player in EASHL data
                const eashlPlayer = this.findPlayerInEashlData(match.eashlData, playerData.name, backendClub?.name);
                if (eashlPlayer) {
                  blockedShots = parseInt(eashlPlayer.skbs) || 0;
                  if (playerData.name && playerData.name.includes('Liskoilija')) {
                    console.log('🔍 LISKOILIJA EASHL BLOCKED SHOTS:', {
                      name: playerData.name,
                      playerStatsBlockedShots: playerData.blockedShots,
                      eashlSkbs: eashlPlayer.skbs,
                      finalBlockedShots: blockedShots
                    });
                  }
                }
              }
              playerStats.blockedShots += blockedShots;
              playerStats.pim += playerData.penaltyMinutes || 0;
              playerStats.penaltyAssists += playerData.penaltyAssists || 0;
              playerStats.ppg += playerData.powerPlayGoals || 0;
              playerStats.shg += playerData.shortHandedGoals || 0;
              playerStats.gwg += playerData.gameWinningGoals || 0;
              playerStats.takeaways += playerData.takeaways || 0;
              playerStats.giveaways += playerData.giveaways || 0;
              const passesToAdd = playerData.passes || playerData.passesCompleted || 0;
              playerStats.passes += passesToAdd;
              
              // Calculate passAttempts from passPercentage if passAttempts is not available
              let passAttemptsToAdd = 0;
              if (playerData.passAttempts !== undefined) {
                passAttemptsToAdd = playerData.passAttempts || 0;
                console.log(`Using direct passAttempts: ${passAttemptsToAdd}`);
              } else if (playerData.passPercentage !== undefined && playerData.passPercentage > 0) {
                // Calculate passAttempts from passes and passPercentage
                const passAttempts = Math.round(passesToAdd / (playerData.passPercentage / 100));
                passAttemptsToAdd = passAttempts;
                console.log(`Calculated passAttempts from passPercentage: ${passAttemptsToAdd} (passes: ${passesToAdd}, passPercentage: ${playerData.passPercentage})`);
              } else {
                // Fallback: Estimate passAttempts based on passes (assume ~80% pass completion rate)
                // This is a reasonable estimate for hockey statistics
                passAttemptsToAdd = Math.round(passesToAdd / 0.8);
                console.log(`Estimated passAttempts for ${playerData.name}: ${passAttemptsToAdd} (passes: ${passesToAdd}, estimated 80% completion rate)`);
              }
              playerStats.passAttempts += passAttemptsToAdd;
              
              console.log(`Updated stats for ${playerData.name}: passes=${playerStats.passes}, passAttempts=${playerStats.passAttempts}`);
              playerStats.faceoffsWon += playerData.faceoffsWon || 0;
              playerStats.faceoffsLost += playerData.faceoffsLost || 0;
              
              // Try to get interceptions from EASHL data if playerStats has 0
              let interceptions = parseInt(playerData.interceptions) || 0;
              if (interceptions === 0 && match.eashlData && match.eashlData.players) {
                // Look for this player in EASHL data
                const eashlPlayer = this.findPlayerInEashlData(match.eashlData, playerData.name, backendClub?.name);
                if (eashlPlayer) {
                  interceptions = parseInt(eashlPlayer.skint) || parseInt(eashlPlayer.skinterceptions) || 0;
                  if (playerData.name && playerData.name.includes('Liskoilija')) {
                    console.log('🔍 LISKOILIJA EASHL INTERCEPTIONS:', {
                      name: playerData.name,
                      playerStatsInterceptions: playerData.interceptions,
                      eashlSkint: eashlPlayer.skint,
                      eashlSkinterceptions: eashlPlayer.skinterceptions,
                      finalInterceptions: interceptions
                    });
                  }
                }
              }
              playerStats.interceptions += interceptions;
              playerStats.playerScore += playerData.playerScore || 0;
              playerStats.penaltyKillCorsiZone += playerData.penaltyKillCorsiZone || 0;
              playerStats.shotPercentage = playerStats.shots > 0 ? (playerStats.goals / playerStats.shots) * 100 : 0;
              playerStats.passPercentage = playerStats.passAttempts > 0 ? (playerStats.passes / playerStats.passAttempts) * 100 : 0;
              const totalFaceoffs = playerStats.faceoffsWon + playerStats.faceoffsLost;
              playerStats.faceoffPercentage = totalFaceoffs > 0 ? (playerStats.faceoffsWon / totalFaceoffs) * 100 : 0;
              const totalPenalties = playerStats.pim + playerStats.penaltyAssists;
              playerStats.penaltyPercentage = totalPenalties > 0 ? (playerStats.pim / totalPenalties) * 100 : 0;
            }
          }
        });
      } else if (match.eashlData && match.eashlData.players) {
        console.log(`=== FALLING BACK TO EASHL DATA FOR MATCH ${match._id || match.id} ===`);
        console.log('🔍 EASHL FALLBACK PROCESSING STARTED - playerStats had no meaningful blocked shots/interceptions data');
        console.log(`EASHL data:`, match.eashlData);
        console.log(`EASHL players:`, match.eashlData.players);
        // Process EASHL data
        const teamKeys = Object.keys(match.eashlData.players);
        console.log(`EASHL team keys:`, teamKeys);
        
        let ourTeamKey: string | undefined;

        // Try to find our team by roster players first
        for (const teamKey of teamKeys) {
          const teamPlayersData = match.eashlData.players[teamKey];
          console.log(`Stats processing - checking team ${teamKey}:`, teamPlayersData);
          console.log(`Stats processing - team ${teamKey} type:`, typeof teamPlayersData);
          console.log(`Stats processing - team ${teamKey} isArray:`, Array.isArray(teamPlayersData));
          
          // Convert object to array if needed
          let teamPlayers: any[];
          if (Array.isArray(teamPlayersData)) {
            teamPlayers = teamPlayersData;
          } else if (typeof teamPlayersData === 'object' && teamPlayersData !== null) {
            // Convert object to array
            teamPlayers = Object.values(teamPlayersData);
            console.log(`Stats processing - converted team ${teamKey} object to array:`, teamPlayers);
            console.log(`Stats processing - converted team ${teamKey} array length:`, teamPlayers.length);
            console.log(`Stats processing - converted team ${teamKey} first player:`, teamPlayers[0]);
            console.log(`Stats processing - converted team ${teamKey} first player name:`, teamPlayers[0]?.name);
          } else {
            console.log(`Stats processing - team ${teamKey} is not an array or object, skipping...`);
            continue;
          }
          
          const teamContainsRosterPlayer = teamPlayers.some((player: any) => 
            roster.some(rosterPlayer => rosterPlayer.gamertag?.toLowerCase() === player.name?.toLowerCase())
          );
          console.log(`Stats processing - team ${teamKey} contains roster player:`, teamContainsRosterPlayer);
          if (teamContainsRosterPlayer) {
            ourTeamKey = teamKey;
            console.log(`Stats processing - found our team key: ${ourTeamKey}`);
            break;
          }
        }

        // Fallback if no team found by roster players (e.g., if roster is empty or players are not yet signed)
        if (!ourTeamKey) {
          // If our club is the home team in the match, assume the first team in EASHL data is ours
          // If our club is the away team, assume the second team is ours
          if (isHomeTeamInMatch && teamKeys.length > 0) {
            ourTeamKey = teamKeys[0];
          } else if (isAwayTeamInMatch && teamKeys.length > 1) {
            ourTeamKey = teamKeys[1];
          } else if (teamKeys.length > 0) {
            ourTeamKey = teamKeys[0];
          }
        }

        if (ourTeamKey) {
          const teamPlayersData = match.eashlData.players[ourTeamKey];
          console.log('🔍 EASHL TEAM DATA DEBUG:', {
            ourTeamKey,
            teamPlayersCount: teamPlayersData?.length || 0,
            samplePlayer: teamPlayersData?.[0] ? {
              name: teamPlayersData[0].playername,
              skbs: teamPlayersData[0].skbs,
              skint: teamPlayersData[0].skint,
              skinterceptions: teamPlayersData[0].skinterceptions,
              skblk: teamPlayersData[0].skblk
            } : null
          });
          console.log(`Stats processing - processing team ${ourTeamKey} players:`, teamPlayersData);
          console.log(`Stats processing - team ${ourTeamKey} type:`, typeof teamPlayersData);
          console.log(`Stats processing - team ${ourTeamKey} isArray:`, Array.isArray(teamPlayersData));
          
          // Convert object to array if needed
          let teamPlayers: any[];
          if (Array.isArray(teamPlayersData)) {
            teamPlayers = teamPlayersData;
          } else if (typeof teamPlayersData === 'object' && teamPlayersData !== null) {
            // Convert object to array
            teamPlayers = Object.values(teamPlayersData);
            console.log(`Stats processing - converted team ${ourTeamKey} object to array:`, teamPlayers);
          } else {
            console.error(`Stats processing - team ${ourTeamKey} players is not an array or object!`, teamPlayersData);
            return;
          }
          
          // Check if Liskoilija is in this team's data
          const liskoilijaPlayer = teamPlayers.find(p => p.playername && p.playername.includes('Liskoilija'));
          if (liskoilijaPlayer) {
            console.log('🔍 FOUND LISKOILIJA IN EASHL DATA:', {
              name: liskoilijaPlayer.playername,
              skbs: liskoilijaPlayer.skbs,
              skint: liskoilijaPlayer.skint,
              skinterceptions: liskoilijaPlayer.skinterceptions,
              skblk: liskoilijaPlayer.skblk
            });
          } else {
            console.log('🔍 LISKOILIJA NOT FOUND IN THIS TEAM');
          }
          
          teamPlayers.forEach((playerData: any) => {
            if (!playerData || !playerData.name) return;

            console.log(`Stats processing - EASHL player ${playerData.name}:`, playerData);
            console.log(`Stats processing - EASHL player ${playerData.name} data keys:`, Object.keys(playerData));
            console.log(`Stats processing - EASHL player ${playerData.name} blockedShots:`, playerData.blockedShots);
            console.log(`Stats processing - EASHL player ${playerData.name} powerPlayGoals:`, playerData.powerPlayGoals);
            console.log(`Stats processing - EASHL player ${playerData.name} penaltyMinutes:`, playerData.penaltyMinutes);
            console.log(`Stats processing - EASHL player ${playerData.name} shortHandedGoals:`, playerData.shortHandedGoals);
            console.log(`Stats processing - EASHL player ${playerData.name} gameWinningGoals:`, playerData.gameWinningGoals);
            console.log(`Stats processing - EASHL player ${playerData.name} penaltyKillCorsiZone:`, playerData.penaltyKillCorsiZone);

            const playerName = playerData.name || playerData.playername;
            const isGoalie = playerData.position === 'goalie' || playerData.position === 'G'; // EASHL data uses 'goalie' string
            const roleSuffix = isGoalie ? '_goalie' : '_skater';
            
            // Find playerId by matching username - use global map first
            const normalizedName = playerName?.toLowerCase().trim();
            let playerId: string | undefined = normalizedName ? globalUsernameToPlayerId.get(normalizedName) : undefined;
            let primaryUsername = playerId ? globalPlayerIdToPrimaryUsername.get(playerId) : undefined;
            
            // Fallback to roster map if not in global map
            if (!playerId && normalizedName) {
              const playerInfo = rosterUsernameMap.get(normalizedName);
              if (playerInfo) {
                playerId = playerInfo.playerId;
                primaryUsername = playerInfo.primaryUsername;
            } else {
                // If not found anywhere, use name as fallback (unsigned player)
                playerId = playerName || 'Unknown';
                primaryUsername = playerName || 'Unknown';
              }
            } else if (!playerId) {
              playerId = playerName || 'Unknown';
              primaryUsername = playerName || 'Unknown';
            }
            
            // Ensure playerId is always a string
            const finalPlayerId: string = playerId || playerName || 'Unknown';
            
            const matchingKey = `${finalPlayerId}${roleSuffix}`;
            
            // Create stats entry if it doesn't exist (for unsigned players)
            if (!playerStatsMap.has(matchingKey)) {
              const baseStats = isGoalie ? {
                playerId: parseInt(finalPlayerId) || 0,
                name: primaryUsername || playerName || 'Unknown',
                number: 0,
                position: 'G',
                role: 'goalie' as const,
                gamesPlayed: 0, wins: 0, losses: 0, otLosses: 0,
                saves: 0, shotsAgainst: 0, goalsAgainst: 0, savePercentage: 0, goalsAgainstAverage: 0, shutouts: 0, otl: 0,
                isSigned: rosterPlayerIds.has(finalPlayerId)
              } : {
                playerId: parseInt(finalPlayerId) || 0,
                name: primaryUsername || playerName || 'Unknown',
                number: 0,
                position: 'Unknown',
                role: 'skater' as const,
                gamesPlayed: 0, wins: 0, losses: 0, otLosses: 0, goals: 0, assists: 0, points: 0, plusMinus: 0,
                shots: 0, shotPercentage: 0, hits: 0, blockedShots: 0, pim: 0, penaltyAssists: 0, penaltyPercentage: 0, ppg: 0, shg: 0, gwg: 0,
                takeaways: 0, giveaways: 0, passes: 0, passAttempts: 0, passPercentage: 0,
                faceoffsWon: 0, faceoffsLost: 0, faceoffPercentage: 0, interceptions: 0, playerScore: 0, penaltyKillCorsiZone: 0,
                isSigned: rosterPlayerIds.has(finalPlayerId)
              };
              playerStatsMap.set(matchingKey, baseStats);
            }

            if (playerStatsMap.has(matchingKey)) {
              const playerStats = playerStatsMap.get(matchingKey);
              // Update isSigned status if player is in roster
              if (!playerStats.isSigned && rosterPlayerIds.has(finalPlayerId)) {
                playerStats.isSigned = true;
              }
              // Update name to primary username if it changed
              if (primaryUsername && playerStats.name !== primaryUsername) {
                playerStats.name = primaryUsername;
              }
              playerStats.gamesPlayed++;
              if (won) playerStats.wins++;
              else if (lost) playerStats.losses++;
              else if (otLoss) {
                playerStats.otLosses++;
                if (isGoalie) {
                  playerStats.otl = (playerStats.otl || 0) + 1;
                }
              }
              
              if (isGoalie) {
                const saves = playerData.saves || playerData.glsaves || 0;
                const goalsAgainst = playerData.goalsAgainst || playerData.glga || 0;
                // In hockey, shots against = saves + goals against (a goal is a shot on goal)
                // Use glshots from EASHL if available, otherwise calculate from saves + goals
                const shotsAgainst = (playerData.glshots !== undefined && playerData.glshots !== null)
                  ? (parseInt(playerData.glshots) || 0)
                  : ((parseInt(playerData.glsaves) || 0) + (parseInt(playerData.glga) || 0));
                
                playerStats.saves += saves;
                playerStats.shotsAgainst += shotsAgainst;
                playerStats.goalsAgainst += goalsAgainst;
                // Calculate shutouts based on goals against for this specific game (0 goals = 1 shutout)
playerStats.shutouts += (goalsAgainst === 0 && shotsAgainst > 0) ? 1 : 0;
                playerStats.savePercentage = playerStats.shotsAgainst > 0 ? (playerStats.saves / playerStats.shotsAgainst) * 100 : 0;
                playerStats.goalsAgainstAverage = playerStats.gamesPlayed > 0 ? (playerStats.goalsAgainst / playerStats.gamesPlayed) : 0;
              } else {
                const goals = playerData.goals || playerData.skgoals || 0;
                const shotsWithoutGoals = playerData.shots || playerData.skshots || 0;
                // In hockey, goals are shots on goal, so total shots = shots + goals
                const totalShots = shotsWithoutGoals + goals;
                
                playerStats.goals += goals;
                playerStats.assists += playerData.assists || playerData.skassists || 0;
                playerStats.points += goals + (playerData.assists || playerData.skassists || 0);
                playerStats.plusMinus += playerData.plusMinus || playerData.skplusmin || 0;
                playerStats.shots += totalShots;
                playerStats.hits += playerData.hits || playerData.skhits || 0;
                const blockedShotsToAdd = parseInt(playerData.blockedShots) || parseInt(playerData.skbs) || 0;
                playerStats.blockedShots += blockedShotsToAdd;
                if (playerData.name && playerData.name.includes('Liskoilija')) {
                  console.log('🔍 LISKOILIJA BLOCKED SHOTS DEBUG:', {
                    name: playerData.name,
                    blockedShots: playerData.blockedShots,
                    skbs: playerData.skbs,
                    skblk: playerData.skblk,
                    added: blockedShotsToAdd,
                    total: playerStats.blockedShots
                  });
                }
                playerStats.pim += playerData.penaltyMinutes || playerData.skpim || 0;
                playerStats.penaltyAssists += 0; // EASHL data doesn't have penalty assists
                playerStats.ppg += playerData.powerPlayGoals || playerData.skppg || 0;
                playerStats.shg += playerData.shortHandedGoals || playerData.skshg || 0;
                playerStats.gwg += playerData.gameWinningGoals || playerData.skgwg || 0;
                playerStats.takeaways += playerData.takeaways || playerData.sktakeaways || 0;
                playerStats.giveaways += playerData.giveaways || playerData.skgiveaways || 0;
                const passesToAdd = playerData.passes || playerData.passesCompleted || playerData.skpasses || 0;
                playerStats.passes += passesToAdd;
                
                // Calculate passAttempts from passPercentage if passAttempts is not available
                let passAttemptsToAdd = 0;
                if (playerData.passAttempts !== undefined || playerData.skpassattempts !== undefined) {
                  passAttemptsToAdd = playerData.passAttempts || playerData.skpassattempts || 0;
                  console.log(`EASHL - Using direct passAttempts: ${passAttemptsToAdd}`);
                } else if (playerData.passPercentage !== undefined && playerData.passPercentage > 0) {
                  // Calculate passAttempts from passes and passPercentage
                  const passAttempts = Math.round(passesToAdd / (playerData.passPercentage / 100));
                  passAttemptsToAdd = passAttempts;
                  console.log(`EASHL - Calculated passAttempts from passPercentage: ${passAttemptsToAdd} (passes: ${passesToAdd}, passPercentage: ${playerData.passPercentage})`);
                } else {
                  // Fallback: Estimate passAttempts based on passes (assume ~80% pass completion rate)
                  // This is a reasonable estimate for hockey statistics
                  passAttemptsToAdd = Math.round(passesToAdd / 0.8);
                  console.log(`EASHL - Estimated passAttempts for ${playerData.name}: ${passAttemptsToAdd} (passes: ${passesToAdd}, estimated 80% completion rate)`);
                }
                playerStats.passAttempts += passAttemptsToAdd;
                
                console.log(`EASHL - Updated stats for ${playerData.name}: passes=${playerStats.passes}, passAttempts=${playerStats.passAttempts}`);
                playerStats.faceoffsWon += playerData.faceoffsWon || playerData.skfow || 0;
                playerStats.faceoffsLost += playerData.faceoffsLost || playerData.skfol || 0;
                const interceptionsToAdd = parseInt(playerData.interceptions) || parseInt(playerData.skint) || parseInt(playerData.skinterceptions) || 0;
                playerStats.interceptions += interceptionsToAdd;
                if (playerData.name && playerData.name.includes('Liskoilija')) {
                  console.log('🔍 LISKOILIJA INTERCEPTIONS DEBUG:', {
                    name: playerData.name,
                    interceptions: playerData.interceptions,
                    skint: playerData.skint,
                    skinterceptions: playerData.skinterceptions,
                    added: interceptionsToAdd,
                    total: playerStats.interceptions
                  });
                }
                playerStats.playerScore += playerData.playerScore || playerData.score || 0;
                playerStats.penaltyKillCorsiZone += playerData.penaltyKillCorsiZone || playerData.skpkc || 0;
                playerStats.shotPercentage = playerStats.shots > 0 ? (playerStats.goals / playerStats.shots) * 100 : 0;
                playerStats.passPercentage = playerStats.passAttempts > 0 ? (playerStats.passes / playerStats.passAttempts) * 100 : 0;
                const totalFaceoffs = playerStats.faceoffsWon + playerStats.faceoffsLost;
                playerStats.faceoffPercentage = totalFaceoffs > 0 ? (playerStats.faceoffsWon / totalFaceoffs) * 100 : 0;
                const totalPenalties = playerStats.pim + playerStats.penaltyAssists;
                playerStats.penaltyPercentage = totalPenalties > 0 ? (playerStats.pim / totalPenalties) * 100 : 0;
              }
            }
          });
        } else {
          console.warn(`Could not determine our team key for match ${match._id || match.id}. Skipping player stats processing for this match.`);
        }
        } else {
          console.log(`=== NO PLAYER DATA FOUND FOR MATCH ${match._id || match.id} ===`);
          console.log(`Has playerStats:`, !!match.playerStats);
          console.log(`Has eashlData:`, !!match.eashlData);
          console.log(`Has eashlData.players:`, !!(match.eashlData && match.eashlData.players));
        }
        
        console.log(`=== AFTER MATCH ${index + 1} PROCESSING ===`);
        console.log('TeeKneeWeKnee stats after match:', playerStatsMap.get('TeeKneeWeKnee_skater'));
        console.log('AlxSkyes stats after match:', playerStatsMap.get('AlxSkyes_skater'));
        console.log('DANNYZJ7854 stats after match:', playerStatsMap.get('DANNYZJ7854_skater'));
      });

    // Convert map to array and calculate percentages
    const allPlayerStats = Array.from(playerStatsMap.values()).map(stats => {
      stats.shotPercentage = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
      stats.passPercentage = stats.passAttempts > 0 ? (stats.passes / stats.passAttempts) * 100 : 0;
      const totalFaceoffs = stats.faceoffsWon + stats.faceoffsLost;
      stats.faceoffPercentage = totalFaceoffs > 0 ? (stats.faceoffsWon / totalFaceoffs) * 100 : 0;
      // Penalty percentage calculation (if needed for future use)
      const totalPenalties = stats.pim + stats.penaltyAssists;
      stats.penaltyPercentage = totalPenalties > 0 ? (stats.pim / totalPenalties) * 100 : 0;
      
      // Log final pass stats for debugging
      if (stats.role === 'skater' && stats.gamesPlayed > 0) {
        console.log(`=== FINAL PASS STATS for ${stats.name} ===`);
        console.log(`Passes: ${stats.passes}`);
        console.log(`Pass Attempts: ${stats.passAttempts}`);
        console.log(`Pass Percentage: ${stats.passPercentage}%`);
        console.log(`=== END FINAL PASS STATS ===`);
      }
      
      return stats;
    });

    // Categorize players based on their role
    // Include ALL players who played for this club (not just current roster)
    const skaterStats = allPlayerStats.filter(player => 
      player.role === 'skater' && player.gamesPlayed > 0
    );
    
    const goalieStats = allPlayerStats.filter(player => 
      player.role === 'goalie' && player.gamesPlayed > 0
    );
    
    console.log('Player categorization:');
    const allPlayersWithGames = allPlayerStats.filter(p => p.gamesPlayed > 0);
    console.log('All players with games:', allPlayersWithGames.map(p => ({ 
      name: p.name, 
      position: p.position, 
      gp: p.gamesPlayed,
      saves: p.saves,
      shotsAgainst: p.shotsAgainst,
      onRoster: rosterPlayerNames.has(p.name?.toLowerCase()),
      isSigned: p.isSigned
    })));
    console.log('Skaters (all who played):', skaterStats.map(s => ({ name: s.name, position: s.position, gp: s.gamesPlayed, onRoster: rosterPlayerNames.has(s.name?.toLowerCase()), isSigned: s.isSigned })));
    console.log('Goalies (all who played):', goalieStats.map(g => ({ name: g.name, position: g.position, gp: g.gamesPlayed, saves: g.saves, onRoster: rosterPlayerNames.has(g.name?.toLowerCase()), isSigned: g.isSigned })));
    
    console.log('Final skater stats:', skaterStats.length, 'players');
    console.log('Final goalie stats:', goalieStats.length, 'players');
    console.log('Goalie stats details:', goalieStats);
    
    // Log sample skater stats with pass data for debugging
    console.log('=== SAMPLE SKATER STATS WITH PASS DATA ===');
    skaterStats.slice(0, 3).forEach(player => {
      console.log(`${player.name}: passes=${player.passes}, passAttempts=${player.passAttempts}, passPercentage=${player.passPercentage}%`);
    });
    console.log('=== END SAMPLE SKATER STATS ===');
    
    // Log sample skater stats to see aggregated values
    if (skaterStats.length > 0) {
      console.log('=== SAMPLE SKATER STATS ===');
      const teeKnee = skaterStats.find(s => s.name === 'TeeKneeWeKnee');
      const alxSkyes = skaterStats.find(s => s.name === 'AlxSkyes');
      const danny = skaterStats.find(s => s.name === 'DANNYZJ7854');
      
      console.log('TeeKneeWeKnee stats:', {
        name: teeKnee?.name,
        pim: teeKnee?.pim,
        ppg: teeKnee?.ppg,
        shg: teeKnee?.shg,
        gwg: teeKnee?.gwg,
        blockedShots: teeKnee?.blockedShots,
        penaltyKillCorsiZone: teeKnee?.penaltyKillCorsiZone,
        penaltyAssists: teeKnee?.penaltyAssists,
        penaltyPercentage: teeKnee?.penaltyPercentage
      });
      
      console.log('AlxSkyes stats:', {
        name: alxSkyes?.name,
        pim: alxSkyes?.pim,
        ppg: alxSkyes?.ppg,
        shg: alxSkyes?.shg,
        gwg: alxSkyes?.gwg,
        blockedShots: alxSkyes?.blockedShots,
        penaltyKillCorsiZone: alxSkyes?.penaltyKillCorsiZone,
        penaltyAssists: alxSkyes?.penaltyAssists,
        penaltyPercentage: alxSkyes?.penaltyPercentage
      });
      
      console.log('DANNYZJ7854 stats:', {
        name: danny?.name,
        pim: danny?.pim,
        ppg: danny?.ppg,
        shg: danny?.shg,
        gwg: danny?.gwg,
        blockedShots: danny?.blockedShots,
        penaltyKillCorsiZone: danny?.penaltyKillCorsiZone,
        penaltyAssists: danny?.penaltyAssists,
        penaltyPercentage: danny?.penaltyPercentage
      });
    }
    
    return { skaterStats, goalieStats };
  }
}
