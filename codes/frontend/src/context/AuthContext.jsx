import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { hasPermission as userHasPermission } from '../config/rbac';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('fmdms_user') || sessionStorage.getItem('fmdms_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fmdms_token') || sessionStorage.getItem('fmdms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem('fmdms_token');
        localStorage.removeItem('fmdms_user');
        sessionStorage.removeItem('fmdms_token');
        sessionStorage.removeItem('fmdms_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Inactivity timeout logic (15 minutes)
  useEffect(() => {
    if (!user) return;

    let timeoutId;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

    function resetTimer() {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        alert('Your session has expired due to inactivity. Please log in again.');
      }, INACTIVITY_LIMIT);
    }

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [user]);

  async function login(username, password, rememberMe = false) {
    const res = await api.post('/auth/login', { username, password });
    
    if (rememberMe) {
      localStorage.setItem('fmdms_token', res.data.token);
      localStorage.setItem('fmdms_user', JSON.stringify(res.data.user));
      // Make sure we clear session storage so there are no conflicting states
      sessionStorage.removeItem('fmdms_token');
      sessionStorage.removeItem('fmdms_user');
    } else {
      sessionStorage.setItem('fmdms_token', res.data.token);
      sessionStorage.setItem('fmdms_user', JSON.stringify(res.data.user));
      // Make sure we clear local storage
      localStorage.removeItem('fmdms_token');
      localStorage.removeItem('fmdms_user');
    }
    
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('fmdms_token');
    localStorage.removeItem('fmdms_user');
    sessionStorage.removeItem('fmdms_token');
    sessionStorage.removeItem('fmdms_user');
    setUser(null);
  }

  function hasRole(...roleIds) {
    return Boolean(user && roleIds.flat().includes(user.role_id));
  }

  function hasPermission(permission) {
    return userHasPermission(user, permission);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
