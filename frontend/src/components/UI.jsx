export function Alert({ type = 'info', children }) {
  if (!children) return null;
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function Loading({ label = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      {label}
    </div>
  );
}

export function Empty({ label = 'No records found.' }) {
  return <div className="empty-state">{label}</div>;
}

const STATUS_BADGE_MAP = {
  Open: 'badge-open',
  'Pending Report': 'badge-pending',
  'Report Issued': 'badge-issued',
  Closed: 'badge-closed',
  Draft: 'badge-pending',
  Issued: 'badge-issued',
  Dispatched: 'badge-issued',
};

export function StatusBadge({ status }) {
  const cls = STATUS_BADGE_MAP[status] || 'badge-open';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function TypeBadge({ type }) {
  const cls = type === 'Postmortem' ? 'badge-postmortem' : 'badge-clinical';
  return <span className={`badge ${cls}`}>{type}</span>;
}

export function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
