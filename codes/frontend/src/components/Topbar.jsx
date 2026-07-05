import './Topbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Topbar({ title, breadcrumb }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    api
      .get('/notifications')
      .then((res) => {
        if (mounted) setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  const initials = user.full_name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <h1>{title || 'Dashboard'}</h1>
          {breadcrumb && <div className="breadcrumb">{breadcrumb}</div>}
        </div>
      </div>
      <div className="topbar-right">
        <Link
          to="/notifications"
          className="notif-btn"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <span aria-hidden="true">&#128276;</span>
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </Link>
        <div className="topbar-user">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <span>{user.full_name}</span>
          </div>
          <div className="user-menu">
            <Link to="/profile">My Profile</Link>
            <button onClick={handleLogout}>Log Out</button>
          </div>
        </div>
      </div>
    </header>
  );
}
