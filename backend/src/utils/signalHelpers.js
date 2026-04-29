/**
 * Signal detection helpers.
 * Thresholds are defined as constants so they're easy to tune.
 */

const THRESHOLDS = {
  spike: 0.30,   // growth > 30%  → spike
  drop:  -0.20,  // growth < -20% → drop
};

const SEVERITY = {
  spike: [
    { min: 0.75, level: 'high' },
    { min: 0.50, level: 'medium' },
    { min: 0.30, level: 'low' },
  ],
  drop: [
    { max: -0.50, level: 'high' },
    { max: -0.35, level: 'medium' },
    { max: -0.20, level: 'low' },
  ],
};

/**
 * Determine severity level for a spike.
 * @param {number} growth_pct
 * @returns {'low'|'medium'|'high'}
 */
const spikeSeverity = (growth_pct) => {
  for (const { min, level } of SEVERITY.spike) {
    if (growth_pct >= min) return level;
  }
  return 'low';
};

/**
 * Determine severity level for a drop.
 * @param {number} growth_pct
 * @returns {'low'|'medium'|'high'}
 */
const dropSeverity = (growth_pct) => {
  for (const { max, level } of SEVERITY.drop) {
    if (growth_pct <= max) return level;
  }
  return 'low';
};

/**
 * Evaluate a single growth_pct value and return a signal descriptor or null.
 *
 * @param {number|null} growth_pct
 * @returns {{ type: 'spike'|'drop', severity: string } | null}
 */
const detectSignal = (growth_pct) => {
  if (growth_pct === null) return null;

  if (growth_pct > THRESHOLDS.spike) {
    return { type: 'spike', severity: spikeSeverity(growth_pct) };
  }

  if (growth_pct < THRESHOLDS.drop) {
    return { type: 'drop', severity: dropSeverity(growth_pct) };
  }

  return null;
};

module.exports = { detectSignal, THRESHOLDS };
