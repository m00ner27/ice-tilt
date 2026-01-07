/// <reference lib="webworker" />

// Web Worker for heavy data processing
addEventListener('message', ({ data }) => {
  const { type, payload } = data;
  
  switch (type) {
    case 'PROCESS_CLUB_MATCHES':
      const result = processClubMatches(payload);
      postMessage({ type: 'CLUB_MATCHES_PROCESSED', payload: result });
      break;
      
    case 'PROCESS_PLAYER_STATS':
      const statsResult = processPlayerStats(payload);
      postMessage({ type: 'PLAYER_STATS_PROCESSED', payload: statsResult });
      break;
      
    default:
      postMessage({ type: 'ERROR', payload: 'Unknown message type' });
  }
});

function processClubMatches(payload: any) {
  const { matches, clubName } = payload;
  
  // Filter matches for the club
  const clubMatches = matches.filter((match: any) => {
    const homeMatch = match.homeClub?.name === clubName;
    const awayMatch = match.awayClub?.name === clubName;
    const homeTeamMatch = match.homeTeam === clubName;
    const awayTeamMatch = match.awayTeam === clubName;
    const homeClubIdMatch = match.homeClub?._id === clubName;
    const awayClubIdMatch = match.awayClub?._id === clubName;
    
    return homeMatch || awayMatch || homeTeamMatch || awayTeamMatch || homeClubIdMatch || awayClubIdMatch;
  });
  
  return {
    clubMatches,
    totalMatches: clubMatches.length
  };
}

function processPlayerStats(payload: any) {
  const { players, matches } = payload;
  
  // Process player statistics
  const playerStats = players.map((player: any) => {
    const playerMatches = matches.filter((match: any) => {
      // Logic to determine if player played in this match
      return match.players && match.players.some((p: any) => p.id === player.id);
    });
    
    return {
      ...player,
      gamesPlayed: playerMatches.length,
      // Add other calculated stats here
    };
  });
  
  return {
    playerStats,
    totalPlayers: playerStats.length
  };
}
