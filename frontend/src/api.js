const BASE = import.meta.env.VITE_API_URL;

const get = async (path) => {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

const post = async (path, body = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export const fetchInsights    = ()   => get('/insights');
export const fetchInsightById = (id) => get(`/insights/${id}`);
export const runPipeline      = ()   => post('/run-pipeline');

/**
 * Stream pipeline progress via Server-Sent Events.
 * Calls onEvent(event) for each SSE message until 'done' or 'error'.
 * @param {Function} onEvent - called with each parsed event object
 * @returns {EventSource} — call .close() to cancel early
 */
export const streamPipeline = (onEvent) => {
  const es = new EventSource(`${BASE}/run-pipeline/stream`);
  es.onmessage = (e) => {
    const event = JSON.parse(e.data);
    onEvent(event);
    if (event.type === 'done' || event.type === 'error') es.close();
  };
  es.onerror = () => {
    onEvent({ type: 'error', message: 'Connection lost.' });
    es.close();
  };
  return es;
};
