import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

// Get stats for a season
router.get('/season/:seasonId', async (req: Request, res: Response) => {
  try {
    const { seasonId } = req.params;
    
    // Mock data for testing - replace with your actual database query later
    const mockResponse = {
      playerStats: [
        {
          playerId: "1",
          seasonId: seasonId,
          playerName: "John Doe",
          profilePic: "assets/images/default-profile.png",
          teamLogo: "assets/images/team-logo.png",
          teamId: "team1",
          gamesPlayed: 10,
          goals: 5,
          assists: 7,
          points: 12,
          plusMinus: 3,
          penaltyMinutes: 6,
          gameWinningGoals: 1,
          shotsTaken: 20,
          timeOnIce: 200,
          hits: 15,
          powerPlayGoals: 2,
          shortHandedGoals: 0,
          deviationFromGoal: 1.2,
          drawPercentage: 55.5,
          shotsAgainst: 0,
          division: "Elite"
        }
      ],
      goalieStats: [
        {
          playerId: "2",
          playerName: "Jane Smith",
          profilePic: "assets/images/default-profile.png",
          teamId: "team1",
          teamLogo: "assets/images/team-logo.png",
          seasonId: seasonId,
          gamesPlayed: 8,
          wins: 5,
          losses: 2,
          overtimeLosses: 1,
          goalsAgainst: 15,
          goalsAgainstAverage: 1.88,
          savePercentage: 0.925,
          shutouts: 2,
          timeOnIce: 480,
          shotsAgainst: 200
        }
      ]
    };

    res.json(mockResponse);
  } catch (error) {
    console.error('Error fetching season stats:', error);
    res.status(500).json({ message: 'Error fetching season stats' });
  }
});

export default router; 