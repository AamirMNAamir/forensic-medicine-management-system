import './EvidenceAdd.css';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';

const TYPES = ['Photograph', 'Document', 'X-Ray', 'Lab Sample', 'Swab', 'Clothing', 'Other'];

export default function EvidenceAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('case_id');

  const [form, setForm] = useState({
    case_id: caseId || '', evidence_type: 'Other', description: '',
    storage_location: '', collected_date: '', collected_by: '', chain_of_custody: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.case_id || !form.description.trim()) {
      setError('Case and description are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/evidence', { ...form, case_id: Number(form.case_id) });
      navigate(`/cases/${form.case_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add evidence.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout title="Add Evidence" breadcrumb="Evidence / New">
      <div className="card" style={{ maxWidth: 800 }}>
        <div className="card-header"><h3>Add Evidence — Case {caseId || '?'}</h3></div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Evidence Type <span className="req">*</span></label>
                <select value={form.evidence_type} onChange={(e) => update('evidence_type', e.target.value)}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Storage Location</label>
                <input type="text" placeholder="e.g. Evidence Locker A-12" value={form.storage_location} onChange={(e) => update('storage_location', e.target.value)} />
              </div>
              <div className="form-group span-2">
                <label>Description <span className="req">*</span></label>
                <textarea required value={form.description} onChange={(e) => update('description', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Collected Date</label>
                <input type="date" value={form.collected_date} onChange={(e) => update('collected_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Collected By</label>
                <input type="text" value={form.collected_by} onChange={(e) => update('collected_by', e.target.value)} />
              </div>
              <div className="form-group span-2">
                <label>Chain of Custody Notes</label>
                <textarea placeholder="Record handover history for legal admissibility" value={form.chain_of_custody} onChange={(e) => update('chain_of_custody', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-1 mt-3">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Evidence'}
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
