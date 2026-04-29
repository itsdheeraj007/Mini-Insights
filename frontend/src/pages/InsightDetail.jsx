import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchInsightById } from '../api';

const SEVERITY_COLOR = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#22c55e',
};

/** Render bullet lines — LLM may return strings or structured objects. */
const formatBulletLine = (item) => {
  if (item == null) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    // key_details shape: { metric, change, value }
    if ('metric' in item || 'change' in item) {
      const m = item.metric ?? item.name ?? 'Metric';
      const ch = item.change ?? '';
      const v = item.value != null ? String(item.value) : '';
      return [m, ch && `${ch}`, v && `(current ${v})`].filter(Boolean).join(' — ');
    }
    // impact_details shape: { impact, amount }
    if ('impact' in item) {
      const amt = item.amount;
      return amt != null && amt !== ''
        ? `${item.impact}: ${amt}`
        : String(item.impact);
    }
    try {
      return JSON.stringify(item);
    } catch {
      return String(item);
    }
  }
  return String(item);
};

const BulletList = ({ items }) => {
  if (!items || items.length === 0) return null;
  const rows = Array.isArray(items) ? items : [];
  return (
    <ul className="bullet-list">
      {rows.map((item, i) => (
        <li key={i}>{formatBulletLine(item)}</li>
      ))}
    </ul>
  );
};

const Panel = ({ icon, label, color, children }) => (
  <div className="detail-panel">
    <h3 className="panel-heading" style={{ color }}>
      <span className="panel-icon">{icon}</span> {label}
    </h3>
    {children}
  </div>
);

export default function InsightDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetchInsightById(id)
      .then(setInsight)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="state-msg">Loading…</p>;
  if (error)   return <p className="state-msg error">Error: {error}</p>;
  if (!insight) return null;

  const color  = SEVERITY_COLOR[insight.severity] || '#94a3b8';
  const signal = Array.isArray(insight.signals)
    ? insight.signals[0]
    : insight.signals;
  const pct       = signal?.value ? `${Math.abs(Math.round(signal.value * 100))}%` : '';
  const direction = signal?.type === 'spike' ? '▲ Spike' : '▼ Drop';

  return (
    <div className="page">
      <nav className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/')}>Insights portal</span>
        <span className="breadcrumb-sep">/</span>
        <span>Insight Detail</span>
      </nav>

      <div className="detail-meta">
        <span className="detail-date">
          Created {new Date(insight.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <h2 className="detail-title">{insight.title}</h2>

      <div className="detail-chips">
        <span className="severity-badge" style={{ background: color }}>{insight.severity}</span>
        <span className="signal-chip" style={{ color }}>{direction} {pct}</span>
        {signal?.region   && <span className="meta-chip">📍 {signal.region}</span>}
        {signal?.channel  && <span className="meta-chip">📢 {signal.channel}</span>}
        {signal?.campaign && <span className="meta-chip">🎯 {signal.campaign}</span>}
        {signal?.kpis?.display_name && <span className="meta-chip">📊 {signal.kpis.display_name}</span>}
      </div>

      <div className="tag-row" style={{ marginBottom: '2rem' }}>
        {insight.tags?.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      <div className="detail-grid">
        {/* Left column */}
        <div className="detail-col">
          <Panel icon="⚠" label="Insight Summary" color="#f59e0b">
            <p className="panel-text">{insight.description}</p>
            {insight.key_details?.length > 0 && (
              <>
                <p className="bullet-label">Key Details:</p>
                <BulletList items={insight.key_details} />
              </>
            )}
          </Panel>

          <Panel icon="📈" label="Impact Summary" color="#6366f1">
            <p className="panel-text">{insight.impact}</p>
            {insight.impact_details?.length > 0 && (
              <>
                <p className="bullet-label">Key Details:</p>
                <BulletList items={insight.impact_details} />
              </>
            )}
          </Panel>

          <Panel icon="✅" label="Recommendation" color="#22c55e">
            <p className="panel-text">{insight.recommendation}</p>
          </Panel>
        </div>

        {/* Right column */}
        <div className="detail-col">
          <Panel icon="?" label="Why This Happened" color="#94a3b8">
            <p className="panel-text">{insight.why}</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
