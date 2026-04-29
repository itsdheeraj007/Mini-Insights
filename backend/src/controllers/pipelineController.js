const { detectAndSaveSignals } = require('../services/signalService');
const { generateAndSaveInsights } = require('../services/insightService');

/**
 * GET /run-pipeline/stream
 * Runs the full pipeline and pushes live progress via Server-Sent Events.
 */
const runPipelineStream = async (req, res) => {
  // SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if behind proxy
  res.flushHeaders();

  const send = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    send({ type: 'status', message: 'Pipeline started…' });

    const signals = await detectAndSaveSignals({}, send);
    send({ type: 'status', message: `Signal detection complete — ${signals.length} signal(s) found.` });

    if (signals.length === 0) {
      send({ type: 'done', signals_detected: 0, insights_generated: 0 });
      return res.end();
    }

    send({ type: 'status', message: 'Starting insight generation (LLM)…' });

    const insights = await generateAndSaveInsights(signals, send);
    send({ type: 'status', message: `Done! ${insights.length} insight(s) generated.` });

    send({ type: 'done', signals_detected: signals.length, insights_generated: insights.length });
  } catch (err) {
    console.error('[Pipeline Stream] Error:', err.message);
    send({ type: 'error', message: err.message });
  } finally {
    res.end();
  }
};

/**
 * POST /run-pipeline
 * Non-streaming version — kept for programmatic use.
 */
const runPipeline = async (req, res) => {
  try {
    const filters  = req.body?.filters || {};
    const signals  = await detectAndSaveSignals(filters);
    const insights = await generateAndSaveInsights(signals);

    res.json({
      status: 'completed',
      signals_detected:   signals.length,
      insights_generated: insights.length,
      signals,
      insights,
    });
  } catch (err) {
    console.error('[Pipeline] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { runPipeline, runPipelineStream };
