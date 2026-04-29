const supabase = require('../db');
const { buildInsight, buildTags } = require('../utils/insightHelpers');
const { generateInsightText } = require('./llmService');

/**
 * Generate insights from an array of signal rows and persist them.
 *
 * @param {Array}    signals    - signal rows with kpis joined + featureContext
 * @param {Function} onProgress - optional SSE callback
 */
const generateAndSaveInsights = async (signals, onProgress = null) => {
  if (!signals || signals.length === 0) return [];

  const insightRecords = [];

  for (let i = 0; i < signals.length; i++) {
    const signal    = signals[i];
    const kpiName   = signal.kpis?.name || 'kpi';
    const direction = signal.type === 'spike' ? '▲ spike' : '▼ drop';

    onProgress?.({
      type:    'insight_start',
      message: `Generating insight ${i + 1}/${signals.length} — ${signal.kpis?.display_name || kpiName} ${direction} in ${signal.region} / ${signal.channel}`,
      current: i + 1,
      total:   signals.length,
    });

    const ruleBased = buildInsight(signal);
    const llmText   = await generateInsightText(signal, signal.featureContext || null);

    if (llmText) {
      onProgress?.({ type: 'insight_done', message: `✓ LLM enriched — signal ${signal.id}` });
    } else {
      onProgress?.({ type: 'insight_done', message: `⚠ Rule-based fallback — signal ${signal.id}` });
    }

    insightRecords.push({
      signal_id:      signal.id,
      title:          llmText?.title          ?? ruleBased.title,
      description:    ruleBased.description,
      key_details:    llmText?.key_details     ?? [],
      why:            llmText?.why             ?? ruleBased.why,
      impact:         ruleBased.impact,
      impact_details: llmText?.impact_details  ?? [],
      recommendation: llmText?.recommendation  ?? ruleBased.recommendation,
      severity:       signal.severity,
    });
  }

  const { data: insertedInsights, error: insightError } = await supabase
    .from('insights')
    .insert(insightRecords)
    .select();

  if (insightError) throw new Error(`Failed to save insights: ${insightError.message}`);

  // Build and insert tags
  const tagRecords = [];
  insertedInsights.forEach((insight, i) => {
    buildTags(signals[i]).forEach((tag) =>
      tagRecords.push({ insight_id: insight.id, tag })
    );
  });

  if (tagRecords.length > 0) {
    const { error: tagError } = await supabase.from('insight_tags').insert(tagRecords);
    if (tagError) throw new Error(`Failed to save tags: ${tagError.message}`);
  }

  return insertedInsights;
};

/**
 * Fetch all insights with tags and signal context.
 */
const getInsights = async () => {
  const { data, error } = await supabase
    .from('insights')
    .select(`
      *,
      insight_tags ( tag ),
      signals ( type, value, region, channel, campaign, kpis ( name, display_name ) )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((insight) => ({
    ...insight,
    tags: insight.insight_tags.map((t) => t.tag),
    insight_tags: undefined,
  }));
};

/**
 * Fetch a single insight by ID with full detail.
 */
const getInsightById = async (id) => {
  const { data, error } = await supabase
    .from('insights')
    .select(`
      *,
      insight_tags ( tag ),
      signals ( type, value, region, channel, campaign, kpis ( name, display_name ) )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    tags: data.insight_tags.map((t) => t.tag),
    insight_tags: undefined,
  };
};

module.exports = { generateAndSaveInsights, getInsights, getInsightById };
