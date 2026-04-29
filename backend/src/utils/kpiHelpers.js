/**
 * KPI calculation helpers.
 * All functions are pure — no side effects, easy to unit test.
 * Division by zero always returns null (not 0 or Infinity).
 */

const round = (value, decimals = 4) =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;

const costPerDemo = (spend, demos) =>
  demos > 0 ? round(spend / demos) : null;

const demoRate = (demos, leads) =>
  leads > 0 ? round(demos / leads) : null;

const closeRate = (conversions, demos) =>
  demos > 0 ? round(conversions / demos) : null;

/**
 * Compute all KPIs for a single sales row.
 * @param {Object} row - a fact_sales row
 * @returns {Object} KPI values
 */
const computeKPIs = (row) => ({
  cost_per_demo: costPerDemo(Number(row.spend), row.demos),
  demo_rate:     demoRate(row.demos, row.leads),
  close_rate:    closeRate(row.conversions, row.demos),
});

module.exports = { computeKPIs, costPerDemo, demoRate, closeRate };
