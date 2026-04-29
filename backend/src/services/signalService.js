const { computeFeatures } = require('./featureService');
const { getSalesData } = require('./dataService');
const { detectSignal } = require('../utils/signalHelpers');
const supabase = require('../db');

const getKPIMap = async () => {
  const { data, error } = await supabase.from('kpis').select('id, name');
  if (error) throw new Error(`Failed to fetch KPIs: ${error.message}`);
  return Object.fromEntries(data.map((k) => [k.name, k.id]));
};

/**
 * Same as detectAndSaveSignals but accepts an onProgress callback
 * so the streaming controller can emit SSE events per step.
 */
const detectAndSaveSignals = async (filters = {}, onProgress = null) => {
  onProgress?.({ type: 'status', message: 'Loading sales data and computing features…' });

  const [featureRows, kpiMap, rawRows] = await Promise.all([
    computeFeatures(filters),
    getKPIMap(),
    getSalesData(filters),
  ]);

  const rawLookup = {};
  for (const row of rawRows) {
    const key = `${row.region}__${row.channel}__${row.date}`;
    rawLookup[key] = row;
  }

  const kpiNames        = ['cost_per_demo', 'demo_rate', 'close_rate'];
  const signalsToInsert = [];
  const contextMap      = {};

  featureRows.forEach((row) => {
    for (const kpiName of kpiNames) {
      const feature = row.features[kpiName];
      const signal  = detectSignal(feature.growth_pct);
      if (!signal) continue;

      const rawKey = `${row.region}__${row.channel}__${String(row.date).slice(0, 10)}`;
      const raw    = rawLookup[rawKey] || {};

      contextMap[signalsToInsert.length] = {
        features:    row.features,
        leads:       raw.leads,
        demos:       raw.demos,
        conversions: raw.conversions,
        spend:       raw.spend,
        revenue:     raw.revenue,
        date:        row.date,
      };

      signalsToInsert.push({
        kpi_id:   kpiMap[kpiName],
        type:     signal.type,
        value:    feature.growth_pct,
        severity: signal.severity,
        region:   row.region,
        channel:  row.channel,
        campaign: row.campaign,
      });
    }
  });

  onProgress?.({ type: 'status', message: `Found ${signalsToInsert.length} signal(s). Saving to database…` });

  if (signalsToInsert.length === 0) return [];

  const { data: inserted, error } = await supabase
    .from('signals')
    .insert(signalsToInsert)
    .select('id');

  if (error) throw new Error(`Failed to save signals: ${error.message}`);

  const insertedIds = inserted.map((s) => s.id);
  const { data, error: fetchError } = await supabase
    .from('signals')
    .select('*, kpis(name, display_name)')
    .in('id', insertedIds);

  if (fetchError) throw new Error(`Failed to fetch signals: ${fetchError.message}`);

  return data.map((signal, i) => ({
    ...signal,
    featureContext: contextMap[i] || null,
  }));
};

const getSignals = async () => {
  const { data, error } = await supabase
    .from('signals')
    .select('*, kpis(name, display_name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

module.exports = { detectAndSaveSignals, getSignals };
