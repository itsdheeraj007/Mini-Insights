/**
 * Feature calculation helpers.
 * Features are derived values computed on top of KPI arrays.
 * All functions are pure — no side effects.
 */

const round = (value, decimals = 4) =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;

/**
 * Compute day-over-day growth % between two values.
 * Returns null if previous value is 0 or null (can't divide).
 *
 * @param {number|null} current
 * @param {number|null} previous
 * @returns {number|null} growth as a decimal (0.3 = 30% growth)
 */
const growthPct = (current, previous) => {
  if (previous === null || previous === 0 || current === null) return null;
  return round((current - previous) / Math.abs(previous));
};

/**
 * Compute the simple average of an array of numbers.
 * Ignores null values.
 *
 * @param {Array<number|null>} values
 * @returns {number|null}
 */
const average = (values) => {
  const valid = values.filter((v) => v !== null && !isNaN(v));
  if (valid.length === 0) return null;
  return round(valid.reduce((sum, v) => sum + v, 0) / valid.length);
};

/**
 * Given an array of KPI values (one per day, in chronological order),
 * attach day-over-day growth % to each entry.
 *
 * @param {Array<number|null>} kpiValues - ordered array of KPI values
 * @returns {Array<number|null>} parallel array of growth % values
 */
const computeGrowthSeries = (kpiValues) =>
  kpiValues.map((val, i) => (i === 0 ? null : growthPct(val, kpiValues[i - 1])));

module.exports = { growthPct, average, computeGrowthSeries };
