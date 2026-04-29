import { Link } from 'react-router-dom';

const SEVERITY_COLOR = {
  high:   { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' },
  medium: { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },
  low:    { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
};

const KPI_LABELS = {
  cost_per_demo: 'Cost Per Demo',
  demo_rate:     'Demo Rate',
  close_rate:    'Close Rate',
};

const TAG_STYLE = {
  spike:         { bg: '#fef2f2', text: '#b91c1c' },
  drop:          { bg: '#eff6ff', text: '#1d4ed8' },
  high:          { bg: '#fef2f2', text: '#b91c1c' },
  medium:        { bg: '#fffbeb', text: '#b45309' },
  low:           { bg: '#f0fdf4', text: '#15803d' },
  cost_per_demo: { bg: '#f5f3ff', text: '#6d28d9' },
  demo_rate:     { bg: '#f5f3ff', text: '#6d28d9' },
  close_rate:    { bg: '#f5f3ff', text: '#6d28d9' },
};

const getTagStyle = (tag) =>
  TAG_STYLE[tag] || { bg: '#f1f5f9', text: '#475569' };

export default function InsightCard({ insight, view = 'grid' }) {
  const severity  = SEVERITY_COLOR[insight.severity] || SEVERITY_COLOR.low;
  const signal    = insight.signals;
  const date      = insight.created_at
    ? new Date(insight.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className={`icard ${view === 'list' ? 'icard--list' : ''}`}>
      <div className="icard-top">
        <span
          className="icard-badge"
          style={{ background: severity.bg, color: severity.text, border: `1px solid ${severity.border}` }}
        >
          {insight.severity}
        </span>
        <span className="icard-signal">
          {signal?.type === 'spike' ? '▲' : '▼'}&nbsp;
          {signal?.value ? `${Math.abs(Math.round(signal.value * 100))}%` : ''}
        </span>
      </div>

      <h3 className="icard-title">{insight.title}</h3>
      <p className="icard-desc">{insight.description}</p>

      {insight.tags?.length > 0 && (
        <div className="icard-tags">
          {insight.tags.map((tag) => {
            const s = getTagStyle(tag);
            return (
              <span
                key={tag}
                className="icard-tag"
                style={{ background: s.bg, color: s.text }}
              >
                {KPI_LABELS[tag] || tag}
              </span>
            );
          })}
        </div>
      )}

      <div className="icard-footer">
        <span className="icard-date">{date}</span>
        <Link to={`/insights/${insight.id}`} className="icard-link">
          View Details →
        </Link>
      </div>
    </div>
  );
}
