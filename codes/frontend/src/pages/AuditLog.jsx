import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, fmtDate } from '../components/UI';

export default function AuditLog() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/audit').then((res) => setData(res.data)).catch((err) => {
      setError(err.response?.data?.error || 'Failed to load audit log. Admin access required.');
    });
  }, []);

  return (
    <Layout title="Audit Log">
      {error && <div className="alert alert-danger">{error}</div>}
      {!data && !error && <Loading />}
      {data && (
        <>
          <div className="card mb-2">
            <div className="card-header"><h3>System Audit Log (Last 200 Actions)</h3></div>
            <div className="card-body">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Time</th><th>User</th><th>Action</th><th>Table</th><th>Record</th><th>Description</th><th>IP</th></tr>
                  </thead>
                  <tbody>
                    {data.logs.length === 0 && <tr><td colSpan={7} className="text-muted text-center">No activity logged yet.</td></tr>}
                    {data.logs.map((l) => (
                      <tr key={l.log_id}>
                        <td className="text-sm">{fmtDate(l.created_at)}</td>
                        <td>{l.full_name || 'System'}</td>
                        <td><span className="badge badge-open">{l.action}</span></td>
                        <td>{l.table_name}</td>
                        <td>#{l.record_id}</td>
                        <td className="text-sm">{l.description}</td>
                        <td className="text-sm text-muted">{l.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Login History (Last 50)</h3></div>
            <div className="card-body">
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Time</th><th>Username</th><th>Status</th><th>IP</th></tr></thead>
                  <tbody>
                    {data.loginHistory.map((l) => (
                      <tr key={l.log_id}>
                        <td className="text-sm">{fmtDate(l.login_time)}</td>
                        <td>{l.username || 'Unknown'}</td>
                        <td><span className={`badge ${l.status === 'success' ? 'badge-issued' : 'badge-closed'}`}>{l.status}</span></td>
                        <td className="text-sm text-muted">{l.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
