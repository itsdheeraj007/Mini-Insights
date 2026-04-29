const { getSalesData } = require('./dataService');
const { computeKPIs } = require('../utils/kpiHelpers');

/**
 * Fetch sales rows and attach computed KPIs to each row.
 * KPIs are NOT stored — computed on the fly.
 *
 * @param {Object} filters - same filters as getSalesData
 * @returns {Promise<Array>} rows with kpis field attached
 */
const getSalesWithKPIs = async (filters = {}) => {
  const rows = await getSalesData(filters);

  return rows.map((row) => ({
    ...row,
    kpis: computeKPIs(row),
  }));
};

/**
 * Compute aggregated KPI averages across all filtered rows.
 * Useful for summary cards on the dashboard.
 *
 * @param {Object} filters
 * @returns {Promise<Object>} averaged KPI values
 */
const getAggregatedKPIs = async (filters = {}) => {
  const rows = await getSalesData(filters);

  if (rows.length === 0) {
    return { cost_per_demo: null, demo_rate: null, close_rate: null, row_count: 0 };
  }

  const totalSpend       = rows.reduce((sum, r) => sum + Number(r.spend), 0);
  const totalLeads       = rows.reduce((sum, r) => sum + r.leads, 0);
  const totalDemos       = rows.reduce((sum, r) => sum + r.demos, 0);
  const totalConversions = rows.reduce((sum, r) => sum + r.conversions, 0);

  const round = (v, d = 4) => Math.round(v * 10 ** d) / 10 ** d;

  return {
    cost_per_demo: totalDemos > 0 ? round(totalSpend / totalDemos)       : null,
    demo_rate:     totalLeads > 0 ? round(totalDemos / totalLeads)        : null,
    close_rate:    totalDemos > 0 ? round(totalConversions / totalDemos)  : null,
    row_count: rows.length,
  };
};

module.exports = { getSalesWithKPIs, getAggregatedKPIs };
