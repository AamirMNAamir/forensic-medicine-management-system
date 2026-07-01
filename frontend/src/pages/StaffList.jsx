import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Loading, Empty } from '../components/UI';

export default function StaffList() {
  const { hasRole } = useAuth();
  const [staff, setStaff] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ full_name: '', designation: '', specialization: '', slmc_reg_no: '', contact_no: '', email: '' });
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get('/staff').then((res) => setStaff(res.data)).catch(() => setError('Failed to load staff.'));
  }

  useEffect(() => { load(); }, []);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name.trim()) { setError('Name is required.'); return; }
    setSubmitting(true);
    try {
      await api.post('/staff', form);
      setSuccessMsg('Staff member added.');
      setForm({ full_name: '', designation: '', specialization: '', slmc_reg_no: '', contact_no: '', email: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add staff.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout title="Doctors / Staff">
      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3>Doctors &amp; Staff {staff ? `(${staff.length})` : ''}</h3></div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {!staff && !error && <Loading />}
            {staff && staff.length === 0 && <Empty label="No staff records." />}
            {staff && staff.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Name</th><th>Designation</th><th>Specialization</th><th>Contact</th><th>Status</th></tr></thead>
                  <tbody>
                    {staff.map((s) => (
                      <tr key={s.staff_id}>
                        <td>{s.full_name}</td>
                        <td>{s.designation || '—'}</td>
                        <td>{s.specialization || '—'}</td>
                        <td>{s.contact_no || '—'}</td>
                        <td><span className={`badge ${s.is_active ? 'badge-issued' : 'badge-closed'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {hasRole(1, 2) && (
          <div className="card">
            <div className="card-header"><h3>Add Doctor / Staff</h3></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {[
                  ['full_name', 'Full Name', true],
                  ['designation', 'Designation'],
                  ['specialization', 'Specialization'],
                  ['slmc_reg_no', 'SLMC Reg No'],
                  ['contact_no', 'Contact No'],
                  ['email', 'Email'],
                ].map(([field, label, req]) => (
                  <div className="form-group mb-1" key={field}>
                    <label>{label} {req && <span className="req">*</span>}</label>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={form[field]}
                      onChange={(e) => update(field, e.target.value)}
                      required={!!req}
                    />
                  </div>
                ))}
                <div className="mt-2">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
