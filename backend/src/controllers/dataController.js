const { getSalesData } = require('../services/dataService');

/**
 * GET /data
 * Query params: region, channel, campaign, from, to
 */
const getData = async (req, res) => {
  try {
    const { region, channel, campaign, from, to } = req.query;
    const data = await getSalesData({ region, channel, campaign, from, to });

    res.json({
      count: data.length,
      data,
    });
  } catch (err) {
    console.error('[DataController] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getData };
