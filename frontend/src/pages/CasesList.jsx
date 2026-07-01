import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, Empty, StatusBadge, TypeBadge, fmtDate } from '../components/UI';

const STATUSES = ['Open', 'Pending Report', 'Report Issued', 'Closed'];

export default function CasesList() {
  const [cases, setCases] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  function load(params) {
    api
      .get('/cases', { params })
      .then((res) => setCases(res.data))
      .catch(() => setError('Failed to load cases.'));
  }

  useEffect(() => { load({}); }, []);

  function handleFilter(e) {
    e.preventDefault();
    const params = {};
    if (search) params.q = search;
    if (status) params.status = status;
    load(params);
  }

  function clearFilters() {
    setSearch('');
    setStatus('');
    load({});
  }

  return (
    <Layout title="Investigation Cases">
      <div className="card">
        <div className="card-header">
          <h3>Investigation Cases {cases ? `(${cases.length})` : ''}</h3>
          <Link to="/cases/new" className="btn btn-primary btn-sm">+ New Case</Link>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleFilter} className="search-bar">
            <input
              type="text"
              placeholder="Search case ref, patient, MLEF no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-outline btn-sm" type="submit">Filter</button>
            {(search || status) && (
              <button type="button" className="btn btn-outline btn-sm" onClick={clearFilters}>Clear</button>
            )}
          </form>

          {!cases && !error && <Loading />}
          {cases && cases.length === 0 && <Empty label="No cases found." />}

          {cases && cases.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Case Ref</th><th>Patient</th><th>Type</th><th>Incident</th>
                    <th>Doctor</th><th>Exam Date</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.case_id}>
                      <td><Link to={`/cases/${c.case_id}`}>{c.case_ref_no}</Link></td>
                      <td>{c.patient_name}</td>
                      <td><TypeBadge type={c.case_type} /></td>
                      <td>{c.incident_type || '—'}</td>
                      <td>{c.doctor_name || 'Unassigned'}</td>
                      <td>{fmtDate(c.examination_date)}</td>
                      <td><StatusBadge status={c.case_status} /></td>
                      <td><Link to={`/cases/${c.case_id}`} className="btn btn-sm btn-outline">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
