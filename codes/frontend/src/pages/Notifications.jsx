import './Notifications.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, fmtDate } from '../components/UI';

export default function Notifications() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.get('/notifications').then((res) => setData(res.data)).catch(() => setError('Failed to load notifications.'));
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    await api.patch('/notifications/mark-all-read');
    load();
  }

  return (
    <Layout title="Notifications">
      {error && <div className="alert alert-danger">{error}</div>}
      {!data && !error && <Loading />}
      {data && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h3>Notifications</h3>
              <button className="btn btn-sm btn-outline" onClick={markAllRead}>Mark all read</button>
            </div>
            <div className="card-body">
              {data.notifications.length === 0 && <p className="text-muted text-sm">No notifications yet.</p>}
              {data.notifications.map((n) => (
                <div
                  key={n.notif_id}
                  className="flex justify-between items-center mb-1"
                  style={{ paddingBottom: '.6rem', borderBottom: '1px solid #f0f0f0', opacity: n.is_read ? .6 : 1 }}
                >
                  <div>
                    <span className="badge badge-pending">{n.notif_type}</span>
                    <p className="text-sm mt-1">{n.message}</p>
                  </div>
                  <span className="text-sm text-muted">{fmtDate(n.created_at)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>System Alerts</h3></div>
            <div className="card-body">
              <h3 style={{ fontSize: 13, color: 'var(--primary)', marginBottom: '.5rem' }}>Pending Postmortem Reports</h3>
              {data.pendingPM.length === 0 && <p className="text-muted text-sm mb-2">None pending.</p>}
              {data.pendingPM.map((p) => (
                <p key={p.case_id} className="text-sm mb-1">
                  <Link to={`/cases/${p.case_id}`}>{p.case_ref_no}</Link> — report not yet issued
                </p>
              ))}

              <h3 style={{ fontSize: 13, color: 'var(--primary)', margin: '1rem 0 .5rem' }}>Court Dates (Next 14 Days)</h3>
              {data.upcomingTrials.length === 0 && <p className="text-muted text-sm">No upcoming court dates.</p>}
              {data.upcomingTrials.map((t) => (
                <p key={t.case_id} className="text-sm mb-1">
                  <Link to={`/cases/${t.case_id}`}>{t.case_ref_no}</Link> — {fmtDate(t.trial_date)}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
