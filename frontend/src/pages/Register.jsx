import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';

function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seeker'); // 'seeker' | 'employer'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !role) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account. Please try again.');
      }

      // Automatically sign user in upon registration
      login(data.user, data.token);
      
      // Navigate to homepage
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
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
        maxWidth: '500px',
        boxShadow: 'var(--shadow-premium), var(--shadow-glow)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Join CareerSphere as a job seeker or hiring manager</p>
        </div>

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
          {/* Dual Role Selector Tab Bar */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ marginBottom: '10px' }}>Select Account Type</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: 'rgba(18, 20, 32, 0.6)',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid var(--card-border)'
            }}>
              <button
                type="button"
                onClick={() => setRole('seeker')}
                style={{
                  padding: '10px',
                  background: role === 'seeker' ? 'var(--accent-primary)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: role === 'seeker' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                👤 Job Seeker
              </button>
              <button
                type="button"
                onClick={() => setRole('employer')}
                style={{
                  padding: '10px',
                  background: role === 'employer' ? 'var(--accent-primary)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: role === 'employer' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                💼 Employer
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-name">Full Name / Company Name</label>
            <input
              type="text"
              id="register-name"
              className="form-control"
              placeholder="e.g. John Doe / Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email Address</label>
            <input
              type="email"
              id="register-email"
              className="form-control"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="register-password">Password</label>
            <input
              type="password"
              id="register-password"
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
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '20px'
        }}>
          Already registered? <Link to="/login" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Sign in instead</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
