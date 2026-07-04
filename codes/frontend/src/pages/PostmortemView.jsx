import './PostmortemView.css';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, fmtDate } from '../components/UI';

export default function PostmortemView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [pm, setPm] = useState(null);
  const [error, setError] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  function load() {
    api.get(`/postmortems/${id}`)
      .then((res) => setPm(res.data))
      .catch(() => setError('Postmortem record not found.'));
  }

  useEffect(() => { load(); }, [id]);

  async function handleIssue() {
    if (!window.confirm('Mark this PM report as issued and update case status to Report Issued?')) return;
    setIssuing(true);
    try {
      await api.patch(`/postmortems/${id}/issue`);
      setSuccessMsg('Report marked as issued.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update record.');
    } finally {
      setIssuing(false);
    }
  }

  if (error) return <Layout title="Postmortem Record"><div className="alert alert-danger">{error}</div></Layout>;
  if (!pm) return <Layout title="Postmortem Record"><Loading /></Layout>;

  const Row = ({ label, value }) => (
    <tr>
      <td className="text-muted" style={{ width: 200, paddingRight: '1rem' }}>{label}</td>
      <td>{value || '—'}</td>
    </tr>
  );

  return (
    <Layout title="Postmortem Record" breadcrumb="Postmortem / View">
      {searchParams.get('created') && <div className="alert alert-success">Postmortem record created.</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card mb-2">
        <div className="card-header">
          <h3>Postmortem — {pm.patient_name}</h3>
          <div className="flex gap-1 items-center">
            <Link to={`/cases/${pm.case_id}`} className="btn btn-sm btn-outline">View Case</Link>
            {!pm.pm_report_issued ? (
              <button className="btn btn-sm btn-success" onClick={handleIssue} disabled={issuing}>
                {issuing ? '...' : 'Mark Report Issued'}
              </button>
            ) : (
              <span className="badge badge-issued">Report Issued</span>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="grid-3 mb-2">
            <div><p className="text-muted text-sm">Case Reference</p><p className="font-bold">{pm.case_ref_no}</p></div>
            <div><p className="text-muted text-sm">Deceased</p><p className="font-bold">{pm.patient_name}, {pm.gender}, {pm.age} yrs</p></div>
            <div><p className="text-muted text-sm">Examining Doctor</p><p className="font-bold">{pm.doctor_name || '—'}</p></div>
            <div><p className="text-muted text-sm">PM Date</p><p className="font-bold">{fmtDate(pm.pm_date)}</p></div>
            <div><p className="text-muted text-sm">PM Serial No</p><p className="font-bold">{pm.pm_serial_no || '—'}</p></div>
            <div><p className="text-muted text-sm">Manner of Death</p><p className="font-bold">{pm.manner_of_death}</p></div>
          </div>

          <h3 style={{ fontSize: 13, color: 'var(--primary)', margin: '1.25rem 0 .5rem' }}>Cause of Death</h3>
          <table><tbody>
            <Row label="Immediate (Ia)" value={pm.cause_of_death_ia} />
            <Row label="Antecedent (Ib)" value={pm.cause_of_death_ib} />
            <Row label="Contributory (II)" value={pm.cause_of_death_ii} />
          </tbody></table>

          <h3 style={{ fontSize: 13, color: 'var(--primary)', margin: '1.25rem 0 .5rem' }}>Examination Findings</h3>
          <div className="grid-2">
            <div>
              <p className="text-muted text-sm">External Examination</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{pm.external_examination || 'Not recorded.'}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Internal Examination</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{pm.internal_examination || 'Not recorded.'}</p>
            </div>
          </div>

          <h3 style={{ fontSize: 13, color: 'var(--primary)', margin: '1.25rem 0 .5rem' }}>Pre-Autopsy History</h3>
          <div className="grid-2">
            <div>
              <p className="text-muted text-sm">From Police</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{pm.history_from_police || '—'}</p>
            </div>
            <div>
              <p className="text-muted text-sm">From Family</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{pm.history_from_family || '—'}</p>
            </div>
          </div>

          {pm.comments && (
            <>
              <h3 style={{ fontSize: 13, color: 'var(--primary)', margin: '1.25rem 0 .5rem' }}>Comments</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{pm.comments}</p>
            </>
          )}
        </div>
      </div>

      <Link to="/postmortems" className="btn btn-outline">&larr; Back to Postmortem Records</Link>
    </Layout>
  );
}
