const { getSalesWithKPIs, getAggregatedKPIs } = require('../services/kpiService');

/**
 * GET /data/kpis
 * Returns each sales row with computed KPIs attached.
 * Query params: region, channel, campaign, from, to
 */
const getKPIs = async (req, res) => {
  try {
    const { region, channel, campaign, from, to } = req.query;
    const data = await getSalesWithKPIs({ region, channel, campaign, from, to });

    res.json({ count: data.length, data });
  } catch (err) {
    console.error('[KPIController] getKPIs error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /data/kpis/summary
 * Returns aggregated (totals-based) KPIs across all filtered rows.
 */
const getKPISummary = async (req, res) => {
  try {
    const { region, channel, campaign, from, to } = req.query;
    const summary = await getAggregatedKPIs({ region, channel, campaign, from, to });

    res.json(summary);
  } catch (err) {
    console.error('[KPIController] getKPISummary error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getKPIs, getKPISummary };
