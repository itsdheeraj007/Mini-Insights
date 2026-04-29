/**
 * Rule-based insight generation.
 * Each KPI + signal type combination has a tailored explanation.
 * This runs without any LLM — fast, deterministic, and free.
 */

const KPI_LABELS = {
  cost_per_demo: 'Cost Per Demo',
  demo_rate:     'Demo Rate',
  close_rate:    'Close Rate',
};

const pct = (value) => `${Math.abs(Math.round(value * 100))}%`;

/**
 * Generate a full insight object from a signal row.
 *
 * @param {Object} signal - a signals table row
 * @returns {Object} insight fields: title, description, why, impact, recommendation
 */
const buildInsight = (signal) => {
  const { kpi_id, type, value, severity, region, channel, campaign } = signal;
  const kpiName  = signal.kpis?.name || 'unknown_kpi';
  const kpiLabel = KPI_LABELS[kpiName] || kpiName;
  const direction = type === 'spike' ? 'spiked' : 'dropped';
  const segment  = [region, channel, campaign].filter(Boolean).join(' / ');

  const title = `${kpiLabel} ${direction} ${pct(value)} in ${segment}`;

  const description = type === 'spike'
    ? `${kpiLabel} increased by ${pct(value)} compared to the previous day in the ${segment} segment. Severity: ${severity}.`
    : `${kpiLabel} fell by ${pct(value)} compared to the previous day in the ${segment} segment. Severity: ${severity}.`;

  const { why, impact, recommendation } = getRuleBasedExplanation(kpiName, type, severity, segment);

  return { title, description, why, impact, recommendation };
};

/**
 * Rule-based why/impact/recommendation per KPI + signal type.
 */
const getRuleBasedExplanation = (kpiName, type, severity, segment) => {
  const rules = {
    demo_rate: {
      spike: {
        why:            `A surge in demo bookings relative to leads in ${segment} suggests a high-intent audience or a particularly effective campaign touchpoint.`,
        impact:         'Higher demo rates increase the pipeline volume and improve the chances of revenue conversion.',
        recommendation: 'Identify the specific creative or campaign element driving this and replicate it in similar segments.',
      },
      drop: {
        why:            `A decline in demo rate in ${segment} may indicate lead quality issues, a mismatched audience, or friction in the booking process.`,
        impact:         'Fewer demos mean a thinner pipeline and potential revenue shortfall in the coming weeks.',
        recommendation: 'Audit the lead source quality, review landing page conversion, and check if the booking flow is functioning correctly.',
      },
    },
    close_rate: {
      spike: {
        why:            `A jump in close rate in ${segment} could reflect stronger sales execution, better-qualified leads, or a compelling offer.`,
        impact:         'Higher close rates directly improve revenue efficiency — more revenue from the same demo volume.',
        recommendation: 'Document what changed in the sales approach this period and consider rolling it out across other segments.',
      },
      drop: {
        why:            `A drop in close rate in ${segment} may indicate demos are not converting due to pricing objections, poor fit, or weak follow-up.`,
        impact:         'Revenue per demo decreases, reducing overall efficiency of the pipeline.',
        recommendation: 'Review call recordings or demo feedback, revisit objection handling, and assess if leads are properly qualified before demoing.',
      },
    },
    cost_per_demo: {
      spike: {
        why:            `Rising cost per demo in ${segment} suggests spend is increasing faster than demo volume, possibly due to audience fatigue or poor targeting.`,
        impact:         'Higher acquisition costs compress margins and reduce the ROI of the campaign.',
        recommendation: 'Pause underperforming ad sets, refresh creatives, and test new audience segments to bring costs down.',
      },
      drop: {
        why:            `A decrease in cost per demo in ${segment} indicates improved spend efficiency — more demos are being booked per dollar spent.`,
        impact:         'Lower acquisition costs improve campaign ROI and allow more budget to be deployed profitably.',
        recommendation: 'Increase budget allocation to this segment while the efficiency window remains open.',
      },
    },
  };

  return (
    rules[kpiName]?.[type] ?? {
      why:            'An unusual movement was detected in this metric.',
      impact:         'This may affect downstream business performance.',
      recommendation: 'Investigate the root cause and monitor closely over the next few days.',
    }
  );
};

/**
 * Generate tags for an insight based on signal properties.
 * @param {Object} signal
 * @returns {string[]}
 */
const buildTags = (signal) => {
  const tags = [];
  const kpiName = signal.kpis?.name;

  if (signal.type)     tags.push(signal.type);              // spike / drop
  if (signal.severity) tags.push(signal.severity);          // high / medium / low
  if (kpiName)         tags.push(kpiName);                  // cost_per_demo / etc.
  if (signal.region)   tags.push(signal.region.toLowerCase());
  if (signal.channel)  tags.push(signal.channel.toLowerCase());

  return tags;
};

module.exports = { buildInsight, buildTags };
