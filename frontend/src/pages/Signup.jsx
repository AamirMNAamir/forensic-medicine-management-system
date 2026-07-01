import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';
import api from '../api/client';

export default function Signup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('5'); // Default to Receptionist (5)
  
  // Doctor/JMO fields
  const [slmcRegNo, setSlmcRegNo] = useState('');
  const [designation, setDesignation] = useState('Doctor/JMO');
  const [specialization, setSpecialization] = useState('Forensic Medicine');
  const [contactNo, setContactNo] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password || !fullName || !roleId) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        username,
        password,
        full_name: fullName,
        email,
        role_id: Number(roleId),
      };

      if (Number(roleId) === 3) {
        payload.slmc_reg_no = slmcRegNo;
        payload.designation = designation;
        payload.specialization = specialization;
        payload.contact_no = contactNo;
      }

      await api.post('/auth/register', payload);
      setSuccess('Account created successfully! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
      <div className="login-right" style={{ overflowY: 'auto', maxHeight: '100vh', display: 'block', padding: '2rem' }}>
        <div className="login-box" style={{ margin: 'auto', padding: '1rem 0' }}>
          <h2>Create Account</h2>
          <p>Register as a system user.</p>

          <Alert type="danger">{error}</Alert>
          <Alert type="success">{success}</Alert>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name <span className="req">*</span></label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="form-group mt-1">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group mt-1">
              <label>Username <span className="req">*</span></label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group mt-1">
              <label>Password <span className="req">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group mt-1">
              <label>System Role <span className="req">*</span></label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
              >
                <option value="5">Reception Staff</option>
                <option value="3">Doctor / JMO</option>
                <option value="1">Super Admin</option>
              </select>
            </div>

            {Number(roleId) === 3 && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <h4 className="mb-2" style={{ color: 'var(--primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doctor/JMO Details</h4>
                <div className="form-group">
                  <label>SLMC Reg No <span className="req">*</span></label>
                  <input
                    type="text"
                    value={slmcRegNo}
                    onChange={(e) => setSlmcRegNo(e.target.value)}
                    placeholder="SLMC-XXXXX"
                    required
                  />
                </div>
                <div className="form-group mt-1">
                  <label>Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
                <div className="form-group mt-1">
                  <label>Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                </div>
                <div className="form-group mt-1">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
              {submitting ? 'Registering...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-sm mt-3 text-center">
            Already have an account? <Link to="/login" style={{ fontWeight: '600' }}>Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
