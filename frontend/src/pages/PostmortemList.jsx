import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, Empty, fmtDate } from '../components/UI';

export default function PostmortemList() {
  const [pms, setPms] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/postmortems')
      .then((res) => setPms(res.data))
      .catch(() => setError('Failed to load postmortem records.'));
  }, []);

  return (
    <Layout title="Postmortem Records">
      <div className="card">
        <div className="card-header">
          <h3>Postmortem Records {pms ? `(${pms.length})` : ''}</h3>
          <Link to="/postmortems/new" className="btn btn-primary btn-sm">+ New Postmortem</Link>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {!pms && !error && <Loading />}
          {pms && pms.length === 0 && <Empty label="No postmortem records found." />}
          {pms && pms.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Case Ref</th><th>Deceased</th><th>PM Date</th>
                    <th>Doctor</th><th>Manner of Death</th><th>Report Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pms.map((pm) => (
                    <tr key={pm.pm_id}>
                      <td>{pm.case_ref_no}</td>
                      <td>{pm.patient_name}</td>
                      <td>{fmtDate(pm.pm_date)}</td>
                      <td>{pm.doctor_name || '—'}</td>
                      <td>{pm.manner_of_death}</td>
                      <td>
                        <span className={`badge ${pm.pm_report_issued ? 'badge-issued' : 'badge-pending'}`}>
                          {pm.pm_report_issued ? 'Issued' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/postmortems/${pm.pm_id}`} className="btn btn-sm btn-outline">View</Link>
                      </td>
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
