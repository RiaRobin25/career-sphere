import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../App';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target after login (fallback to home page)
  const from = location.state?.from || "/";

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAutofill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in. Please try again.');
      }

      setSuccess('Login Successful! Redirecting...');
      
      setTimeout(() => {
        // Context login
        login(data.user, data.token);
        
        // Redirect based on role
        if (data.user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="page-transition container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 80px - 142px)',
      paddingTop: '40px',
      paddingBottom: '40px'
    }}>
      <div className="glass-card" style={{
        padding: '40px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: 'var(--shadow-premium), var(--shadow-glow)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Sign in to continue exploring verified jobs</p>
        </div>

        {/* Demo Credentials Box */}
        <div style={{
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '20px',
          fontSize: '0.85rem'
        }}>
          <h4 style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--accent-secondary)' }}>🔑 Demo Accounts</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>👤 Seeker: <strong>demo_user@gmail.com</strong> / <strong>demo123</strong></span>
              <button 
                type="button" 
                onClick={() => handleAutofill('demo_user@gmail.com', 'demo123')}
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '0.72rem', height: '24px' }}
              >
                Autofill
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>💼 Employer: <strong>demo_employer@gmail.com</strong> / <strong>demo123</strong></span>
              <button 
                type="button" 
                onClick={() => handleAutofill('demo_employer@gmail.com', 'demo123')}
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '0.72rem', height: '24px' }}
              >
                Autofill
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🛡️ Admin: <strong>admin</strong> / <strong>admin123</strong></span>
              <button 
                type="button" 
                onClick={() => handleAutofill('admin', 'admin123')}
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '0.72rem', height: '24px' }}
              >
                Autofill
              </button>
            </div>
          </div>
        </div>

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.9rem',
            marginBottom: '20px'
          }}>
            ✅ {success}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.9rem',
            marginBottom: '20px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email or Username</label>
            <input
              type="text"
              id="login-email"
              className="form-control"
              placeholder="demo_user or name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              type="password"
              id="login-password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', height: '46px', fontSize: '1rem', marginBottom: '20px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '20px'
        }}>
          New to CareerSphere? <Link to="/register" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
