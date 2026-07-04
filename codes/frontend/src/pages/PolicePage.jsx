import './PolicePage.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Loading, StatusBadge } from '../components/UI';
import { PERMISSIONS } from '../config/rbac';

export default function PolicePage() {
  const { hasPermission } = useAuth();
  const [stations, setStations] = useState([]);
  const [cases, setCases] = useState([]);
  const [form, setForm] = useState({ station_name: '', district: '', contact_no: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    Promise.all([api.get('/police/stations'), api.get('/police/cases')]).then(([s, c]) => {
      setStations(s.data);
      setCases(c.data);
    }).catch(() => setError('Failed to load data.'));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.station_name.trim()) { setError('Station name is required.'); return; }
    setSubmitting(true);
    try {
      await api.post('/police/stations', form);
      setSuccessMsg('Police station added.');
      setForm({ station_name: '', district: '', contact_no: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add station.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout title="Police Requests">
      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3>Cases Linked to Police Requests</h3></div>
          <div className="card-body">
            {cases.length === 0 && <p className="text-muted text-sm">No cases linked to police stations yet.</p>}
            {cases.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Case Ref</th><th>Patient</th><th>Police Ref</th><th>Station</th><th>Status</th></tr></thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.case_id}>
                        <td><Link to={`/cases/${c.case_id}`}>{c.case_ref_no}</Link></td>
                        <td>{c.patient_name}</td>
                        <td>{c.police_ref_no || '—'}</td>
                        <td>{c.station_name || '—'}</td>
                        <td><StatusBadge status={c.case_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Police Stations ({stations.length})</h3></div>
          <div className="card-body">
            {stations.length === 0 ? (
              <p className="text-muted text-sm mb-2">No stations added yet.</p>
            ) : (
              <table className="mb-2">
                <thead><tr><th>Station</th><th>District</th><th>Contact</th></tr></thead>
                <tbody>
                  {stations.map((s) => (
                    <tr key={s.station_id}>
                      <td>{s.station_name}</td>
                      <td>{s.district || '—'}</td>
                      <td>{s.contact_no || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {hasPermission(PERMISSIONS.POLICE_WRITE) && (
              <>
                <h3 style={{ fontSize: 13, color: 'var(--primary)', margin: '.75rem 0 .5rem' }}>Add Police Station</h3>
                <form onSubmit={handleSubmit}>
                  {[['station_name', 'Station Name', true], ['district', 'District'], ['contact_no', 'Contact No']].map(([field, label, req]) => (
                    <div className="form-group mb-1" key={field}>
                      <label>{label} {req && <span className="req">*</span>}</label>
                      <input
                        type="text"
                        required={!!req}
                        value={form[field]}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="mt-2">
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                      {submitting ? 'Adding...' : 'Add Station'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
