import './ReportsList.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, Empty, StatusBadge, fmtDate } from '../components/UI';

export default function ReportsList() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports')
      .then((res) => setReports(res.data))
      .catch(() => setError('Failed to load reports.'));
  }, []);

  return (
    <Layout title="Reports">
      <div className="card">
        <div className="card-header">
          <h3>Medico-Legal Reports {reports ? `(${reports.length})` : ''}</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            Reports are generated from within a case. Go to a <Link to="/cases">case page</Link> and click "+ New Report".
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {!reports && !error && <Loading />}
          {reports && reports.length === 0 && <Empty label="No reports generated yet." />}
          {reports && reports.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Case Ref</th><th>Patient</th><th>Type</th><th>Status</th>
                    <th>Report Date</th><th>Prepared By</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.report_id}>
                      <td><Link to={`/cases/${r.case_id}`}>{r.case_ref_no}</Link></td>
                      <td>{r.patient_name}</td>
                      <td>{r.report_type}</td>
                      <td><StatusBadge status={r.report_status} /></td>
                      <td>{fmtDate(r.report_date)}</td>
                      <td>{r.prepared_by_name || '—'}</td>
                      <td><Link to={`/reports/${r.report_id}`} className="btn btn-sm btn-outline">View</Link></td>
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
