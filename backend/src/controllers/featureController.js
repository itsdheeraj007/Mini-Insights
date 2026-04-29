const { computeFeatures } = require('../services/featureService');

/**
 * GET /data/features
 * Returns computed features (growth %, averages) per row, grouped by region+channel.
 * Query params: region, channel, campaign, from, to
 */
const getFeatures = async (req, res) => {
  try {
    const { region, channel, campaign, from, to } = req.query;
    const data = await computeFeatures({ region, channel, campaign, from, to });

    res.json({ count: data.length, data });
  } catch (err) {
    console.error('[FeatureController] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getFeatures };
