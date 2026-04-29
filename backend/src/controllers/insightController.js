const { getInsights, getInsightById } = require('../services/insightService');

/**
 * GET /insights
 * Returns all insights with tags and signal context.
 */
const listInsights = async (req, res) => {
  try {
    const data = await getInsights();
    res.json({ count: data.length, data });
  } catch (err) {
    console.error('[InsightController] listInsights error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /insights/:id
 * Returns a single insight with full detail.
 */
const getInsight = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid insight ID.' });
    }

    const data = await getInsightById(id);
    res.json(data);
  } catch (err) {
    console.error('[InsightController] getInsight error:', err.message);
    res.status(404).json({ error: 'Insight not found.' });
  }
};

module.exports = { listInsights, getInsight };
