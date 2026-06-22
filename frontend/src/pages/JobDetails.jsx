import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isAuthenticated } = useAuth();

  // State
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [myApplication, setMyApplication] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Job posting not found.');
          }
          throw new Error('Failed to retrieve job details.');
        }
        const data = await res.json();
        setJob(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  // Check seeker application status if logged in
  useEffect(() => {
    if (isAuthenticated && user?.role === 'seeker') {
      const checkApplication = async () => {
        try {
          const res = await fetch('/api/applications', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            const found = data.find(app => app.jobId === id);
            if (found) {
              setApplied(true);
              setMyApplication(found);
            }
          }
        } catch (err) {
          console.error('Error checking application status:', err);
        }
      };
      
      const checkSaveState = async () => {
        try {
          const res = await fetch('/api/jobs/saved', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const found = data.some(j => j.id === id);
            setIsSaved(found);
          }
        } catch (err) {
          console.error('Error checking saved state:', err);
        }
      };

      checkApplication();
      checkSaveState();
    }
  }, [id, isAuthenticated, user, token]);

  // Handle Saved Job Toggle
  const handleToggleSave = async () => {
    const url = `/api/jobs/${id}/${isSaved ? 'unsave' : 'save'}`;
    const method = isSaved ? 'DELETE' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setIsSaved(!isSaved);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to toggle save status.');
      }
    } catch (err) {
      console.error('Error saving/unsaving job:', err);
    }
  };

  // Handle Application Submit
  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (user.role !== 'seeker') {
      alert('Only registered job seekers can apply for openings.');
      return;
    }

    try {
      setApplying(true);
      const res = await fetch(`/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setApplied(true);
      setApplyMessage(data.message || 'Application submitted successfully!');
      
      const appRes = await fetch('/api/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appRes.ok) {
        const apps = await appRes.json();
        const found = apps.find(app => app.jobId === id);
        if (found) setMyApplication(found);
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        <h3>Loading job profile...</h3>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '40px 24px', maxWidth: '500px', margin: '0 auto' }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h2 style={{ margin: '20px 0 10px 0', color: '#ff6b6b' }}>Failed to Load Job</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'The job you are looking for does not exist or has been removed.'}</p>
          <Link to="/" className="btn btn-primary">Back to Homepage</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition container" style={{ paddingTop: '50px', marginBottom: '80px' }}>
      
      {/* Back button */}
      <Link to="/" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--accent-secondary)',
        fontWeight: 600,
        marginBottom: '24px',
        fontSize: '0.95rem'
      }}>
        <span>←</span> Back to Job Feed
      </Link>

      {/* Main Layout Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '40px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Job Description and Info */}
        <section className="glass-card" style={{ padding: '40px' }}>
          <div style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingBottom: '24px',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <span className={`badge badge-${job.jobType || job.duration}`}>
                {(job.jobType || job.duration).replace('-', ' ')}
              </span>
              <span className={`badge badge-${job.workplaceType}`}>
                {job.workplaceType === 'online' ? '🌐 Remote' : '🏢 On-Site'}
              </span>
            </div>
            
            <h1 style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              lineHeight: '1.2',
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              {job.title}
            </h1>
            
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'var(--accent-secondary)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {job.company}
              {job.companyVerified && (
                <span className="verified-badge" title="Verified Employer">
                  ✓ Verified
                </span>
              )}
            </h3>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              color: 'var(--text-secondary)',
              fontSize: '0.95rem'
            }}>
              <span>📍 <strong>Location:</strong> {job.location}</span>
              <span>💰 <strong>Comp Range:</strong> ${job.salary.toLocaleString()}/yr</span>
              <span>📅 <strong>Posted:</strong> {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '16px' }}>Role Overview</h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap'
            }}>
              {job.description}
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '16px' }}>Required Competencies</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    background: 'var(--accent-primary-glow)',
                    border: '1px solid rgba(124, 58, 237, 0.25)',
                    color: '#a78bfa',
                    padding: '6px 14px',
                    borderRadius: '30px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Application CTA Widget */}
        <aside className="glass-card" style={{ padding: '30px', position: 'sticky', top: '100px' }}>
          
          {/* Seeker Save Job Bookmark button */}
          {isAuthenticated && user?.role === 'seeker' && (
            <button
              onClick={handleToggleSave}
              className="btn btn-secondary"
              style={{
                width: '100%',
                height: '42px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderColor: isSaved ? 'var(--accent-secondary)' : 'var(--card-border)',
                color: isSaved ? 'var(--accent-secondary)' : 'var(--text-primary)',
                background: isSaved ? 'var(--accent-primary-glow)' : 'transparent'
              }}
            >
              <span>{isSaved ? '⭐ Saved Job' : '☆ Save Job'}</span>
            </button>
          )}

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Apply For This Position</h3>
          
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Comp Package:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                ${job.salary.toLocaleString()} / year
              </div>
            </div>
            
            <div style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Commitment:</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, textTransform: 'capitalize', marginTop: '4px' }}>
                {(job.jobType || job.duration).replace('-', ' ')} ({job.workplaceType})
              </div>
            </div>
          </div>

          {/* Conditional Action Widget */}
          {!isAuthenticated ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                lineHeight: '1.4',
                marginBottom: '20px'
              }}>
                To apply for this role, submit your resume, or contact the hiring manager, please sign in to your job seeker account.
              </p>
              
              <button
                onClick={() => navigate('/login', { state: { from: location.pathname } })}
                className="btn btn-primary"
                style={{ width: '100%', height: '46px' }}
              >
                Login to Apply
              </button>
              
              <p style={{ fontSize: '0.82rem', marginTop: '14px', color: 'var(--text-muted)' }}>
                Don't have an account? <Link to="/register" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Register here</Link>
              </p>
            </div>
          ) : user.role === 'employer' ? (
            <div style={{
              background: 'rgba(6, 182, 212, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '16px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '1.75rem' }}>💼</span>
              <h4 style={{ margin: '8px 0 4px 0', fontSize: '0.95rem', color: '#22d3ee' }}>Employer Account</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                You are currently signed in as an employer. Job posting management is active, but seeking and applying to roles is restricted to seeker profiles.
              </p>
            </div>
          ) : applied ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '20px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>✅</span>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#34d399' }}>Application Sent!</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '20px' }}>
                {applyMessage || 'Your application profile has been shared with the hiring team.'}
              </p>

              {/* Seeker application progress and status workflow tracker */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', textAlign: 'left' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px' }}>
                  ATS Status Tracking:
                </h4>
                
                <div className="status-tracker-flow">
                  {['Applied', 'Shortlisted', 'Interview', 'Selected'].map((step, idx) => {
                    const statuses = ['Applied', 'Shortlisted', 'Interview', 'Selected'];
                    const currentIdx = statuses.indexOf(myApplication?.status || myApplication?.atsStatus || 'Applied');
                    const stepIdx = statuses.indexOf(step);
                    
                    let stepClass = 'status-step';
                    if (stepIdx === currentIdx) {
                      stepClass += ' active';
                    } else if (stepIdx < currentIdx) {
                      stepClass += ' completed';
                    }
                    
                    return (
                      <div key={step} className={stepClass}>
                        <div className="status-dot" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                          {stepIdx < currentIdx ? '✓' : idx + 1}
                        </div>
                        <div className="status-label" style={{ fontSize: '0.65rem', marginTop: '6px' }}>{step}</div>
                      </div>
                    );
                  })}
                </div>

                {myApplication?.statusHistory && (
                  <div style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '12px',
                    marginTop: '16px'
                  }}>
                    <h5 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      📜 Status Logs
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                      {myApplication.statusHistory.map((h, i) => (
                        <div key={i} style={{ fontSize: '0.72rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span><strong>{h.status}</strong></span>
                            <span>{new Date(h.changedAt).toLocaleDateString()}</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>{h.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Link to Messages with Employer */}
                {job.employerId && (
                  <Link 
                    to={`/chat?partnerId=${job.employerId}`}
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '16px', height: '40px', fontSize: '0.85rem' }}
                  >
                    💬 Chat with Hiring Manager
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                lineHeight: '1.4',
                marginBottom: '20px'
              }}>
                By applying, you will instantly share your contact details and resume link stored in your seeker profile with {job.company}.
              </p>
              
              <button
                onClick={handleApply}
                disabled={applying}
                className="btn btn-primary"
                style={{ width: '100%', height: '46px' }}
              >
                {applying ? 'Submitting Application...' : 'Apply Now 🚀'}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default JobDetails;
