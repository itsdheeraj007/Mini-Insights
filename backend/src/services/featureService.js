const { getSalesData } = require('./dataService');
const { computeKPIs } = require('../utils/kpiHelpers');
const { growthPct, average, computeGrowthSeries } = require('../utils/featureHelpers');

/**
 * Build a group key from a row for segmented analysis.
 * We track features per region+channel combination.
 */
const groupKey = (row) => `${row.region}__${row.channel}`;

/**
 * Compute features for all sales data, grouped by region+channel.
 *
 * For each group:
 *   - Rows are sorted by date (ascending)
 *   - Each KPI gets a day-over-day growth %
 *   - Each KPI gets a rolling average across the group
 *
 * @param {Object} filters
 * @returns {Promise<Array>} array of feature objects, one per row
 */
const computeFeatures = async (filters = {}) => {
  const rows = await getSalesData(filters);

  // Group rows by region+channel, preserving date order
  const groups = {};
  for (const row of rows) {
    const key = groupKey(row);
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  const result = [];

  for (const [key, groupRows] of Object.entries(groups)) {
    // Compute KPIs for every row in the group
    const kpiRows = groupRows.map((row) => ({
      ...row,
      kpis: computeKPIs(row),
    }));

    const kpiNames = ['cost_per_demo', 'demo_rate', 'close_rate'];

    // Pre-compute growth series and averages per KPI
    const growthSeries = {};
    const averages = {};

    for (const kpi of kpiNames) {
      const values = kpiRows.map((r) => r.kpis[kpi]);
      growthSeries[kpi] = computeGrowthSeries(values);
      averages[kpi]     = average(values);
    }

    // Attach features to each row
    kpiRows.forEach((row, i) => {
      const features = {};

      for (const kpi of kpiNames) {
        features[kpi] = {
          value:      row.kpis[kpi],
          growth_pct: growthSeries[kpi][i],
          average:    averages[kpi],
        };
      }

      result.push({
        id:       row.id,
        date:     row.date,
        region:   row.region,
        channel:  row.channel,
        campaign: row.campaign,
        features,
      });
    });
  }

  // Return sorted by date across all groups
  result.sort((a, b) => new Date(a.date) - new Date(b.date));

  return result;
};

module.exports = { computeFeatures };
