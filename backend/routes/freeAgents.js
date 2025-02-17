router.get('/season/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;
    // Your logic to fetch free agents for the season
    const freeAgents = await FreeAgent.find({ seasonId });
    res.json(freeAgents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}); 