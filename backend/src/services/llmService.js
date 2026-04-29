const { Ollama } = require('ollama');
require('dotenv').config();

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });
const MODEL  = process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Build a rich context object for the LLM from a signal + its feature row.
 * This gives the model actual before/after numbers, not just growth %.
 */
const buildContext = (signal, featureRow) => {
  const kpiLabel  = signal.kpis?.display_name || signal.kpis?.name || 'KPI';
  const direction = signal.type === 'spike' ? 'increased' : 'decreased';
  const pct       = Math.abs(Math.round(signal.value * 100));
  const segment   = [signal.region, signal.channel, signal.campaign].filter(Boolean).join(' / ');

  // Build per-KPI detail lines if we have feature context
  let kpiLines = '';
  if (featureRow?.features) {
    const lines = Object.entries(featureRow.features).map(([kpi, data]) => {
      const prev    = data.value !== null && data.growth_pct !== null
        ? (data.value / (1 + data.growth_pct)).toFixed(4)
        : null;
      const avgLine = data.average !== null ? `, rolling avg: ${data.average}` : '';
      const prevLine = prev !== null ? `, previous: ${prev}` : '';
      const growthLine = data.growth_pct !== null
        ? ` (${data.growth_pct > 0 ? '+' : ''}${Math.round(data.growth_pct * 100)}% DoD)`
        : '';
      return `  - ${kpi}: current=${data.value}${prevLine}${growthLine}${avgLine}`;
    });
    kpiLines = '\nAll KPI values for this segment on this date:\n' + lines.join('\n');
  }

  // Raw sales metrics if available
  let rawMetrics = '';
  if (featureRow) {
    rawMetrics = `\nRaw metrics (current day): leads=${featureRow.leads ?? 'N/A'}, demos=${featureRow.demos ?? 'N/A'}, conversions=${featureRow.conversions ?? 'N/A'}, spend=${featureRow.spend ?? 'N/A'}, revenue=${featureRow.revenue ?? 'N/A'}`;
  }

  return { kpiLabel, direction, pct, segment, kpiLines, rawMetrics };
};

/**
 * Build a detailed structured prompt.
 */
const buildPrompt = (signal, featureRow) => {
  const { kpiLabel, direction, pct, segment, kpiLines, rawMetrics } = buildContext(signal, featureRow);

  return `You are a senior business analytics assistant. A signal was detected in business performance data.

Signal:
- KPI: ${kpiLabel}
- Change: ${direction} by ${pct}% day-over-day
- Segment: ${segment}
- Severity: ${signal.severity}
${kpiLines}${rawMetrics}

Generate a JSON object with exactly these 5 keys:

"title": a sharp 1-line headline (max 12 words) describing what happened

"key_details": an array of 4-5 bullet strings, each starting with a metric name and its specific % change and values (e.g. "Demo Rate decreased 41%, from 0.38 to 0.22")

"why": 2-3 sentences with a detailed business explanation referencing the actual numbers above. Mention cross-KPI relationships if relevant.

"impact_details": an array of 3-4 bullet strings describing specific business consequences (revenue, pipeline, ROI, etc.)

"recommendation": 2 specific, actionable sentences on what to investigate or change.

Rules:
- Use ONLY the numbers provided. Do not fabricate metrics.
- Be specific: name the segment, KPI values, and % changes in your text.
- Return ONLY valid JSON. No markdown fences, no text outside the JSON object.

Format:
{"title":"...","key_details":["...","..."],"why":"...","impact_details":["...","..."],"recommendation":"..."}`;
};

/**
 * Call Ollama and parse structured JSON from the response.
 * Retries once if the first response is not valid JSON.
 *
 * @param {Object} signal     - signal row with kpis joined
 * @param {Object} featureRow - matching feature row with before/after KPI values
 * @returns {Promise<{title, key_details, why, impact_details, recommendation} | null>}
 */
const generateInsightText = async (signal, featureRow = null) => {
  const prompt = buildPrompt(signal, featureRow);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ollama.chat({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        options: { temperature: 0.3 },
      });

      const raw     = response.message.content.trim();
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed  = JSON.parse(cleaned);

      if (
        typeof parsed.title          === 'string' &&
        Array.isArray(parsed.key_details) &&
        typeof parsed.why            === 'string' &&
        Array.isArray(parsed.impact_details) &&
        typeof parsed.recommendation === 'string'
      ) {
        return parsed;
      }

      console.warn(`[LLM] Attempt ${attempt}: missing/invalid keys in response, retrying...`);
    } catch (err) {
      console.warn(`[LLM] Attempt ${attempt} failed: ${err.message}`);
    }
  }

  return null;
};

module.exports = { generateInsightText };
