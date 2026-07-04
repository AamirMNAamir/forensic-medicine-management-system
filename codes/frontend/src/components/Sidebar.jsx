import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const linkClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo-icon">FM</div>
        <div className="brand-text">
          <h2>FMDMS</h2>
          <small>Forensic Medicine Dept.</small>
        </div>
      </div>

      <div className="sidebar-section"><span>Main</span></div>
      <nav>
        <NavLink to="/dashboard" className={linkClass}>
          <span className="nav-icon">&#9632;</span>
          <span className="nav-text">Dashboard</span>
        </NavLink>
      </nav>

      <div className="sidebar-section"><span>Records</span></div>
      <nav>
        <NavLink to="/patients" className={linkClass}>
          <span className="nav-icon">&#128100;</span>
          <span className="nav-text">Patients</span>
        </NavLink>
        <NavLink to="/cases" className={linkClass}>
          <span className="nav-icon">&#128193;</span>
          <span className="nav-text">Cases</span>
        </NavLink>
        <NavLink to="/postmortems" className={linkClass}>
          <span className="nav-icon">&#9877;</span>
          <span className="nav-text">Postmortem</span>
        </NavLink>
        <NavLink to="/evidence" className={linkClass}>
          <span className="nav-icon">&#128230;</span>
          <span className="nav-text">Evidence</span>
        </NavLink>
        <NavLink to="/reports" className={linkClass}>
          <span className="nav-icon">&#128196;</span>
          <span className="nav-text">Reports</span>
        </NavLink>
      </nav>

      <div className="sidebar-section"><span>External</span></div>
      <nav>
        <NavLink to="/police" className={linkClass}>
          <span className="nav-icon">&#128737;</span>
          <span className="nav-text">Police Requests</span>
        </NavLink>
        <NavLink to="/staff" className={linkClass}>
          <span className="nav-icon">&#129658;</span>
          <span className="nav-text">Doctors / Staff</span>
        </NavLink>
      </nav>

      <div className="sidebar-section"><span>System</span></div>
      <nav>
        <NavLink to="/notifications" className={linkClass}>
          <span className="nav-icon">&#128276;</span>
          <span className="nav-text">Notifications</span>
        </NavLink>
        {(user.role_id === 1 || user.role_id === 2) && (
          <NavLink to="/audit-log" className={linkClass}>
            <span className="nav-icon">&#128203;</span>
            <span className="nav-text">Audit Log</span>
          </NavLink>
        )}
        <NavLink to="/profile" className={linkClass}>
          <span className="nav-icon">&#9881;</span>
          <span className="nav-text">Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <span className="footer-expanded">
          Logged in as<br /><strong style={{ color: '#fff' }}>{user.full_name}</strong><br />
          {user.role_name}
        </span>
      </div>
    </aside>
  );
}

