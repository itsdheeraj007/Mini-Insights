import { useEffect, useRef, useState, useMemo } from 'react';
import { fetchInsights, streamPipeline } from '../api';
import InsightCard from '../components/InsightCard';

const KPI_OPTIONS = [
  { value: '',             label: 'All KPIs' },
  { value: 'cost_per_demo', label: 'Cost Per Demo' },
  { value: 'demo_rate',     label: 'Demo Rate' },
  { value: 'close_rate',    label: 'Close Rate' },
];

const SEVERITY_OPTIONS = [
  { value: '',       label: 'All Severities' },
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
];

const SIGNAL_OPTIONS = [
  { value: '',      label: 'All Signals' },
  { value: 'spike', label: '▲ Spike' },
  { value: 'drop',  label: '▼ Drop' },
];

const LOG_ICONS = {
  status:        '⟳',
  insight_start: '◉',
  insight_done:  '✓',
  done:          '✅',
  error:         '✗',
};

export default function Dashboard() {
  const [insights, setInsights] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [running,  setRunning]  = useState(false);
  const [logs,     setLogs]     = useState([]);
  const [error,    setError]    = useState(null);

  // Filters
  const [search,   setSearch]   = useState('');
  const [kpi,      setKpi]      = useState('');
  const [severity, setSeverity] = useState('');
  const [signal,   setSignal]   = useState('');
  const [view,     setView]     = useState('grid'); // 'grid' | 'list'

  const logEndRef = useRef(null);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInsights();
      setInsights(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return insights.filter((ins) => {
      if (severity && ins.severity !== severity) return false;
      if (signal   && ins.signals?.type !== signal) return false;
      if (kpi      && !ins.tags?.includes(kpi)) return false;
      if (q && !ins.title?.toLowerCase().includes(q) &&
               !ins.description?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [insights, search, kpi, severity, signal]);

  const appendLog = (event) => {
    const icon = LOG_ICONS[event.type] || '·';
    setLogs((prev) => [...prev, { icon, message: event.message, type: event.type }]);
  };

  const handleRunPipeline = () => {
    setRunning(true);
    setLogs([]);
    streamPipeline(async (event) => {
      appendLog(event);
      if (event.type === 'done')  { await loadInsights(); setRunning(false); }
      if (event.type === 'error') { setRunning(false); }
    });
  };

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
  useEffect(() => { loadInsights(); }, []);

  return (
    <div className="page">
      {/* ── Top header ── */}
      <header className="header">
        <div>
          <h1 className="logo">Mini Insights</h1>
          <p className="subtitle">Business signal detection &amp; insight generation</p>
        </div>
        <button className="btn-primary" onClick={handleRunPipeline} disabled={running}>
          {running ? '⟳ Running…' : '▶ Run Pipeline'}
        </button>
      </header>

      {/* ── Live pipeline log ── */}
      {logs.length > 0 && (
        <div className="pipeline-log">
          {logs.map((log, i) => (
            <div key={i} className={`log-line ${log.type === 'error' ? 'log-error' : ''} ${log.type === 'done' ? 'log-done' : ''}`}>
              <span className="log-icon">{log.icon}</span>
              <span>{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}

      {/* ── Toolbar: count + filters + search + view toggle ── */}
      <div className="toolbar">
        <span className="insight-count">
          Insights <strong>({filtered.length})</strong>
        </span>

        <div className="toolbar-filters">
          {/* View toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
              title="List view"
            >
              ☰
            </button>
          </div>

          <select className="filter-select" value={kpi} onChange={(e) => setKpi(e.target.value)}>
            {KPI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select className="filter-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select className="filter-select" value={signal} onChange={(e) => setSignal(e.target.value)}>
            {SIGNAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search insights…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && <p className="state-msg">Loading insights…</p>}
      {error   && <p className="state-msg error">Error: {error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="state-msg">
          {insights.length === 0
            ? 'No insights yet. Click "Run Pipeline" to generate them.'
            : 'No insights match your filters.'}
        </p>
      )}

      <div className={view === 'grid' ? 'insights-grid' : 'insights-list'}>
        {filtered.map((insight) => (
          <InsightCard key={insight.id} insight={insight} view={view} />
        ))}
      </div>
    </div>
  );
}
