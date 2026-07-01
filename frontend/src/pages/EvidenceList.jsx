import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, Empty, fmtDate } from '../components/UI';

export default function EvidenceList() {
  const [evidence, setEvidence] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/evidence')
      .then((res) => setEvidence(res.data))
      .catch(() => setError('Failed to load evidence records.'));
  }, []);

  return (
    <Layout title="Evidence">
      <div className="card">
        <div className="card-header">
          <h3>Evidence Records {evidence ? `(${evidence.length})` : ''}</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            Evidence is added from within an individual case. Go to a <Link to="/cases">case page</Link> and click "+ Add Evidence".
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {!evidence && !error && <Loading />}
          {evidence && evidence.length === 0 && <Empty label="No evidence recorded yet." />}
          {evidence && evidence.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Case Ref</th><th>Type</th><th>Description</th>
                    <th>Storage Location</th><th>Collected</th><th>Collected By</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((e) => (
                    <tr key={e.evidence_id}>
                      <td><Link to={`/cases/${e.case_id}`}>{e.case_ref_no}</Link></td>
                      <td>{e.evidence_type}</td>
                      <td>{e.description}</td>
                      <td>{e.storage_location || '—'}</td>
                      <td>{fmtDate(e.collected_date)}</td>
                      <td>{e.collected_by || '—'}</td>
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
