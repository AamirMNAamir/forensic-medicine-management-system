import './Topbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Topbar({ title, breadcrumb }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    api
      .get('/notifications')
      .then((res) => {
        if (mounted) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Close menu on outside click or Escape
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    function onEsc(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
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
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
        >
          <span aria-hidden="true">&#128276;</span>

          {unreadCount > 0 && (
            <span className="notif-badge">
              {unreadCount}
            </span>
          )}
        </Link>

        <div className="topbar-user" ref={menuRef}>
          <button
            type="button"
            className="user-chip"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <div className="avatar">{initials}</div>
            <span>{user.full_name}</span>
          </button>

          {menuOpen && (
            <div className="user-menu open" role="menu">
              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                My Profile
              </Link>

              <button
                role="menuitem"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}