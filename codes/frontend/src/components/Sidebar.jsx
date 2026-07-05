import './Sidebar.css';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/rbac';

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const linkClass = ({ isActive }) => (isActive ? 'active' : '');
  const can = (permission) => permission.includes(user.role_id);
  const showPatients = can(PERMISSIONS.PATIENT_READ);
  const showCases = can(PERMISSIONS.CASE_READ);
  const showPostmortem = can(PERMISSIONS.POSTMORTEM_READ);
  const showEvidence = can(PERMISSIONS.EVIDENCE_READ);
  const showReports = can(PERMISSIONS.REPORT_READ);
  const showPolice = can(PERMISSIONS.POLICE_READ);
  const showStaff = can(PERMISSIONS.STAFF_READ);
  const showAuditLog = can(PERMISSIONS.AUDIT_READ);
  const showUsers = can(PERMISSIONS.USER_MANAGE);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo-icon">FM</div>
        <h2>FMDMS</h2>
        <small>Forensic Medicine Dept.</small>
      </div>

      <div className="sidebar-section"><span>Main</span></div>
      <nav>
        <NavLink to="/dashboard" className={linkClass}>
          <span className="nav-icon" aria-hidden="true">&#9632;</span> Dashboard
        </NavLink>
      </nav>

      {(showPatients || showCases || showPostmortem || showEvidence || showReports) && (
        <>
          <div className="sidebar-section"><span>Records</span></div>
          <nav>
            {showPatients && (
              <NavLink to="/patients" className={linkClass}>
                <span className="nav-icon" aria-hidden="true">&#128100;</span> Patients
              </NavLink>
            )}
            {showCases && (
              <NavLink to="/cases" className={linkClass}>
                <span className="nav-icon" aria-hidden="true">&#128193;</span> Cases
              </NavLink>
            )}
            {showPostmortem && (
              <NavLink to="/postmortems" className={linkClass}>
                <span className="nav-icon" aria-hidden="true">&#9877;</span> Postmortem
              </NavLink>
            )}
            {showEvidence && (
              <NavLink to="/evidence" className={linkClass}>
                <span className="nav-icon" aria-hidden="true">&#128230;</span> Evidence
              </NavLink>
            )}
            {showReports && (
              <NavLink to="/reports" className={linkClass}>
                <span className="nav-icon" aria-hidden="true">&#128196;</span> Reports
              </NavLink>
            )}
          </nav>
        </>
      )}

      {(showPolice || showStaff) && (
        <>
          <div className="sidebar-section"><span>External</span></div>
          <nav>
            {showPolice && (
              <NavLink to="/police" className={linkClass}>
                <span className="nav-icon" aria-hidden="true">&#128737;</span> Police Requests
              </NavLink>
            )}
            {showStaff && (
              <NavLink to="/staff" className={linkClass}>
                <span className="nav-icon" aria-hidden="true">&#129658;</span> Doctors / Staff
              </NavLink>
            )}
          </nav>
        </>
      )}

      <div className="sidebar-section"><span>System</span></div>
      <nav>
        <NavLink to="/notifications" className={linkClass}>
          <span className="nav-icon" aria-hidden="true">&#128276;</span> Notifications
        </NavLink>

        {showAuditLog && (
          <NavLink to="/audit-log" className={linkClass}>
            <span className="nav-icon" aria-hidden="true">&#128203;</span> Audit Log
          </NavLink>
        )}

        {showUsers && (
          <NavLink to="/users" className={linkClass}>
            <span className="nav-icon" aria-hidden="true">&#128101;</span> User Management
          </NavLink>
        )}

        <NavLink to="/profile" className={linkClass}>
          <span className="nav-icon" aria-hidden="true">&#9881;</span> Profile
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        Logged in as
        <br />
        <strong style={{ color: '#fff' }}>{user.full_name}</strong>
        <br />
        {user.role_name}
      </div>
    </aside>
  );
}