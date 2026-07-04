import './PatientForm.css';
import { useState } from 'react';

const EMPTY = {
  full_name: '', patient_type: 'Clinical', nic_passport: '', age: '',
  date_of_birth: '', gender: 'Unknown', contact_no: '', address: '', hospital_no: '',
};

export default function PatientForm({ initial, onSubmit, submitLabel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim()) {
      setError('Full name is required.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="form-grid">
        <div className="form-group span-2">
          <label>Full Name <span className="req">*</span></label>
          <input type="text" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Record Type</label>
          <select value={form.patient_type} onChange={(e) => update('patient_type', e.target.value)}>
            <option value="Clinical">Clinical Patient</option>
            <option value="Deceased">Deceased (Postmortem)</option>
          </select>
        </div>
        <div className="form-group">
          <label>NIC / Passport No</label>
          <input type="text" value={form.nic_passport || ''} onChange={(e) => update('nic_passport', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Age</label>
          <input type="number" min="0" max="150" value={form.age || ''} onChange={(e) => update('age', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Date of Birth</label>
          <input type="date" value={form.date_of_birth || ''} onChange={(e) => update('date_of_birth', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Gender</label>
          <select value={form.gender} onChange={(e) => update('gender', e.target.value)}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
        <div className="form-group">
          <label>Contact No</label>
          <input type="text" value={form.contact_no || ''} onChange={(e) => update('contact_no', e.target.value)} />
        </div>
        <div className="form-group span-2">
          <label>Address</label>
          <textarea value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Hospital No</label>
          <input type="text" value={form.hospital_no || ''} onChange={(e) => update('hospital_no', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-1 mt-3">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
