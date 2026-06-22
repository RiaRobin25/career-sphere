import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

function Profile() {
  const { user, token, login } = useAuth();
  
  // States
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    skills: [],
    profilePicture: '',
    education: '',
    experience: '',
    preferredRole: '',
    preferredLocation: '',
    
    // Company Fields
    companyName: '',
    companyLogo: '',
    industry: '',
    companyDescription: '',
    companyWebsite: '',
    companyLocation: '',
    verified: false,
    verificationRequested: false
  });
  
  const [skillsInput, setSkillsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Fetch current profile details
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load profile.');
      const data = await res.json();
      setProfile(data);
      if (data.skills) {
        setSkillsInput(data.skills.join(', '));
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Submit Profile Changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const bodyData = { ...profile };
      if (user.role === 'seeker') {
        bodyData.skills = skillsInput;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');

      // Update local profile state
      setProfile(data.user);
      // Sync auth context user state
      login(data.user, token);

      setMessage('Profile updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Upload Profile Picture / Logo
  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert('Please choose an image file.');
      return;
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      setUploadingImage(true);
      const res = await fetch('/api/profile/image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image.');

      setProfile(prev => ({
        ...prev,
        profilePicture: user.role === 'seeker' ? data.imagePath : prev.profilePicture,
        companyLogo: user.role === 'employer' ? data.imagePath : prev.companyLogo
      }));

      // Refresh profile to sync Context
      const profileRes = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const refreshed = await profileRes.json();
        login(refreshed, token);
      }

      alert('Image uploaded successfully!');
      setImageFile(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Request Verification Badge
  const handleRequestVerification = async () => {
    try {
      const res = await fetch('/api/profile/request-verification', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Request failed.');
      }
      setProfile(prev => ({ ...prev, verificationRequested: true }));
      alert('Verification request submitted successfully to administrators.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Profile Completion Meter Calculation
  const calculateCompletion = () => {
    let score = 0;
    const suggestions = [];

    if (user.role === 'seeker') {
      // Seeker completion mapping
      if (profile.name) score += 15; else suggestions.push({ field: 'name', label: 'Full Name', weight: 15 });
      if (profile.email) score += 15; else suggestions.push({ field: 'email', label: 'Email Address', weight: 15 });
      if (profile.phone) score += 15; else suggestions.push({ field: 'phone', label: 'Phone Number', weight: 15 });
      if (profile.location) score += 10; else suggestions.push({ field: 'location', label: 'Current Location', weight: 10 });
      if (profile.skills && profile.skills.length > 0) score += 15; else suggestions.push({ field: 'skills', label: 'Key Skills', weight: 15 });
      if (profile.profilePicture) score += 10; else suggestions.push({ field: 'profilePicture', label: 'Profile Picture', weight: 10 });
      if (profile.resumePath) score += 10; else suggestions.push({ field: 'resume', label: 'Resume Upload', weight: 10 });
      if (profile.preferredRole || profile.education || profile.experience) score += 10; else suggestions.push({ field: 'career', label: 'Career Preferences (Role/Education/Experience)', weight: 10 });
    } else {
      // Employer completion mapping
      if (profile.name) score += 15; else suggestions.push({ field: 'name', label: 'Contact Name', weight: 15 });
      if (profile.email) score += 15; else suggestions.push({ field: 'email', label: 'Work Email', weight: 15 });
      if (profile.phone) score += 15; else suggestions.push({ field: 'phone', label: 'Phone Number', weight: 15 });
      if (profile.companyName) score += 15; else suggestions.push({ field: 'companyName', label: 'Company Name', weight: 15 });
      if (profile.companyLogo) score += 10; else suggestions.push({ field: 'companyLogo', label: 'Company Logo Image', weight: 10 });
      if (profile.industry) score += 10; else suggestions.push({ field: 'industry', label: 'Industry Sector', weight: 10 });
      if (profile.companyDescription) score += 10; else suggestions.push({ field: 'companyDescription', label: 'Company Description', weight: 10 });
      if (profile.companyWebsite || profile.companyLocation) score += 10; else suggestions.push({ field: 'websiteLocation', label: 'Website & Headquarter Location', weight: 10 });
    }

    return { percentage: score, suggestions };
  };

  if (!user) return null;

  const { percentage, suggestions } = calculateCompletion();

  return (
    <div className="page-transition container" style={{ paddingTop: '40px', marginBottom: '80px' }}>
      
      {/* Title Header */}
      <section style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '6px' }}>Manage Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Update your contact details, career preferences, portfolio, and verify your account credentials.
        </p>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <h3>Loading profile configurations...</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
          
          {/* Main Form Fields */}
          <div>
            {message && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                padding: '12px 16px',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.95rem',
                marginBottom: '24px'
              }}>
                ✅ {message}
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ff6b6b',
                padding: '12px 16px',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.95rem',
                marginBottom: '24px'
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '36px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                👤 Personal Credentials
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={profile.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Immutable)</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={profile.email}
                    disabled
                    style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={profile.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    value={profile.location}
                    onChange={handleChange}
                    placeholder="e.g. Austin, TX or Remote"
                  />
                </div>
              </div>

              {/* Seeker Specific Fields */}
              {user.role === 'seeker' && (
                <div style={{ marginTop: '24px' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginTop: '20px' }}>
                    💼 Career & Profile Details
                  </h2>

                  <div className="form-group">
                    <label className="form-label">Skills (comma-separated list)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. React, Node.js, Express, JavaScript, CSS"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Education Qualification</label>
                      <select
                        name="education"
                        className="form-control"
                        value={profile.education}
                        onChange={handleChange}
                      >
                        <option value="">Select Education Level</option>
                        <option value="High School">High School</option>
                        <option value="Bachelor's">Bachelor's Degree</option>
                        <option value="Master's">Master's Degree</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Experience Level</label>
                      <select
                        name="experience"
                        className="form-control"
                        value={profile.experience}
                        onChange={handleChange}
                      >
                        <option value="">Select Experience Level</option>
                        <option value="entry">Entry Level (0-2 years)</option>
                        <option value="mid">Mid Level (2-5 years)</option>
                        <option value="senior">Senior Level (5+ years)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Preferred Job Title / Role</label>
                      <input
                        type="text"
                        name="preferredRole"
                        className="form-control"
                        value={profile.preferredRole}
                        onChange={handleChange}
                        placeholder="e.g. Frontend Engineer"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Preferred Location / Workplace</label>
                      <input
                        type="text"
                        name="preferredLocation"
                        className="form-control"
                        value={profile.preferredLocation}
                        onChange={handleChange}
                        placeholder="e.g. Remote or Austin, TX"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Employer Specific Fields */}
              {user.role === 'employer' && (
                <div style={{ marginTop: '24px' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginTop: '20px' }}>
                    🏢 Company Details
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        name="companyName"
                        className="form-control"
                        value={profile.companyName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Industry Sector</label>
                      <input
                        type="text"
                        name="industry"
                        className="form-control"
                        value={profile.industry}
                        onChange={handleChange}
                        placeholder="e.g. Tech, Healthcare, Finance"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Company Website URL</label>
                      <input
                        type="url"
                        name="companyWebsite"
                        className="form-control"
                        value={profile.companyWebsite}
                        onChange={handleChange}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Company Location (Headquarters)</label>
                      <input
                        type="text"
                        name="companyLocation"
                        className="form-control"
                        value={profile.companyLocation}
                        onChange={handleChange}
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label className="form-label">Company Description</label>
                    <textarea
                      name="companyDescription"
                      className="form-control"
                      rows="4"
                      value={profile.companyDescription}
                      onChange={handleChange}
                      placeholder="Write a brief overview of your company..."
                    ></textarea>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ width: '150px', height: '42px', marginTop: '24px' }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Right Sidebar: Avatar & Completion Meter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Avatar / Company Logo Card */}
            <aside className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
                {user.role === 'seeker' ? 'Avatar Picture' : 'Company Logo'}
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                {(user.role === 'seeker' ? profile.profilePicture : profile.companyLogo) ? (
                  <img
                    src={user.role === 'seeker' ? profile.profilePicture : profile.companyLogo}
                    alt="Profile Avatar"
                    style={{
                      width: '140px',
                      height: '140px',
                      borderRadius: user.role === 'seeker' ? '50%' : '12px',
                      objectFit: 'cover',
                      border: '3px solid var(--accent-secondary)',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: user.role === 'seeker' ? '50%' : '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '2px dashed var(--card-border)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '2.5rem'
                  }}>
                    {user.role === 'seeker' ? '👤' : '🏢'}
                  </div>
                )}
              </div>

              {/* Upload image form */}
              <form onSubmit={handleImageUpload} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  style={{ fontSize: '0.78rem', width: '100%', marginBottom: '10px', color: 'var(--text-secondary)' }}
                  required
                />
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="btn btn-secondary"
                  style={{ width: '100%', height: '32px', fontSize: '0.8rem' }}
                >
                  {uploadingImage ? 'Uploading...' : 'Update Image'}
                </button>
              </form>
            </aside>

            {/* Completion Meter Card */}
            <aside className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Profile Strength</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completion Meter</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: percentage === 100 ? 'var(--success)' : 'var(--accent-secondary)' }}>
                  {percentage}%
                </span>
              </div>
              
              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: percentage === 100 ? 'var(--success)' : 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease'
                }}></div>
              </div>

              {suggestions.length > 0 ? (
                <div>
                  <h4 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Missing Information
                  </h4>
                  <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {suggestions.map((item, index) => (
                      <li key={index}>
                        Add <strong>{item.label}</strong> <span style={{ color: 'var(--accent-secondary)' }}>(+{item.weight}%)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center',
                  color: '#34d399',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}>
                  🎉 Profile fully complete! Excellent work.
                </div>
              )}
            </aside>

            {/* Verification Badge Request Card (Employer only) */}
            {user.role === 'employer' && (
              <aside className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Company Verification</h3>
                
                {profile.verified ? (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#34d399',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}>
                    <span>✓</span> Verified Company Badge active on job postings.
                  </div>
                ) : profile.verificationRequested ? (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    borderRadius: '6px',
                    padding: '12px',
                    textAlign: 'center',
                    color: '#f59e0b',
                    fontSize: '0.88rem',
                    fontWeight: 600
                  }}>
                    🕒 Verification Pending review.
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '16px' }}>
                      Request a verified badge to show candidates your postings are authentic and improve your match rates.
                    </p>
                    <button
                      onClick={handleRequestVerification}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}
                    >
                      Request Verification
                    </button>
                  </div>
                )}
              </aside>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default Profile;
