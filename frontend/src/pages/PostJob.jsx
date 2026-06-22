import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

function PostJob() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(user?.name || '');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [skills, setSkills] = useState('');
  const [duration, setDuration] = useState('full-time');
  const [workplaceType, setWorkplaceType] = useState('online');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!title || !company || !location || !salary || !skills || !duration || !workplaceType || !description) {
      setError('Please fill in all fields to publish this job posting.');
      return;
    }

    if (isNaN(salary) || Number(salary) <= 0) {
      setError('Salary must be a valid number greater than 0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Parse comma-separated skills into array
      const skillsArray = skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const jobPayload = {
        title,
        company,
        location,
        salary: Number(salary),
        skills: skillsArray,
        duration,
        workplaceType,
        description
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish job opening.');
      }

      alert('Job listing published successfully!');
      // Navigate to homepage to see the new listing
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition container" style={{ paddingTop: '40px', marginBottom: '80px' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        
        {/* Page Title */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>Post A New Job</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Publish openings, specify criteria, and recruit elite talent.</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.9rem',
            marginBottom: '24px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Job Post Form */}
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="job-title">Job Title</label>
              <input
                type="text"
                id="job-title"
                className="form-control"
                placeholder="e.g. Senior Product Designer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Company */}
            <div className="form-group">
              <label className="form-label" htmlFor="job-company">Company Name</label>
              <input
                type="text"
                id="job-company"
                className="form-control"
                placeholder="e.g. Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label" htmlFor="job-location">Location</label>
              <input
                type="text"
                id="job-location"
                className="form-control"
                placeholder="e.g. San Francisco, CA or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            {/* Salary */}
            <div className="form-group">
              <label className="form-label" htmlFor="job-salary">Annual Salary (USD)</label>
              <input
                type="number"
                id="job-salary"
                className="form-control"
                placeholder="e.g. 110000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                required
              />
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label" htmlFor="job-duration">Job Duration</label>
              <select
                id="job-duration"
                className="form-control"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            {/* Workplace Type */}
            <div className="form-group">
              <label className="form-label" htmlFor="job-workplace">Workplace Type</label>
              <select
                id="job-workplace"
                className="form-control"
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="online">Online / Remote</option>
                <option value="offline">Offline / On-Site</option>
              </select>
            </div>
          </div>

          {/* Skills Required */}
          <div className="form-group">
            <label className="form-label" htmlFor="job-skills">Key Skills (Comma Separated)</label>
            <input
              type="text"
              id="job-skills"
              className="form-control"
              placeholder="e.g. React, Node.js, Express, JavaScript, Figma"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
              Separate multiple skills with commas. These match with the search filters.
            </span>
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label" htmlFor="job-desc">Job Description &amp; Requirements</label>
            <textarea
              id="job-desc"
              className="form-control"
              rows="6"
              placeholder="Provide a detailed role description, target responsibilities, qualifications, and day-to-day expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
              required
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              disabled={loading}
              style={{ height: '46px', width: '120px' }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ height: '46px', width: '180px' }}
            >
              {loading ? 'Publishing...' : 'Publish Job 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostJob;
