import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';
import api from '../api/client';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '#dde3ea' };
  if (pwd.length < 6) return { score: 1, label: 'Too short (min 6 characters)', color: '#dc3545' };
  
  let score = 0;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  
  if (score <= 1) return { score: 1, label: 'Weak', color: '#dc3545' };
  if (score === 2) return { score: 2, label: 'Fair', color: '#ffc107' };
  if (score === 3) return { score: 3, label: 'Good', color: '#328CC1' };
  return { score: 4, label: 'Strong', color: '#198754' };
};

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Role-specific fields
  const [slmcRegNo, setSlmcRegNo] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [contactNo, setContactNo] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await api.get('/auth/roles');
        const visibleRoles = res.data.filter((role) => Number(role.role_id) !== 1);
        setRoles(visibleRoles);
        if (visibleRoles.length > 0) {
          setRoleId(visibleRoles[0].role_id.toString());
        } else {
          setRoleId('');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load system roles.');
      } finally {
        setLoadingRoles(false);
      }
    }
    fetchRoles();
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const getRoleFields = () => {
    const rid = parseInt(roleId);
    switch (rid) {
      case 1: // System Admin
        return {
          slmcLabel: 'Admin Staff ID *',
          slmcPlaceholder: 'e.g. ADM-001',
          specLabel: 'System Division *',
          specPlaceholder: 'e.g. IT Security, Infrastructure',
          showSlmc: true,
          showSpec: true
        };
      case 2: // Consultant JMO
        return {
          slmcLabel: 'SLMC Reg Number *',
          slmcPlaceholder: 'e.g. SLMC-12345',
          specLabel: 'Medical Specialization *',
          specPlaceholder: 'e.g. Forensic Pathology',
          showSlmc: true,
          showSpec: true
        };
      case 3: // Medical Officer
        return {
          slmcLabel: 'SLMC Reg Number *',
          slmcPlaceholder: 'e.g. SLMC-67890',
          specLabel: 'Medical Specialization *',
          specPlaceholder: 'e.g. Forensic Medicine',
          showSlmc: true,
          showSpec: true
        };
      case 4: // Laboratory Officer
        return {
          slmcLabel: 'Lab Registry/License No *',
          slmcPlaceholder: 'e.g. LAB-10022',
          specLabel: 'Lab Specialization *',
          specPlaceholder: 'e.g. DNA Analysis, Toxicology',
          showSlmc: true,
          showSpec: true
        };
      case 5: // Clerical Officer
        return {
          slmcLabel: 'Employee/Clerk ID *',
          slmcPlaceholder: 'e.g. CLK-5544',
          specLabel: 'Department/Section *',
          specPlaceholder: 'e.g. Administration, Archiving',
          showSlmc: true,
          showSpec: true
        };
      case 6: // Court Liaison Officer
        return {
          slmcLabel: 'Liaison/Badge ID *',
          slmcPlaceholder: 'e.g. CLO-9922',
          specLabel: 'Assigned Court/Jurisdiction *',
          specPlaceholder: 'e.g. Kandy Magistrate Court',
          showSlmc: true,
          showSpec: true
        };
      case 7: // Research Officer
        return {
          slmcLabel: 'Researcher/Institutional ID *',
          slmcPlaceholder: 'e.g. RES-3344',
          specLabel: 'Research Specialty/Dept *',
          specPlaceholder: 'e.g. Academic Research, Statistics',
          showSlmc: true,
          showSpec: true
        };
      case 8: // Data Entry Operator
        return {
          slmcLabel: 'Operator ID *',
          slmcPlaceholder: 'e.g. DEO-2211',
          specLabel: 'Shift/Section *',
          specPlaceholder: 'e.g. Day Shift, Digitization Dept',
          showSlmc: true,
          showSpec: true
        };
      default:
        return {
          slmcLabel: '',
          slmcPlaceholder: '',
          specLabel: '',
          specPlaceholder: '',
          showSlmc: false,
          showSpec: false
        };
    }
  };

  const fields = getRoleFields();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!fullName || !username || !password || !confirmPassword || !roleId || !contactNo) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (fields.showSlmc && !slmcRegNo) {
      setError(`Please provide your ${fields.slmcLabel.replace(' *', '')}.`);
      return;
    }

    if (fields.showSpec && !specialization) {
      setError(`Please provide your ${fields.specLabel.replace(' *', '')}.`);
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        full_name: fullName,
        username,
        email,
        password,
        role_id: parseInt(roleId),
        slmc_reg_no: fields.showSlmc ? slmcRegNo : null,
        specialization: fields.showSpec ? specialization : null,
        contact_no: contactNo
      });
      setSuccess('Registration successful! Redirecting to login...');
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
            Forensic Medicine Department Management System
            <br />
            secure digital records for patients, postmortems, evidence and medico-legal reports.
          </p>
        </div>
      </div>
      <div className="login-right">
        <div className="login-box">
          <h2>Create an Account</h2>
          <p>Register as a system user.</p>

          <Alert type={success ? 'success' : 'danger'}>{success || error}</Alert>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password *</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {/* Password strength meter */}
              {password && (
                <div className="password-strength-meter">
                  <div className="strength-bars">
                    <div className="strength-bar" style={{ backgroundColor: getPasswordStrength(password).score >= 1 ? getPasswordStrength(password).color : '#dde3ea' }} />
                    <div className="strength-bar" style={{ backgroundColor: getPasswordStrength(password).score >= 2 ? getPasswordStrength(password).color : '#dde3ea' }} />
                    <div className="strength-bar" style={{ backgroundColor: getPasswordStrength(password).score >= 3 ? getPasswordStrength(password).color : '#dde3ea' }} />
                    <div className="strength-bar" style={{ backgroundColor: getPasswordStrength(password).score >= 4 ? getPasswordStrength(password).color : '#dde3ea' }} />
                  </div>
                  <span className="strength-text" style={{ color: getPasswordStrength(password).color }}>
                    {getPasswordStrength(password).label}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Role / Party *</label>
              {loadingRoles ? (
                <select disabled><option>Loading roles...</option></select>
              ) : (
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  required
                >
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.role_name} - {r.description}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Dynamic Role-specific details */}
            {!loadingRoles && fields.showSlmc && (
              <div className="form-group">
                <label>{fields.slmcLabel}</label>
                <input
                  type="text"
                  value={slmcRegNo}
                  onChange={(e) => setSlmcRegNo(e.target.value)}
                  placeholder={fields.slmcPlaceholder}
                  required
                />
              </div>
            )}

            {!loadingRoles && fields.showSpec && (
              <div className="form-group">
                <label>{fields.specLabel}</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder={fields.specPlaceholder}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Contact Number *</label>
              <input
                type="text"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                placeholder="e.g. 0711234567"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting || loadingRoles}>
              {submitting ? 'Registering...' : 'Sign Up'}
            </button>
          </form>
          
          <p className="text-sm text-muted mt-2 text-center">
            Already have an account? <Link to="/login"><strong>Log In</strong></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
