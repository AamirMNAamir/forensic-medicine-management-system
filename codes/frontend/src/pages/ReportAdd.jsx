import './ReportAdd.css';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';

export default function ReportAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('case_id');

  const [doctors, setDoctors] = useState([]);
  const [courts, setCourts] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    case_id: caseId || '', report_type: 'MLR', serial_no: '',
    report_date: '', prepared_by: '', findings: '', opinion: '',
    recommendations: '', court_id: '',
  });

  useEffect(() => {
    Promise.all([api.get('/staff'), api.get('/police/courts')]).then(([s, c]) => {
      setDoctors(s.data.filter((d) => d.is_active));
      setCourts(c.data);
    }).catch(() => setError('Failed to load form data.'));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.case_id || !form.report_type) {
      setError('Case and report type are required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, case_id: Number(form.case_id) };
      if (payload.prepared_by) payload.prepared_by = Number(payload.prepared_by);
      if (payload.court_id) payload.court_id = Number(payload.court_id);
      const res = await api.post('/reports', payload);
      navigate(`/reports/${res.data.report_id}?created=1`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create report.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout title="New Report" breadcrumb="Reports / New">
      <div className="card" style={{ maxWidth: 900 }}>
        <div className="card-header"><h3>New Report — Case {caseId || '?'}</h3></div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Report Type <span className="req">*</span></label>
                <select required value={form.report_type} onChange={(e) => update('report_type', e.target.value)}>
                  <option value="MLR">Medico-Legal Report (MLR)</option>
                  <option value="PMR">Postmortem Report (PMR)</option>
                  <option value="Court Report">Court Report</option>
                </select>
              </div>
              <div className="form-group">
                <label>Serial No</label>
                <input type="text" value={form.serial_no} onChange={(e) => update('serial_no', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Report Date</label>
                <input type="date" value={form.report_date} onChange={(e) => update('report_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Prepared By</label>
                <select value={form.prepared_by} onChange={(e) => update('prepared_by', e.target.value)}>
                  <option value="">-- Select --</option>
                  {doctors.map((d) => <option key={d.staff_id} value={d.staff_id}>{d.full_name}</option>)}
                </select>
              </div>
              <div className="form-group span-2">
                <label>Submission Court</label>
                <select value={form.court_id} onChange={(e) => update('court_id', e.target.value)}>
                  <option value="">-- Select --</option>
                  {courts.map((c) => <option key={c.court_id} value={c.court_id}>{c.court_name}</option>)}
                </select>
              </div>
              <div className="form-group span-2">
                <label>Findings</label>
                <textarea value={form.findings} onChange={(e) => update('findings', e.target.value)} />
              </div>
              <div className="form-group span-2">
                <label>Opinion</label>
                <textarea value={form.opinion} onChange={(e) => update('opinion', e.target.value)} />
              </div>
              <div className="form-group span-2">
                <label>Recommendations</label>
                <textarea value={form.recommendations} onChange={(e) => update('recommendations', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-1 mt-3">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Report (Draft)'}
              </button>
              {caseId && (
                <button type="button" className="btn btn-outline" onClick={() => navigate(`/cases/${caseId}`)}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
