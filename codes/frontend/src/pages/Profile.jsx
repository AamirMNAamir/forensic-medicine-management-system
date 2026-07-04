import './Profile.css';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Loading, fmtDate } from '../components/UI';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then((res) => setProfile(res.data)).catch(() => setProfile(user));
  }, []);

  function updatePw(field, value) { setPwForm((f) => ({ ...f, [field]: value })); }

  async function handlePwSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (pwForm.new_password !== pwForm.confirm_password) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (pwForm.new_password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setSuccess('Password updated successfully.');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout title="My Profile">
      {!profile && <Loading />}
      {profile && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3>Profile Information</h3></div>
            <div className="card-body">
              <table>
                <tbody>
                  <tr><td className="text-muted" style={{ width: 160 }}>Full Name</td><td>{profile.full_name}</td></tr>
                  <tr><td className="text-muted">Username</td><td>{profile.username}</td></tr>
                  <tr><td className="text-muted">Email</td><td>{profile.email || '—'}</td></tr>
                  <tr><td className="text-muted">Role</td><td><span className="badge badge-open">{profile.role_name}</span></td></tr>
                  <tr><td className="text-muted">Last Login</td><td>{fmtDate(profile.last_login)}</td></tr>
                  <tr><td className="text-muted">Account Created</td><td>{fmtDate(profile.created_at)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Change Password</h3></div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handlePwSubmit}>
                {[
                  ['current_password', 'Current Password'],
                  ['new_password', 'New Password'],
                  ['confirm_password', 'Confirm New Password'],
                ].map(([field, label]) => (
                  <div className="form-group mb-1" key={field}>
                    <label>{label}</label>
                    <input
                      type="password"
                      required
                      minLength={field !== 'current_password' ? 6 : 1}
                      value={pwForm[field]}
                      onChange={(e) => updatePw(field, e.target.value)}
                    />
                  </div>
                ))}
                <div className="mt-2">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
