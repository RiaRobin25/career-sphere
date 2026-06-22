import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

function Home() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState([]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [minSalary, setMinSalary] = useState(0);
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [selectedWorkplaceTypes, setSelectedWorkplaceTypes] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState([]);
  const [selectedEducation, setSelectedEducation] = useState([]);

  // Popular skills available for filtering
  const availableSkills = [
    'React', 'Node.js', 'Express', 'JavaScript', 'HTML', 'CSS', 
    'Figma', 'React-Native', 'iOS', 'Android', 'Design-Systems', 'REST-API'
  ];

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      if (!res.ok) {
        throw new Error('Failed to load jobs from server');
      }
      const data = await res.json();
      setJobs(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Make sure it is running!');
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved job IDs
  const fetchSavedJobIds = async () => {
    if (isAuthenticated && user?.role === 'seeker') {
      try {
        const res = await fetch('/api/jobs/saved', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSavedJobIds(data.map(j => j.id));
        }
      } catch (err) {
        console.error('Error fetching saved jobs:', err);
      }
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchSavedJobIds();
  }, [isAuthenticated]);

  // Handle Delete
  const handleDeleteJob = async (e, jobId) => {
    e.stopPropagation(); // Avoid triggering card navigation click

    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete job');
      }

      setJobs(prevJobs => prevJobs.filter(j => j.id !== jobId));
      alert('Job posting deleted successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Handle Saved Job Toggle
  const handleToggleSaveJob = async (e, jobId) => {
    e.stopPropagation();
    const isSaved = savedJobIds.includes(jobId);
    const url = `/api/jobs/${jobId}/${isSaved ? 'unsave' : 'save'}`;
    const method = isSaved ? 'DELETE' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSavedJobIds(prev => 
          isSaved ? prev.filter(id => id !== jobId) : [...prev, jobId]
        );
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to toggle saved job.');
      }
    } catch (err) {
      console.error('Error toggling save state:', err);
    }
  };

  // Toggle skill selection
  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Toggle job type selection
  const handleJobTypeToggle = (type) => {
    if (selectedJobTypes.includes(type)) {
      setSelectedJobTypes(selectedJobTypes.filter(t => t !== type));
    } else {
      setSelectedJobTypes([...selectedJobTypes, type]);
    }
  };

  // Toggle experience selection
  const handleExperienceToggle = (level) => {
    if (selectedExperience.includes(level)) {
      setSelectedExperience(selectedExperience.filter(l => l !== level));
    } else {
      setSelectedExperience([...selectedExperience, level]);
    }
  };

  // Toggle education selection
  const handleEducationToggle = (edu) => {
    if (selectedEducation.includes(edu)) {
      setSelectedEducation(selectedEducation.filter(e => e !== edu));
    } else {
      setSelectedEducation([...selectedEducation, edu]);
    }
  };

  // Toggle workplace type selection
  const handleWorkplaceToggle = (type) => {
    if (selectedWorkplaceTypes.includes(type)) {
      setSelectedWorkplaceTypes(selectedWorkplaceTypes.filter(t => t !== type));
    } else {
      setSelectedWorkplaceTypes([...selectedWorkplaceTypes, type]);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setMinSalary(0);
    setSelectedJobTypes([]);
    setSelectedWorkplaceTypes([]);
    setSelectedSkills([]);
    setSelectedExperience([]);
    setSelectedEducation([]);
  };

  // Apply filtering logic on client side
  const filteredJobs = jobs.filter(job => {
    const matchSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchLocation = locationQuery === '' ||
      job.location.toLowerCase().includes(locationQuery.toLowerCase());

    const matchSalary = job.salary >= minSalary;

    const matchJobType = selectedJobTypes.length === 0 ||
      selectedJobTypes.includes(job.jobType || job.duration);

    const matchWorkplace = selectedWorkplaceTypes.length === 0 ||
      selectedWorkplaceTypes.includes(job.workplaceType);

    const matchExperience = selectedExperience.length === 0 ||
      selectedExperience.includes(job.experienceLevel || 'mid');

    const matchEducation = selectedEducation.length === 0 ||
      selectedEducation.includes(job.education || "Bachelor's");

    const matchSkills = selectedSkills.length === 0 ||
      selectedSkills.some(skill => 
        job.skills.some(js => js.toLowerCase() === skill.toLowerCase())
      );

    return matchSearch && matchLocation && matchSalary && matchJobType && matchWorkplace && matchExperience && matchEducation && matchSkills;
  });

  return (
    <div className="page-transition container" style={{ paddingTop: '40px' }}>
      
      {/* Hero Header Section */}
      <section className="hero-banner" style={{
        textAlign: 'center',
        marginBottom: '48px',
        padding: '40px 20px',
        borderRadius: 'var(--border-radius-lg)',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.03)',
        backdropFilter: 'blur(8px)'
      }}>
        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          marginBottom: '16px',
          background: 'linear-gradient(to right, var(--text-primary), var(--accent-primary), var(--accent-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: '1.2'
        }}>
          Discover Your Dream Career
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.1rem',
          maxWidth: '650px',
          margin: '0 auto 30px auto'
        }}>
          Search and filter through verified tech, creative, and administrative roles. Apply with a single click or post job openings instantly.
        </p>

        {/* Hero Keyword Search */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          position: 'relative'
        }}>
          <span style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.25rem',
            color: 'var(--text-muted)'
          }}>🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by Job Title, Company, or Keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '48px',
              height: '56px',
              borderRadius: '30px',
              fontSize: '1.05rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          />
        </div>
      </section>

      {/* Main Content Layout Grid */}
      <div className="home-layout-grid" style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '32px',
        alignItems: 'start',
        marginBottom: '60px'
      }}>
        
        {/* Left Side: Filter Options */}
        <aside className="glass-card" style={{
          padding: '24px',
          position: 'sticky',
          top: '100px',
          zIndex: 10
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingBottom: '12px'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Filter Jobs</h3>
            <button 
              onClick={resetFilters} 
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-secondary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.target.style.textDecoration = 'none'}
            >
              Reset All
            </button>
          </div>

          {/* Location Filter */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Location</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.95rem',
                color: 'var(--text-muted)'
              }}>📍</span>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Remote, Austin..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                style={{ paddingLeft: '34px', height: '42px', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Salary Filter (Slider) */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Min Salary</label>
              <span style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', fontWeight: 700 }}>
                ${(minSalary / 1000).toFixed(0)}k+
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="150000"
              step="5000"
              value={minSalary}
              onChange={(e) => setMinSalary(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--accent-secondary)',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Job Type Checkboxes */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Job Type</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['full-time', 'part-time', 'contract', 'internship'].map((type) => (
                <label key={type} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedJobTypes.includes(type)}
                    onChange={() => handleJobTypeToggle(type)}
                    style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{type.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Workplace Type (Online/Offline) */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Workplace</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'online', label: 'Online / Remote' },
                { id: 'offline', label: 'Offline / On-Site' }
              ].map((wp) => (
                <label key={wp.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedWorkplaceTypes.includes(wp.id)}
                    onChange={() => handleWorkplaceToggle(wp.id)}
                    style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                  />
                  <span>{wp.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Experience Level Filter */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Experience Level</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['entry', 'mid', 'senior'].map((level) => (
                <label key={level} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedExperience.includes(level)}
                    onChange={() => handleExperienceToggle(level)}
                    style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{level} Level</span>
                </label>
              ))}
            </div>
          </div>

          {/* Education Qualification Filter */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Education</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {["High School", "Bachelor's", "Master's", "PhD"].map((edu) => (
                <label key={edu} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedEducation.includes(edu)}
                    onChange={() => handleEducationToggle(edu)}
                    style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                  />
                  <span>{edu}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <label className="form-label">Key Skills</label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              maxHeight: '220px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {availableSkills.map((skill) => {
                const active = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                      background: active ? 'var(--accent-primary-glow)' : 'transparent',
                      color: active ? '#a78bfa' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Side: Job Listings List */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>
              Available Openings ({filteredJobs.length})
            </h2>
            {isAuthenticated && user?.role === 'employer' && (
              <button 
                onClick={() => navigate('/post-job')} 
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                + Post A Job
              </button>
            )}
          </div>

          {error && (
            <div className="glass-card" style={{
              padding: '24px',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.05)'
            }}>
              <span style={{ fontSize: '2.5rem' }}>🔌</span>
              <h3 style={{ margin: '12px 0 6px 0', color: '#ff6b6b' }}>Server Connection Issue</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{error}</p>
              <button onClick={fetchJobs} className="btn btn-secondary" style={{ marginTop: '16px' }}>
                Retry Connecting
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Searching jobs database...</div>
            </div>
          ) : filteredJobs.length === 0 && !error ? (
            <div className="glass-card" style={{
              padding: '60px 24px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <h3 style={{ margin: '16px 0 8px 0', fontSize: '1.25rem' }}>No matching job openings found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
                Try relaxing your search terms or unchecking some filter categories (location, salary range, job type, education, experience, or skills).
              </p>
              <button onClick={resetFilters} className="btn btn-secondary" style={{ marginTop: '20px' }}>
                Reset Filters
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <article 
                key={job.id}
                onClick={() => navigate(`/job/${job.id}`)}
                className="glass-card fade-in"
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '6px'
                    }}>
                      {job.title}
                    </h3>
                    <h4 style={{
                      fontSize: '0.98rem',
                      fontWeight: 600,
                      color: 'var(--accent-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {job.company}
                      {job.companyVerified && (
                        <span className="verified-badge" title="Verified Employer">
                          ✓ Verified
                        </span>
                      )}
                    </h4>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                    {/* Seeker Action Controls: Save Button */}
                    {isAuthenticated && user?.role === 'seeker' && (
                      <button
                        onClick={(e) => handleToggleSaveJob(e, job.id)}
                        className="btn btn-secondary"
                        title={savedJobIds.includes(job.id) ? "Unsave Job" : "Save Job"}
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderColor: savedJobIds.includes(job.id) ? 'var(--accent-secondary)' : 'var(--card-border)',
                          color: savedJobIds.includes(job.id) ? 'var(--accent-secondary)' : 'var(--text-primary)',
                          background: savedJobIds.includes(job.id) ? 'var(--accent-primary-glow)' : 'transparent'
                        }}
                      >
                        <span>{savedJobIds.includes(job.id) ? '⭐ Saved' : '☆ Save'}</span>
                      </button>
                    )}

                    {/* Employer Action Controls: Delete Button */}
                    {isAuthenticated && user?.role === 'employer' && (
                      <button
                        onClick={(e) => handleDeleteJob(e, job.id)}
                        className="btn btn-danger"
                        title="Delete this job posting"
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>🗑️</span> Delete
                      </button>
                    )}
                  </div>
                </div>

                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.92rem',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: '2',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {job.description}
                </p>

                {/* Job metadata and badge list */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '10px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  paddingTop: '16px'
                }}>
                  <span className={`badge badge-${job.jobType || job.duration}`}>
                    {(job.jobType || job.duration).replace('-', ' ')}
                  </span>
                  
                  <span className={`badge badge-${job.workplaceType}`}>
                    {job.workplaceType === 'online' ? '🌐 Remote' : '🏢 On-Site'}
                  </span>

                  <span style={{
                    background: 'rgba(6, 182, 212, 0.05)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    color: 'var(--accent-secondary)'
                  }} className="badge">
                    ⚡ {job.experienceLevel || 'mid'}
                  </span>

                  <span style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)'
                  }} className="badge">
                    🎓 {job.education || "Bachelor's"}
                  </span>

                  <span style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginLeft: '4px'
                  }}>
                    📍 {job.location}
                  </span>

                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--success)',
                    marginLeft: 'auto'
                  }}>
                    ${job.salary.toLocaleString()}/yr
                  </span>
                </div>

                {/* Skill tag lists */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {job.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 500
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

export default Home;
