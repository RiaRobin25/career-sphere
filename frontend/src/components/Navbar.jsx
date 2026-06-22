import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Dark/Light Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.filter(n => !n.isRead).length);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar-wrapper">
      <div className="container navbar">
        <NavLink to="/" className="nav-logo">
          <span style={{ fontSize: '1.75rem' }}>💼</span>
          <span>CareerSphere</span>
        </NavLink>

        <nav className="nav-links">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Home
          </NavLink>

          {/* Authenticated Links */}
          {isAuthenticated && (
            <>
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Dashboard
                {unreadCount > 0 && (
                  <span style={{
                    background: 'var(--danger)',
                    color: 'white',
                    fontSize: '0.72rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}>
                    {unreadCount}
                  </span>
                )}
              </NavLink>

              <NavLink 
                to="/chat" 
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                Messages
              </NavLink>

              <NavLink 
                to="/profile" 
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                Profile
              </NavLink>
            </>
          )}

          {/* Show Post Job only if user is an Employer */}
          {isAuthenticated && user?.role === 'employer' && (
            <NavLink 
              to="/post-job" 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Post Job
            </NavLink>
          )}

          {/* Show Admin Dashboard only if user is Admin */}
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink 
              to="/admin" 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Admin Panel
            </NavLink>
          )}

          {/* Theme Toggler */}
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {!isAuthenticated ? (
            <>
              <NavLink 
                to="/login" 
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                Login
              </NavLink>
              <NavLink 
                to="/register" 
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                Register
              </NavLink>
            </>
          ) : (
            <div className="nav-auth" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Hi, <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>
              </span>
              <span className="user-badge">
                {user.role === 'admin' 
                  ? '🛡️ Admin' 
                  : user.role === 'employer' 
                    ? '💼 Employer' 
                    : '👤 Seeker'
                }
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
