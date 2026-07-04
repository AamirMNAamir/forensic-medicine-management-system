import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="brand">
          <div className="brand-icon">FM</div>
          <h1>FMDMS</h1>
          <p>
            Forensic Medicine Department Management System — secure digital records for
            patients, postmortems, evidence and medico-legal reports.
          </p>
        </div>
      </div>
      <div className="login-right">
        <div className="login-box">
          <h2>Welcome back</h2>
          <p>Sign in to access the department system.</p>

          <Alert type="danger">{error}</Alert>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Log In'}
            </button>
          </form>
          <p className="text-sm text-muted mt-2">
            Demo credentials: <strong>admin</strong> / <strong>admin123</strong>
          </p>
          <p className="text-sm mt-3 text-center">
            Don't have an account? <Link to="/signup" style={{ fontWeight: '600' }}>Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
