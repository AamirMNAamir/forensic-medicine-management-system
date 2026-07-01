import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, StatusBadge, TypeBadge, fmtDate } from '../components/UI';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load dashboard data.'));
  }, []);

  return (
    <Layout title="Dashboard">
      {error && <div className="alert alert-danger">{error}</div>}
      {!stats && !error && <Loading />}

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">&#128100;</div>
              <div className="stat-value">{stats.totalPatients}</div>
              <div className="stat-label">Registered Patients</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">&#128193;</div>
              <div className="stat-value">{stats.totalCases}</div>
              <div className="stat-label">Total Cases</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-icon">&#9203;</div>
              <div className="stat-value">{stats.pendingReports}</div>
              <div className="stat-label">Pending Reports</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">&#9877;</div>
              <div className="stat-value">{stats.totalPM}</div>
              <div className="stat-label">Postmortem Records</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3>Recent Cases</h3>
                <Link to="/cases" className="btn btn-outline btn-sm">View All</Link>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Case Ref</th><th>Patient</th><th>Type</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentCases.length === 0 && (
                      <tr><td colSpan={4} className="text-muted text-center">No cases recorded yet.</td></tr>
                    )}
                    {stats.recentCases.map((c) => (
                      <tr key={c.case_id}>
                        <td><Link to={`/cases/${c.case_id}`}>{c.case_ref_no}</Link></td>
                        <td>{c.patient_name}</td>
                        <td><TypeBadge type={c.case_type} /></td>
                        <td><StatusBadge status={c.case_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Upcoming Court Dates</h3></div>
              <div className="card-body">
                {stats.upcomingTrials.length === 0 && (
                  <p className="text-muted text-sm">No upcoming court dates scheduled.</p>
                )}
                {stats.upcomingTrials.map((t) => (
                  <div
                    key={t.case_id}
                    className="flex justify-between items-center mb-1"
                    style={{ paddingBottom: '.6rem', borderBottom: '1px solid #f0f0f0' }}
                  >
                    <div>
                      <Link to={`/cases/${t.case_id}`} style={{ fontWeight: 700, fontSize: 13 }}>{t.case_ref_no}</Link><br />
                      <span className="text-sm text-muted">Trial: {fmtDate(t.trial_date)}</span>
                    </div>
                    <span className="badge badge-pending">Upcoming</span>
                  </div>
                ))}

                <div className="mt-3">
                  <h3 style={{ fontSize: 13, color: 'var(--primary)', marginBottom: '.6rem' }}>Quick Actions</h3>
                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    <Link to="/patients/new" className="btn btn-sm btn-primary">+ New Patient</Link>
                    <Link to="/cases/new" className="btn btn-sm btn-secondary">+ New Case</Link>
                    <Link to="/postmortems/new" className="btn btn-sm btn-outline">+ New Postmortem</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
