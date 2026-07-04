import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';
import api from '../api/client';

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  
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
        setRoles(res.data);
        if (res.data.length > 0) {
          setRoleId(res.data[0].role_id.toString());
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
    
    if (!fullName || !username || !password || !roleId || !contactNo) {
      setError('Please fill in all required fields.');
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
    <div className="login-page" style={{ minHeight: '120vh', padding: '2rem 0' }}>
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
        <div className="login-box" style={{ maxWidth: '500px', width: '90%' }}>
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
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
