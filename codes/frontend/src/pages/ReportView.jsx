import './ReportView.css';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { Loading, StatusBadge, fmtDate } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/rbac';

const STATUSES = ['Draft', 'Issued', 'Dispatched'];

export default function ReportView() {
  const { hasPermission } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  function load() {
    api.get(`/reports/${id}`)
      .then((res) => { setReport(res.data); setNewStatus(res.data.report_status); })
      .catch(() => setError('Report not found.'));
  }

  useEffect(() => { load(); }, [id]);

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.patch(`/reports/${id}/status`, { report_status: newStatus });
      setSuccessMsg('Report status updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  }

  if (error) return <Layout title="Report Details"><div className="alert alert-danger">{error}</div></Layout>;
  if (!report) return <Layout title="Report Details"><Loading /></Layout>;

  return (
    <Layout title="Report Details" breadcrumb="Reports / View">
      {searchParams.get('created') && <div className="alert alert-success">Report created as draft.</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card">
        <div className="card-header">
          <h3>{report.report_type} — {report.case_ref_no}</h3>
          <div className="flex gap-1 items-center">
            {hasPermission(PERMISSIONS.REPORT_APPROVE) && (
              <form onSubmit={handleStatusUpdate} className="flex gap-1 items-center">
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ maxWidth: 140 }}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button type="submit" className="btn btn-sm btn-secondary" disabled={updating}>
                  {updating ? '...' : 'Update'}
                </button>
              </form>
            )}
            <button className="btn btn-sm btn-outline" onClick={() => window.print()}>Print</button>
          </div>
        </div>
        <div className="card-body" style={{ maxWidth: 800 }}>
          <div className="grid-3 mb-2">
            <div><p className="text-muted text-sm">Serial No</p><p className="font-bold">{report.serial_no || '—'}</p></div>
            <div><p className="text-muted text-sm">Report Date</p><p className="font-bold">{fmtDate(report.report_date)}</p></div>
            <div><p className="text-muted text-sm">Status</p><StatusBadge status={report.report_status} /></div>
            <div>
              <p className="text-muted text-sm">Patient / Deceased</p>
              <p className="font-bold">{report.patient_name}, {report.gender}, {report.age} yrs</p>
            </div>
            <div><p className="text-muted text-sm">Prepared By</p><p className="font-bold">{report.prepared_by_name || '—'}</p></div>
            <div><p className="text-muted text-sm">Submission Court</p><p className="font-bold">{report.court_name || '—'}</p></div>
          </div>

          <h3 style={{ fontSize: 13, color: 'var(--primary)', margin: '1.25rem 0 .5rem' }}>Findings</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{report.findings || 'Not recorded.'}</p>

          <h3 style={{ fontSize: 13, color: 'var(--primary)', margin: '1.25rem 0 .5rem' }}>Opinion</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{report.opinion || 'Not recorded.'}</p>

          <h3 style={{ fontSize: 13, color: 'var(--primary)', margin: '1.25rem 0 .5rem' }}>Recommendations</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{report.recommendations || 'Not recorded.'}</p>

          {report.dispatch_date && (
            <p className="text-sm text-muted mt-2">Dispatched on {fmtDate(report.dispatch_date)}</p>
          )}
        </div>
      </div>

      <div className="mt-2">
        <Link to={`/cases/${report.case_id}`} className="btn btn-outline">&larr; Back to Case</Link>
      </div>
    </Layout>
  );
}
