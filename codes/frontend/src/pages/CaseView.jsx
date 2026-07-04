import './CaseView.css';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, StatusBadge, TypeBadge, fmtDate } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/rbac';

const STATUSES = ['Open', 'Pending Report', 'Report Issued', 'Closed'];

export default function CaseView() {
  const { hasPermission } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  function load() {
    api
      .get(`/cases/${id}`)
      .then((res) => {
        setCaseData(res.data);
        setNewStatus(res.data.case_status);
      })
      .catch(() => setError('Case not found.'));
  }

  useEffect(() => { load(); }, [id]);

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setStatusUpdating(true);
    try {
      await api.patch(`/cases/${id}/status`, { case_status: newStatus });
      setSuccessMsg('Case status updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  }

  if (error) return <Layout title="Case Details"><div className="alert alert-danger">{error}</div></Layout>;
  if (!caseData) return <Layout title="Case Details"><Loading /></Layout>;

  const c = caseData;

  return (
    <Layout title="Case Details" breadcrumb="Cases / View">
      {searchParams.get('created') && <div className="alert alert-success">Case created successfully.</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Header Card */}
      <div className="card mb-2">
        <div className="card-header">
          <h3>
            {c.case_ref_no} &mdash; <TypeBadge type={c.case_type} />
          </h3>
          {hasPermission(PERMISSIONS.CASE_STATUS_UPDATE) && (
            <form onSubmit={handleStatusUpdate} className="flex gap-1 items-center">
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ maxWidth: 160 }}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" className="btn btn-sm btn-secondary" disabled={statusUpdating}>
                {statusUpdating ? '...' : 'Update Status'}
              </button>
            </form>
          )}
        </div>
        <div className="card-body">
          <div className="grid-3">
            <div>
              <p className="text-muted text-sm">Patient / Deceased</p>
              <p className="font-bold">
                <Link to={`/patients/${c.patient_id}`}>{c.patient_name}</Link>
              </p>
              <p className="text-sm text-muted">{c.gender}, Age {c.age || '—'}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Assigned Doctor</p>
              <p className="font-bold">{c.doctor_name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Police Station</p>
              <p className="font-bold">{c.station_name || '—'}</p>
              <p className="text-sm text-muted">Ref: {c.police_ref_no || '—'}</p>
            </div>
            <div>
              <p className="text-muted text-sm">MLEF No</p>
              <p className="font-bold">{c.mlef_no || '—'}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Court</p>
              <p className="font-bold">{c.court_name || '—'}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Examination Date</p>
              <p className="font-bold">{fmtDate(c.examination_date)}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Incident Type</p>
              <p className="font-bold">{c.incident_type || '—'}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Status</p>
              <StatusBadge status={c.case_status} />
            </div>
            {c.trial_date && (
              <div>
                <p className="text-muted text-sm">Trial Date</p>
                <p className="font-bold">{fmtDate(c.trial_date)}</p>
              </div>
            )}
          </div>
          {c.reason_for_referral && (
            <div className="mt-2">
              <p className="text-muted text-sm">Reason for Referral</p>
              <p>{c.reason_for_referral}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Postmortem */}
        <div className="card">
          <div className="card-header">
            <h3>Postmortem Record</h3>
            {!c.postmortem ? (
              hasPermission(PERMISSIONS.POSTMORTEM_WRITE) && (
                <Link to={`/postmortems/new?case_id=${id}`} className="btn btn-sm btn-primary">+ Add</Link>
              )
            ) : (
              hasPermission(PERMISSIONS.POSTMORTEM_READ) && (
                <Link to={`/postmortems/${c.postmortem.pm_id}`} className="btn btn-sm btn-outline">View</Link>
              )
            )}
          </div>
          <div className="card-body">
            {!c.postmortem ? (
              <p className="text-muted text-sm">No postmortem record linked to this case.</p>
            ) : (
              <>
                <p className="text-sm"><strong>Cause of Death:</strong> {c.postmortem.cause_of_death_ia || 'Pending'}</p>
                <p className="text-sm"><strong>Manner:</strong> {c.postmortem.manner_of_death}</p>
                <p className="text-sm"><strong>Report Issued:</strong> {c.postmortem.pm_report_issued ? 'Yes' : 'No'}</p>
              </>
            )}
          </div>
        </div>

        {/* Reports */}
        <div className="card">
          <div className="card-header">
            <h3>Reports ({c.reports.length})</h3>
            {hasPermission(PERMISSIONS.REPORT_CREATE) && (
              <Link to={`/reports/new?case_id=${id}`} className="btn btn-sm btn-primary">+ New Report</Link>
            )}
          </div>
          <div className="card-body">
            {c.reports.length === 0 && <p className="text-muted text-sm">No reports generated yet.</p>}
            {c.reports.map((r) => (
              <div
                key={r.report_id}
                className="flex justify-between items-center mb-1"
                style={{ paddingBottom: '.5rem', borderBottom: '1px solid #f0f0f0' }}
              >
                <div>
                  {hasPermission(PERMISSIONS.REPORT_READ) ? (
                    <Link to={`/reports/${r.report_id}`}>{r.report_type}</Link>
                  ) : (
                    <span>{r.report_type}</span>
                  )}
                  <span className="text-sm text-muted"> — {r.report_status}</span>
                </div>
                <span className="text-sm text-muted">{fmtDate(r.report_date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2 mt-2">
        {/* Evidence */}
        <div className="card">
          <div className="card-header">
            <h3>Evidence ({c.evidence.length})</h3>
            {hasPermission(PERMISSIONS.EVIDENCE_WRITE) && (
              <Link to={`/evidence/new?case_id=${id}`} className="btn btn-sm btn-primary">+ Add Evidence</Link>
            )}
          </div>
          <div className="card-body">
            {c.evidence.length === 0 && <p className="text-muted text-sm">No evidence recorded.</p>}
            {c.evidence.length > 0 && (
              <table>
                <thead><tr><th>Type</th><th>Description</th><th>Storage</th></tr></thead>
                <tbody>
                  {c.evidence.map((e) => (
                    <tr key={e.evidence_id}>
                      <td>{e.evidence_type}</td>
                      <td>{e.description}</td>
                      <td>{e.storage_location || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Investigations */}
        <div className="card">
          <div className="card-header"><h3>Investigations ({c.investigations.length})</h3></div>
          <div className="card-body">
            {c.investigations.length === 0 && <p className="text-muted text-sm">No investigations recorded.</p>}
            {c.investigations.length > 0 && (
              <table>
                <thead><tr><th>Type</th><th>Result</th><th>Date</th></tr></thead>
                <tbody>
                  {c.investigations.map((inv) => (
                    <tr key={inv.inv_id}>
                      <td>{inv.inv_type}</td>
                      <td>{inv.result || 'Pending'}</td>
                      <td>{fmtDate(inv.done_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <Link to="/cases" className="btn btn-outline">&larr; Back to Cases</Link>
      </div>
    </Layout>
  );
}
