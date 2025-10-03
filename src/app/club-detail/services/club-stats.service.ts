import { Injectable } from '@angular/core';

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
  ppg: number;
  shg: number;
  gwg: number;
  takeaways: number;
  giveaways: number;
  passes: number;
  passAttempts: number;
  passPercentage: number;
  faceoffsWon: number;
  faceoffPercentage: number;
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

  /**
   * Process player stats from matches for a club
   */
  processPlayerStatsFromMatches(
    clubMatches: any[],
    roster: any[],
    backendClub: any
  ): { skaterStats: SkaterStats[], goalieStats: GoalieStats[] } {
    console.log('=== CLUB STATS SERVICE DEBUG ===');
    console.log('Processing player stats from matches for club:', backendClub?.name);
    console.log('Club matches available:', clubMatches.length);
    console.log('Roster players:', roster.length);
    console.log('========================');
    
    // First, collect all players who played for this team from match data (including unsigned ones)
    const allPlayersWhoPlayed = new Set<string>();
    
    clubMatches.forEach(match => {
      // Determine if the current club is home or away
      const isHomeTeam = match.homeClubId?._id === backendClub?._id || match.homeTeam === backendClub?.name;
      const isAwayTeam = match.awayClubId?._id === backendClub?._id || match.awayTeam === backendClub?.name;

      if (match.eashlData?.manualEntry && match.playerStats) {
        console.log(`Collecting manual entry players for match ${match._id || match.id}`);
        const ourPlayers = match.playerStats.filter((player: any) => {
          const matches = player.team === backendClub?.name;
          return matches;
        });
        ourPlayers.forEach((playerData: any) => {
          if (playerData && playerData.name) {
            allPlayersWhoPlayed.add(playerData.name);
          }
        });
      } else if (match.eashlData.players) {
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
          } else {
            console.log(`Team ${teamKey} is not an array or object, skipping...`);
            continue;
          }
          
          // Check if any player in this team is on our roster
          const teamContainsRosterPlayer = teamPlayers.some((player: any) => 
            roster.some(rosterPlayer => rosterPlayer.gamertag === player.name)
          );
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
            const teamPlayers = match.eashlData.players[teamKey];
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
          const teamContainsRosterPlayer = teamPlayers.some((player: any) => 
            roster.some(rosterPlayer => rosterPlayer.gamertag === player.name)
          );
          console.log('Team', ourTeamKey, 'contains roster players:', teamContainsRosterPlayer);
          console.log('Roster players:', roster.map(p => p.gamertag).join(', '));
          console.log('Team players:', teamPlayers.map((p: any) => p.name).join(', '));

          teamPlayers.forEach((playerData: any) => {
            if (playerData && playerData.name) {
              console.log('Adding EASHL player to collection:', {name: playerData.name, team: playerData.team, clubname: playerData.clubname, ishome: playerData.ishome});
              allPlayersWhoPlayed.add(playerData.name);
            }
          });
        } else {
          console.warn(`Could not determine our team key for match ${match._id || match.id}. Skipping player collection for this match.`);
        }
      }
    });

    // Create a set of roster player names for quick lookup
    const rosterPlayerNames = new Set(roster.map(p => p.gamertag).filter(Boolean));
    console.log('Roster player names for stats processing:', Array.from(rosterPlayerNames));

    // Initialize player stats map with all players who played for this club
    const initialPlayerStatsMap = new Map<string, any>();
    allPlayersWhoPlayed.forEach(playerName => {
      const player = roster.find(p => p.gamertag === playerName); // Find roster player to get _id/id and number
      const playerId = player?._id || player?.id || playerName; // Use roster ID if available, otherwise name
      const playerNumber = player?.number || 0;

      const baseSkaterStats: SkaterStats = {
        playerId: parseInt(playerId) || 0,
        name: playerName,
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
        isSigned: rosterPlayerNames.has(playerName)
      };

      const baseGoalieStats: GoalieStats = {
        playerId: parseInt(playerId) || 0,
        name: playerName,
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
        isSigned: rosterPlayerNames.has(playerName)
      };

      // Create separate entries for skater and goalie roles
      initialPlayerStatsMap.set(`${playerName}_skater`, baseSkaterStats);
      initialPlayerStatsMap.set(`${playerName}_goalie`, baseGoalieStats);
    });

    // Also initialize stats for roster players who might not have played yet
    roster.forEach(player => {
      if (!player || !player.gamertag) return;

      const playerName = player.gamertag;
      const playerId = player._id || player.id;
      const playerNumber = player.number || 0;

      if (!initialPlayerStatsMap.has(`${playerName}_skater`)) {
        const baseSkaterStats: SkaterStats = {
          playerId: parseInt(playerId) || 0,
          name: playerName,
          number: playerNumber,
          position: 'Unknown',
          role: 'skater',
          gamesPlayed: 0, wins: 0, losses: 0, otLosses: 0, goals: 0, assists: 0, points: 0, plusMinus: 0,
          shots: 0, shotPercentage: 0, hits: 0, blockedShots: 0, pim: 0, ppg: 0, shg: 0, gwg: 0,
          takeaways: 0, giveaways: 0, passes: 0, passAttempts: 0, passPercentage: 0, faceoffsWon: 0,
          faceoffPercentage: 0, playerScore: 0, penaltyKillCorsiZone: 0,
          isSigned: true
        };
        initialPlayerStatsMap.set(`${playerName}_skater`, baseSkaterStats);
      }

      if (!initialPlayerStatsMap.has(`${playerName}_goalie`)) {
        const baseGoalieStats: GoalieStats = {
          playerId: parseInt(playerId) || 0,
          name: playerName,
          number: playerNumber,
          position: 'G',
          role: 'goalie',
          gamesPlayed: 0, wins: 0, losses: 0, otLosses: 0,
          saves: 0, shotsAgainst: 0, goalsAgainst: 0, savePercentage: 0, goalsAgainstAverage: 0, shutouts: 0, otl: 0,
          isSigned: true
        };
        initialPlayerStatsMap.set(`${playerName}_goalie`, baseGoalieStats);
      }
    });

    // Use the initialized map
    const playerStatsMap = initialPlayerStatsMap;

    console.log('Player stats map before processing matches:', Array.from(playerStatsMap.keys()));

    // Process matches to calculate stats
    console.log('Processing', clubMatches.length, 'club matches for stats calculation');
    clubMatches.forEach((match, index) => {
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
        lost = match.homeScore < match.awayScore && !match.otWin && !match.soWin;
        otLoss = match.homeScore < match.awayScore && (match.otWin || match.soWin);
      } else if (isAwayTeamInMatch) {
        won = match.awayScore > match.homeScore;
        lost = match.awayScore < match.homeScore && !match.otWin && !match.soWin;
        otLoss = match.awayScore < match.homeScore && (match.otWin || match.soWin);
      }

      if (match.eashlData?.manualEntry && match.playerStats) {
        console.log(`Collecting manual entry players for match ${match._id || match.id}`);
        const ourPlayers = match.playerStats.filter((player: any) => player.team === backendClub?.name);
        ourPlayers.forEach((playerData: any) => {
          if (!playerData || !playerData.name) return;

          const playerName = playerData.name;
          const isGoalie = playerData.position === 'G' || playerData.position === 'goalie';
          const roleSuffix = isGoalie ? '_goalie' : '_skater';
          
          let matchingKey = null;
          
          if (playerStatsMap.has(`${playerName}${roleSuffix}`)) {
            matchingKey = `${playerName}${roleSuffix}`;
          } else {
            for (const [key, stats] of playerStatsMap.entries()) {
              if (key.endsWith(roleSuffix) && (stats.name === playerName || 
                  stats.name.includes(playerName) || 
                  playerName.includes(stats.name))) {
                matchingKey = key;
                break;
              }
            }
          }

          if (matchingKey) {
            const playerStats = playerStatsMap.get(matchingKey);
            playerStats.gamesPlayed++;
            if (won) playerStats.wins++;
            else if (lost) playerStats.losses++;
            else if (otLoss) playerStats.otLosses++;

            if (isGoalie) {
              playerStats.saves += playerData.saves || 0;
              playerStats.shotsAgainst += playerData.shotsAgainst || 0;
              playerStats.goalsAgainst += playerData.goalsAgainst || 0;
              playerStats.shutouts += (playerData.goalsAgainst === 0 && playerData.gamesPlayed > 0) ? 1 : 0;
              playerStats.savePercentage = playerStats.shotsAgainst > 0 ? (playerStats.saves / playerStats.shotsAgainst) * 100 : 0;
              playerStats.goalsAgainstAverage = playerStats.gamesPlayed > 0 ? (playerStats.goalsAgainst / playerStats.gamesPlayed) : 0;
            } else {
              playerStats.goals += playerData.goals || 0;
              playerStats.assists += playerData.assists || 0;
              playerStats.points += (playerData.goals || 0) + (playerData.assists || 0);
              playerStats.plusMinus += playerData.plusMinus || 0;
              playerStats.shots += playerData.shots || 0;
              playerStats.hits += playerData.hits || 0;
              playerStats.blockedShots += playerData.blockedShots || 0;
              playerStats.pim += playerData.pim || 0;
              playerStats.ppg += playerData.ppg || 0;
              playerStats.shg += playerData.shg || 0;
              playerStats.gwg += playerData.gwg || 0;
              playerStats.takeaways += playerData.takeaways || 0;
              playerStats.giveaways += playerData.giveaways || 0;
              playerStats.passes += playerData.passes || 0;
              playerStats.passAttempts += playerData.passAttempts || 0;
              playerStats.faceoffsWon += playerData.faceoffsWon || 0;
              playerStats.playerScore += playerData.playerScore || 0;
              playerStats.penaltyKillCorsiZone += playerData.penaltyKillCorsiZone || 0;
              playerStats.shotPercentage = playerStats.shots > 0 ? (playerStats.goals / playerStats.shots) * 100 : 0;
              playerStats.passPercentage = playerStats.passAttempts > 0 ? (playerStats.passes / playerStats.passAttempts) * 100 : 0;
              playerStats.faceoffPercentage = (playerStats.faceoffsWon + (playerStats.faceoffsWon || 0)) > 0 ? 
                (playerStats.faceoffsWon / (playerStats.faceoffsWon + (playerStats.faceoffsWon || 0))) * 100 : 0;
            }
          }
        });
      } else if (match.eashlData.players) {
        // Process EASHL data
        const teamKeys = Object.keys(match.eashlData.players);
        
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
          } else {
            console.log(`Stats processing - team ${teamKey} is not an array or object, skipping...`);
            continue;
          }
          
          const teamContainsRosterPlayer = teamPlayers.some((player: any) => 
            roster.some(rosterPlayer => rosterPlayer.gamertag === player.name)
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
          
          teamPlayers.forEach((playerData: any) => {
            if (!playerData || !playerData.name) return;

            const playerName = playerData.name;
            const isGoalie = playerData.position === 'goalie'; // EASHL data uses 'goalie' string
            const roleSuffix = isGoalie ? '_goalie' : '_skater';
            
            let matchingKey = null;
            
            if (playerStatsMap.has(`${playerName}${roleSuffix}`)) {
              matchingKey = `${playerName}${roleSuffix}`;
            } else {
              for (const [key, stats] of playerStatsMap.entries()) {
                if (key.endsWith(roleSuffix) && (stats.name === playerName || 
                    stats.name.includes(playerName) || 
                    playerName.includes(stats.name))) {
                  matchingKey = key;
                  break;
                }
              }
            }

            if (matchingKey) {
              const playerStats = playerStatsMap.get(matchingKey);
              playerStats.gamesPlayed++;
              if (won) playerStats.wins++;
              else if (lost) playerStats.losses++;
              else if (otLoss) playerStats.otLosses++;
              
              if (isGoalie) {
                playerStats.saves += playerData.saves || 0;
                playerStats.shotsAgainst += playerData.shotsAgainst || 0;
                playerStats.goalsAgainst += playerData.goalsAgainst || 0;
                playerStats.shutouts += (playerData.goalsAgainst === 0 && playerData.gamesPlayed > 0) ? 1 : 0;
                playerStats.savePercentage = playerStats.shotsAgainst > 0 ? (playerStats.saves / playerStats.shotsAgainst) * 100 : 0;
                playerStats.goalsAgainstAverage = playerStats.gamesPlayed > 0 ? (playerStats.goalsAgainst / playerStats.gamesPlayed) : 0;
              } else {
                playerStats.goals += playerData.goals || 0;
                playerStats.assists += playerData.assists || 0;
                playerStats.points += (playerData.goals || 0) + (playerData.assists || 0);
                playerStats.plusMinus += playerData.plusMinus || 0;
                playerStats.shots += playerData.shots || 0;
                playerStats.hits += playerData.hits || 0;
                playerStats.blockedShots += playerData.blockedShots || 0;
                playerStats.pim += playerData.pim || 0;
                playerStats.ppg += playerData.ppg || 0;
                playerStats.shg += playerData.shg || 0;
                playerStats.gwg += playerData.gwg || 0;
                playerStats.takeaways += playerData.takeaways || 0;
                playerStats.giveaways += playerData.giveaways || 0;
                playerStats.passes += playerData.passes || 0;
                playerStats.passAttempts += playerData.passAttempts || 0;
                playerStats.faceoffsWon += playerData.faceoffsWon || 0;
                playerStats.playerScore += playerData.playerScore || 0;
                playerStats.penaltyKillCorsiZone += playerData.penaltyKillCorsiZone || 0;
                playerStats.shotPercentage = playerStats.shots > 0 ? (playerStats.goals / playerStats.shots) * 100 : 0;
                playerStats.passPercentage = playerStats.passAttempts > 0 ? (playerStats.passes / playerStats.passAttempts) * 100 : 0;
                playerStats.faceoffPercentage = (playerStats.faceoffsWon + (playerStats.faceoffsWon || 0)) > 0 ? 
                  (playerStats.faceoffsWon / (playerStats.faceoffsWon + (playerStats.faceoffsWon || 0))) * 100 : 0;
              }
            }
          });
        } else {
          console.warn(`Could not determine our team key for match ${match._id || match.id}. Skipping player stats processing for this match.`);
        }
      }
    });

    // Convert map to array and calculate percentages
    const allPlayers = Array.from(playerStatsMap.values()).map(stats => {
      stats.shotPercentage = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
      stats.passPercentage = stats.passAttempts > 0 ? (stats.passes / stats.passAttempts) * 100 : 0;
      stats.faceoffPercentage = (stats.faceoffsWon + (stats.faceoffsWon || 0)) > 0 ? 
        (stats.faceoffsWon / (stats.faceoffsWon + (stats.faceoffsWon || 0))) * 100 : 0;
      return stats;
    });

    // Categorize players based on their role
    // Include ALL players who played for this club (not just current roster)
    const skaterStats = allPlayers.filter(player => 
      player.role === 'skater' && player.gamesPlayed > 0
    );
    
    const goalieStats = allPlayers.filter(player => 
      player.role === 'goalie' && player.gamesPlayed > 0
    );
    
    console.log('Player categorization:');
    const allPlayersWithGames = allPlayers.filter(p => p.gamesPlayed > 0);
    console.log('All players with games:', allPlayersWithGames.map(p => ({ 
      name: p.name, 
      position: p.position, 
      gp: p.gamesPlayed,
      saves: p.saves,
      shotsAgainst: p.shotsAgainst,
      onRoster: rosterPlayerNames.has(p.name),
      isSigned: p.isSigned
    })));
    console.log('Skaters (all who played):', skaterStats.map(s => ({ name: s.name, position: s.position, gp: s.gamesPlayed, onRoster: rosterPlayerNames.has(s.name), isSigned: s.isSigned })));
    console.log('Goalies (all who played):', goalieStats.map(g => ({ name: g.name, position: g.position, gp: g.gamesPlayed, saves: g.saves, onRoster: rosterPlayerNames.has(g.name), isSigned: g.isSigned })));
    
    console.log('Final skater stats:', skaterStats.length, 'players');
    console.log('Final goalie stats:', goalieStats.length, 'players');
    console.log('Goalie stats details:', goalieStats);
    
    return { skaterStats, goalieStats };
  }
}
