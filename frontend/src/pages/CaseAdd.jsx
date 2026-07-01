import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';

const INCIDENT_TYPES = ['RTA', 'Assault', 'Sexual Assault', 'Domestic Abuse', 'Child Abuse', 'Suicide', 'Homicide', 'Natural Death', 'Toxicology', 'Other'];

export default function CaseAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillPatientId = searchParams.get('patient_id') || '';

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stations, setStations] = useState([]);
  const [courts, setCourts] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    case_ref_no: '', case_type: 'Clinical', patient_id: prefillPatientId,
    incident_type: '', mlef_no: '', police_ref_no: '', station_id: '',
    assigned_doctor_id: '', court_id: '', admission_date: '', examination_date: '',
    reason_for_referral: '',
  });

  useEffect(() => {
    Promise.all([
      api.get('/patients'),
      api.get('/staff'),
      api.get('/police/stations'),
      api.get('/police/courts'),
    ]).then(([p, s, st, c]) => {
      setPatients(p.data);
      setDoctors(s.data.filter((d) => d.is_active));
      setStations(st.data);
      setCourts(c.data);
    }).catch(() => setError('Failed to load form data.'));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.case_ref_no || !form.patient_id) {
      setError('Case reference number and patient are required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      ['station_id', 'assigned_doctor_id', 'court_id', 'patient_id'].forEach((k) => {
        payload[k] = payload[k] ? Number(payload[k]) : null;
      });
      const res = await api.post('/cases', payload);
      navigate(`/cases/${res.data.case_id}?created=1`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create case.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout title="New Case" breadcrumb="Cases / New">
      <div className="card" style={{ maxWidth: 1000 }}>
        <div className="card-header"><h3>Create New Investigation Case</h3></div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Case Reference No <span className="req">*</span></label>
                <input type="text" required placeholder="e.g. CW/01/2026" value={form.case_ref_no} onChange={(e) => update('case_ref_no', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Case Type <span className="req">*</span></label>
                <select value={form.case_type} onChange={(e) => update('case_type', e.target.value)}>
                  <option value="Clinical">Clinical (MLEF)</option>
                  <option value="Postmortem">Postmortem</option>
                </select>
              </div>
              <div className="form-group span-2">
                <label>Patient / Deceased <span className="req">*</span></label>
                <select required value={form.patient_id} onChange={(e) => update('patient_id', e.target.value)}>
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.full_name}{p.nic_passport ? ` (${p.nic_passport})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Incident Type</label>
                <select value={form.incident_type} onChange={(e) => update('incident_type', e.target.value)}>
                  <option value="">-- Select --</option>
                  {INCIDENT_TYPES.map((it) => <option key={it} value={it}>{it}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>MLEF No</label>
                <input type="text" value={form.mlef_no} onChange={(e) => update('mlef_no', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Police Reference No</label>
                <input type="text" value={form.police_ref_no} onChange={(e) => update('police_ref_no', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Police Station</label>
                <select value={form.station_id} onChange={(e) => update('station_id', e.target.value)}>
                  <option value="">-- Select --</option>
                  {stations.map((s) => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Assigned Doctor</label>
                <select value={form.assigned_doctor_id} onChange={(e) => update('assigned_doctor_id', e.target.value)}>
                  <option value="">-- Unassigned --</option>
                  {doctors.map((d) => <option key={d.staff_id} value={d.staff_id}>{d.full_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Court</label>
                <select value={form.court_id} onChange={(e) => update('court_id', e.target.value)}>
                  <option value="">-- Select --</option>
                  {courts.map((c) => <option key={c.court_id} value={c.court_id}>{c.court_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Admission Date</label>
                <input type="date" value={form.admission_date} onChange={(e) => update('admission_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Examination Date</label>
                <input type="date" value={form.examination_date} onChange={(e) => update('examination_date', e.target.value)} />
              </div>
              <div className="form-group span-3">
                <label>Reason for Referral</label>
                <textarea value={form.reason_for_referral} onChange={(e) => update('reason_for_referral', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-1 mt-3">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Case'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
