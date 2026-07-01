import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';

const MANNER_OPTIONS = ['Natural', 'Accidental', 'Suicidal', 'Homicidal', 'Undetermined'];
const PLACE_OPTIONS = ['At Scene', 'At Hospital on Admission', 'At Hospital During Admission', 'Unknown'];

export default function PostmortemAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillCaseId = searchParams.get('case_id') || '';

  const [cases, setCases] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    case_id: prefillCaseId, pm_serial_no: '', inquest_no: '', inquest_date: '',
    pm_ordered_by: '', place_of_pm: '', pm_date: '', pm_time: '',
    examining_doctor_id: '', place_of_death: 'Unknown', date_of_death: '',
    bht_no: '', history_from_police: '', history_from_family: '',
    external_examination: '', internal_examination: '',
    cause_of_death_ia: '', cause_of_death_ib: '', cause_of_death_ii: '',
    manner_of_death: 'Undetermined', comments: '',
  });

  useEffect(() => {
    Promise.all([api.get('/cases'), api.get('/staff')]).then(([c, s]) => {
      setCases(c.data);
      setDoctors(s.data.filter((d) => d.is_active));
    }).catch(() => setError('Failed to load form data.'));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.case_id) { setError('Please select a case.'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (payload.examining_doctor_id) payload.examining_doctor_id = Number(payload.examining_doctor_id);
      payload.case_id = Number(payload.case_id);
      const res = await api.post('/postmortems', payload);
      navigate(`/postmortems/${res.data.pm_id}?created=1`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create record.');
    } finally {
      setSubmitting(false);
    }
  }

  const Section = ({ title }) => (
    <h3 style={{ fontSize: 13, color: 'var(--primary)', margin: '1.25rem 0 .75rem', fontWeight: 600 }}>{title}</h3>
  );

  return (
    <Layout title="New Postmortem Record" breadcrumb="Postmortem / New">
      <div className="card" style={{ maxWidth: 1100 }}>
        <div className="card-header"><h3>New Postmortem Record</h3></div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>

            <Section title="Case & Authorization" />
            <div className="form-grid cols-3">
              <div className="form-group span-2">
                <label>Case <span className="req">*</span></label>
                <select required value={form.case_id} onChange={(e) => update('case_id', e.target.value)}>
                  <option value="">-- Select Case --</option>
                  {cases.map((c) => (
                    <option key={c.case_id} value={c.case_id}>
                      {c.case_ref_no} — {c.patient_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>PM Serial No</label>
                <input type="text" value={form.pm_serial_no} onChange={(e) => update('pm_serial_no', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Inquest No</label>
                <input type="text" value={form.inquest_no} onChange={(e) => update('inquest_no', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Inquest Date</label>
                <input type="date" value={form.inquest_date} onChange={(e) => update('inquest_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label>PM Ordered By</label>
                <input type="text" placeholder="Magistrate / Inquirer name" value={form.pm_ordered_by} onChange={(e) => update('pm_ordered_by', e.target.value)} />
              </div>
            </div>

            <Section title="Postmortem Examination" />
            <div className="form-grid cols-3">
              <div className="form-group">
                <label>Place of PM</label>
                <input type="text" value={form.place_of_pm} onChange={(e) => update('place_of_pm', e.target.value)} />
              </div>
              <div className="form-group">
                <label>PM Date</label>
                <input type="date" value={form.pm_date} onChange={(e) => update('pm_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label>PM Time</label>
                <input type="time" value={form.pm_time} onChange={(e) => update('pm_time', e.target.value)} />
              </div>
              <div className="form-group span-2">
                <label>Examining Doctor</label>
                <select value={form.examining_doctor_id} onChange={(e) => update('examining_doctor_id', e.target.value)}>
                  <option value="">-- Select --</option>
                  {doctors.map((d) => <option key={d.staff_id} value={d.staff_id}>{d.full_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>BHT No</label>
                <input type="text" value={form.bht_no} onChange={(e) => update('bht_no', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Place of Death</label>
                <select value={form.place_of_death} onChange={(e) => update('place_of_death', e.target.value)}>
                  {PLACE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date of Death</label>
                <input type="date" value={form.date_of_death} onChange={(e) => update('date_of_death', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Manner of Death</label>
                <select value={form.manner_of_death} onChange={(e) => update('manner_of_death', e.target.value)}>
                  {MANNER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <Section title="Pre-Autopsy Information" />
            <div className="form-grid">
              <div className="form-group">
                <label>History from Police</label>
                <textarea value={form.history_from_police} onChange={(e) => update('history_from_police', e.target.value)} />
              </div>
              <div className="form-group">
                <label>History from Family</label>
                <textarea value={form.history_from_family} onChange={(e) => update('history_from_family', e.target.value)} />
              </div>
            </div>

            <Section title="Examination Findings" />
            <div className="form-grid">
              <div className="form-group">
                <label>External Examination</label>
                <textarea value={form.external_examination} onChange={(e) => update('external_examination', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Internal Examination</label>
                <textarea value={form.internal_examination} onChange={(e) => update('internal_examination', e.target.value)} />
              </div>
            </div>

            <Section title="Cause of Death" />
            <div className="form-grid cols-3">
              <div className="form-group">
                <label>Immediate Cause (Ia)</label>
                <input type="text" value={form.cause_of_death_ia} onChange={(e) => update('cause_of_death_ia', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Antecedent Cause (Ib)</label>
                <input type="text" value={form.cause_of_death_ib} onChange={(e) => update('cause_of_death_ib', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Contributory Cause (II)</label>
                <input type="text" value={form.cause_of_death_ii} onChange={(e) => update('cause_of_death_ii', e.target.value)} />
              </div>
            </div>

            <div className="form-group mt-2">
              <label>Comments / Opinion</label>
              <textarea value={form.comments} onChange={(e) => update('comments', e.target.value)} />
            </div>

            <div className="flex gap-1 mt-3">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Postmortem Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
