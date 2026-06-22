import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';

function Dashboard() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [seekerTab, setSeekerTab] = useState('applications'); // 'applications' | 'saved' | 'interviews' | 'notifications' | 'recommended'
  const [employerTab, setEmployerTab] = useState('jobs'); // 'jobs' | 'applicants' | 'interviews' | 'notifications'

  // Seeker State
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePath, setResumePath] = useState(user?.resumePath || null);
  const [resumeName, setResumeName] = useState(user?.resumeName || null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [seekerProfile, setSeekerProfile] = useState(null);
  const [offersMap, setOffersMap] = useState({});

  // Employer State
  const [employerApps, setEmployerApps] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [schedulingAppId, setSchedulingAppId] = useState(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNote, setInterviewNote] = useState('');
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  
  // Employer Candidate Comparison State
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Employer Offer Letter Generation State
  const [generatingOfferApp, setGeneratingOfferApp] = useState(null);
  const [offerSalary, setOfferSalary] = useState('');
  const [offerStartDate, setOfferStartDate] = useState('');
  const [offerExpiryDate, setOfferExpiryDate] = useState('');
  const [offerTerms, setOfferTerms] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  // General Loading State
  const [loading, setLoading] = useState(true);

  // Helper: Calculate Smart Job Match Score
  const calculateMatchScore = (job, seeker) => {
    if (!seeker) return 0;
    let score = 0;
    
    // 1. Skills Match (40%)
    if (job.skills && job.skills.length > 0) {
      const seekerSkills = seeker.skills || [];
      const matchedSkills = job.skills.filter(s => 
        seekerSkills.some(ss => ss.toLowerCase() === s.toLowerCase())
      );
      const skillScore = matchedSkills.length / job.skills.length;
      score += skillScore * 40;
    } else {
      score += 40;
    }

    // 2. Preferred Role Match (25%)
    if (seeker.preferredRole) {
      const roleLower = seeker.preferredRole.toLowerCase();
      const titleLower = job.title.toLowerCase();
      const descLower = job.description.toLowerCase();
      if (titleLower.includes(roleLower) || descLower.includes(roleLower)) {
        score += 25;
      } else {
        const seekerWords = roleLower.split(/\s+/).filter(w => w.length > 2);
        const hasPartial = seekerWords.some(w => titleLower.includes(w));
        if (hasPartial) score += 15;
      }
    }

    // 3. Preferred Location Match (20%)
    if (seeker.preferredLocation) {
      const locLower = seeker.preferredLocation.toLowerCase();
      const jobLocLower = job.location.toLowerCase();
      
      const isRemoteSeeker = locLower.includes('remote') || locLower.includes('online');
      const isRemoteJob = job.workplaceType === 'online' || jobLocLower.includes('remote');
      
      if (isRemoteSeeker && isRemoteJob) {
        score += 20;
      } else if (jobLocLower.includes(locLower) || locLower.includes(jobLocLower)) {
        score += 20;
      } else {
        const locWords = locLower.split(/[\s,]+/).filter(w => w.length > 2);
        const hasPartial = locWords.some(w => jobLocLower.includes(w));
        if (hasPartial) score += 10;
      }
    } else {
      score += 10;
    }

    // 4. Education Match (15%)
    if (seeker.education) {
      const seekerEdu = seeker.education.toLowerCase();
      const jobEdu = (job.education || "Bachelor's").toLowerCase();
      const eduRank = { 'high school': 1, "bachelor's": 2, "master's": 3, 'phd': 4 };
      const seekerRank = eduRank[seekerEdu] || 0;
      const jobRank = eduRank[jobEdu] || 2;
      
      if (seekerRank >= jobRank) {
        score += 15;
      } else if (seekerRank + 1 === jobRank) {
        score += 8;
      }
    } else {
      score += 5;
    }

    return Math.round(score);
  };

  // Helper: Profile Completion Calculation
  const calculateCompletion = (profile) => {
    if (!profile) return { percentage: 0, suggestions: [] };
    let score = 0;
    const suggestions = [];

    if (profile.role === 'seeker') {
      if (profile.name) score += 15; else suggestions.push('Full Name (+15%)');
      if (profile.email) score += 15; else suggestions.push('Email Address (+15%)');
      if (profile.phone) score += 15; else suggestions.push('Phone Number (+15%)');
      if (profile.location) score += 10; else suggestions.push('Current Location (+10%)');
      if (profile.skills && profile.skills.length > 0) score += 15; else suggestions.push('Key Skills (+15%)');
      if (profile.profilePicture) score += 10; else suggestions.push('Profile Picture (+10%)');
      if (profile.resumePath) score += 10; else suggestions.push('Resume PDF/Word document (+10%)');
      if (profile.preferredRole || profile.education || profile.experience) score += 10; else suggestions.push('Career profile details (+10%)');
    } else {
      if (profile.name) score += 15; else suggestions.push('Contact Name (+15%)');
      if (profile.email) score += 15; else suggestions.push('Work Email (+15%)');
      if (profile.phone) score += 15; else suggestions.push('Phone Number (+15%)');
      if (profile.companyName) score += 15; else suggestions.push('Company Name (+15%)');
      if (profile.companyLogo) score += 10; else suggestions.push('Company Logo Image (+10%)');
      if (profile.industry) score += 10; else suggestions.push('Industry Sector (+10%)');
      if (profile.companyDescription) score += 10; else suggestions.push('Company Description (+10%)');
      if (profile.companyWebsite || profile.companyLocation) score += 10; else suggestions.push('Website & Headquarters (+10%)');
    }

    return { percentage: score, suggestions };
  };

  // Fetch seeker dashboard data
  const fetchSeekerData = async () => {
    try {
      setLoading(true);
      
      // Fetch applications
      const appRes = await fetch('/api/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let appData = [];
      if (appRes.ok) {
        appData = await appRes.json();
        setApplications(appData);
      }

      // Fetch interviews
      const intRes = await fetch('/api/interviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (intRes.ok) {
        const intData = await intRes.json();
        setInterviews(intData);
      }

      // Fetch saved jobs
      const savedRes = await fetch('/api/jobs/saved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (savedRes.ok) {
        const savedData = await savedRes.json();
        setSavedJobs(savedData);
      }

      // Fetch notifications
      const notifRes = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }

      // Fetch Profile for completion meter
      const profileRes = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let profileData = null;
      if (profileRes.ok) {
        profileData = await profileRes.json();
        setSeekerProfile(profileData);
      }

      // Fetch all jobs for smart recommended jobs calculation
      const jobsRes = await fetch('/api/jobs');
      if (jobsRes.ok && profileData) {
        const jobsData = await jobsRes.json();
        const enriched = jobsData.map(job => {
          const matchScore = calculateMatchScore(job, profileData);
          return { ...job, matchScore };
        })
        .filter(j => j.matchScore >= 40)
        .sort((a, b) => b.matchScore - a.matchScore);
        
        setRecommendedJobs(enriched);
      }

      // Fetch Offer Status for Accepted/Selected applications
      const acceptedApps = appData.filter(app => app.status === 'Accepted' || app.atsStatus === 'Accepted' || app.status === 'Selected' || app.atsStatus === 'Selected');
      const tempOffersMap = {};
      for (const app of acceptedApps) {
        try {
          const offerRes = await fetch(`/api/offers/application/${app.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (offerRes.ok) {
            const offerData = await offerRes.json();
            tempOffersMap[app.id] = offerData;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setOffersMap(tempOffersMap);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employer dashboard data
  const fetchEmployerData = async () => {
    try {
      setLoading(true);

      // Fetch jobs posted by employer
      const jobsRes = await fetch('/api/jobs');
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        const filteredJobs = jobsData.filter(j => j.employerId === user.id || (user.id === 'user-employer-1' && j.employerId === 'user-employer-1'));
        setMyJobs(filteredJobs);
      }

      // Fetch applications for employer's jobs
      const appsRes = await fetch('/api/applications/employer', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let appsData = [];
      if (appsRes.ok) {
        appsData = await appsRes.json();
        setEmployerApps(appsData);
      }

      // Fetch scheduled interviews
      const intRes = await fetch('/api/interviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (intRes.ok) {
        const intData = await intRes.json();
        setInterviews(intData);
      }

      // Fetch notifications
      const notifRes = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }

      // Fetch Profile for completion meter
      const profileRes = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setSeekerProfile(profileData);
      }

      // Fetch Offers for apps
      const tempOffersMap = {};
      for (const app of appsData) {
        try {
          const offerRes = await fetch(`/api/offers/application/${app.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (offerRes.ok) {
            const offerData = await offerRes.json();
            tempOffersMap[app.id] = offerData;
          }
        } catch (e) {}
      }
      setOffersMap(tempOffersMap);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user.role === 'seeker') {
      fetchSeekerData();
    } else if (user.role === 'employer') {
      fetchEmployerData();
    } else if (user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, isAuthenticated]);

  // Handle Resume Upload
  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      alert('Please choose a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      setUploadingResume(true);
      const res = await fetch('/api/profile/resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload resume.');
      }

      setResumePath(data.resumePath);
      setResumeName(data.resumeName);
      
      const savedUser = JSON.parse(localStorage.getItem('user'));
      savedUser.resumePath = data.resumePath;
      savedUser.resumeName = data.resumeName;
      localStorage.setItem('user', JSON.stringify(savedUser));

      alert('Resume uploaded successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingResume(false);
    }
  };

  // Handle ATS Status Update
  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      setStatusUpdatingId(appId);
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          note: statusUpdateNote || `Application marked as ${newStatus}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status.');
      }

      setEmployerApps(prev => prev.map(app => {
        if (app.id === appId) {
          return {
            ...app,
            status: data.application.status,
            statusHistory: data.application.statusHistory
          };
        }
        return app;
      }));

      setStatusUpdateNote('');
      setStatusUpdatingId(null);
      alert('Application status updated successfully!');
    } catch (err) {
      alert(err.message);
      setStatusUpdatingId(null);
    }
  };

  // Handle Interview Schedule Submit
  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!interviewDate) {
      alert('Please select a date and time.');
      return;
    }

    try {
      setSchedulingLoading(true);
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationId: schedulingAppId,
          dateTime: interviewDate,
          note: interviewNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule interview.');
      }

      alert('Interview scheduled successfully!');
      setSchedulingAppId(null);
      setInterviewDate('');
      setInterviewNote('');
      fetchEmployerData();
    } catch (err) {
      alert(err.message);
  }
};

  // Handle Offer Letter Submit
  const handleSendOfferSubmit = async (e) => {
    e.preventDefault();
    if (!offerSalary || !offerStartDate || !offerExpiryDate) {
      alert('Please fill in base salary, start date, and expiration date.');
      return;
    }

    try {
      setOfferLoading(true);
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationId: generatingOfferApp.id,
          jobId: generatingOfferApp.jobId,
          jobTitle: generatingOfferApp.jobTitle,
          company: generatingOfferApp.company,
          seekerId: generatingOfferApp.applicantId,
          salary: Number(offerSalary),
          startDate: offerStartDate,
          expiryDate: offerExpiryDate,
          additionalTerms: offerTerms
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send job offer.');

      alert('Offer letter generated and sent to seeker successfully!');
      setGeneratingOfferApp(null);
      setOfferSalary('');
      setOfferStartDate('');
      setOfferExpiryDate('');
      setOfferTerms('');
      fetchEmployerData();
    } catch (err) {
      alert(err.message);
    } finally {
      setOfferLoading(false);
    }
  };

  // Toggle candidate selection for comparison
  const handleToggleSelectCandidate = (appId) => {
    setSelectedAppIds(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  // Unsave a job
  const handleUnsaveJob = async (jobId) => {
    if (!window.confirm('Unsave this job listing?')) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}/unsave`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSavedJobs(prev => prev.filter(j => j.id !== jobId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to unsave job.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notifId) => {
    try {
      const res = await fetch(`/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => {
          if (n.id === notifId) return { ...n, isRead: true };
          return n;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <div className="page-transition container" style={{ paddingTop: '40px', marginBottom: '80px' }}>
      
      {/* Welcome Header */}
      <section style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '6px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>. Manage your career portfolio, saved jobs, and notifications.
        </p>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
          <h3>Loading dashboard workspace...</h3>
        </div>
      ) : user.role === 'seeker' ? (
        
        // ================= JOB SEEKER DASHBOARD VIEW =================
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Seeker Sidebar: Resume Upload Card */}
          <aside className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Resume Portfolio</h3>
            
            {resumePath ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '6px' }}>📄</span>
                <h4 style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 700, wordBreak: 'break-all' }}>
                  {resumeName || 'my_resume.pdf'}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Uploaded and active. Employers can review this document.
                </p>
                
                <a 
                  href={resumePath} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '12px', padding: '6px 0', fontSize: '0.82rem' }}
                >
                  Download / View
                </a>
              </div>
            ) : (
              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.4'
              }}>
                ⚠️ No resume file uploaded. Employers require a resume before reviewing application profiles.
              </div>
            )}

            {/* Resume Upload Form */}
            <form onSubmit={handleResumeUpload} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Upload New Resume</label>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files[0])}
                style={{ fontSize: '0.8rem', width: '100%', marginBottom: '12px', color: 'var(--text-secondary)' }}
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={uploadingResume}
                style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}
              >
                {uploadingResume ? 'Uploading...' : 'Upload Resume'}
              </button>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px', textAlign: 'center' }}>
                Supports PDF, DOC, DOCX up to 5MB.
              </span>
            </form>
          </aside>

          {/* Seeker Main Area: Tabbed Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Tabs Navigation Header */}
            <div className="admin-tabs" style={{ marginBottom: '10px' }}>
              <button 
                className={`admin-tab ${seekerTab === 'applications' ? 'active' : ''}`}
                onClick={() => setSeekerTab('applications')}
                style={{ background: 'none', border: 'none', font: 'inherit' }}
              >
                💼 Applications ({applications.length})
              </button>
              <button 
                className={`admin-tab ${seekerTab === 'saved' ? 'active' : ''}`}
                onClick={() => setSeekerTab('saved')}
                style={{ background: 'none', border: 'none', font: 'inherit' }}
              >
                ⭐ Saved Jobs ({savedJobs.length})
              </button>
              <button 
                className={`admin-tab ${seekerTab === 'interviews' ? 'active' : ''}`}
                onClick={() => setSeekerTab('interviews')}
                style={{ background: 'none', border: 'none', font: 'inherit' }}
              >
                📅 Interviews ({interviews.length})
              </button>
              <button 
                className={`admin-tab ${seekerTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setSeekerTab('notifications')}
                style={{ background: 'none', border: 'none', font: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🔔 Notifications 
                {unreadNotifCount > 0 && (
                  <span style={{
                    background: 'var(--danger)',
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}>
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>

            {/* TAB CONTENT: APPLICATIONS */}
            {seekerTab === 'applications' && (
              <section className="glass-card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Application History</h2>

                {applications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <span style={{ fontSize: '2.5rem' }}>🔍</span>
                    <h4 style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>No active applications</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
                      Browse the <Link to="/" style={{ color: 'var(--accent-secondary)' }}>job board</Link> to submit your profile.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {applications.map((app) => (
                      <article key={app.id} style={{
                        border: '1px solid var(--card-border)',
                        borderRadius: 'var(--border-radius-sm)',
                        padding: '20px',
                        background: 'rgba(255, 255, 255, 0.01)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                              <Link to={`/job/${app.jobId}`} style={{ color: 'var(--text-primary)' }}>{app.jobTitle}</Link>
                            </h3>
                            <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.92rem' }}>
                              {app.company}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '12px' }}>
                              📍 {app.location} | 💰 ${app.salary.toLocaleString()}/yr
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Applied on: {new Date(app.appliedDate || app.appliedAt).toLocaleDateString()}
                            </span>
                            <div style={{ marginTop: '4px' }}>
                              <span className="badge badge-online" style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.75rem' }}>
                                Status: {app.status || app.atsStatus}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Timeline Workflow */}
                        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '16px' }}>
                          <div className="status-tracker-flow">
                            {['Applied', 'Shortlisted', 'Interview', 'Selected'].map((step, idx) => {
                              const steps = ['Applied', 'Shortlisted', 'Interview', 'Selected'];
                              const currentStepIdx = steps.indexOf(app.status || app.atsStatus || 'Applied');
                              const stepIdx = steps.indexOf(step);

                              let stepClass = 'status-step';
                              if (stepIdx === currentStepIdx) stepClass += ' active';
                              else if (stepIdx < currentStepIdx) stepClass += ' completed';

                              return (
                                <div key={step} className={stepClass}>
                                  <div className="status-dot" style={{ width: '22px', height: '22px', fontSize: '0.68rem' }}>
                                    {stepIdx < currentStepIdx ? '✓' : idx + 1}
                                  </div>
                                  <div className="status-label" style={{ fontSize: '0.62rem', marginTop: '6px' }}>{step}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Status History Collapsible */}
                        {app.statusHistory && app.statusHistory.length > 0 && (
                          <details style={{ marginTop: '12px', fontSize: '0.8rem' }}>
                            <summary style={{ cursor: 'pointer', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                              View Status History Log ({app.statusHistory.length})
                            </summary>
                            <div style={{
                              marginTop: '10px',
                              background: 'rgba(0,0,0,0.2)',
                              borderRadius: '6px',
                              padding: '12px',
                              border: '1px solid var(--card-border)'
                            }}>
                              {app.statusHistory.map((h, i) => (
                                <div key={i} style={{ borderBottom: i < app.statusHistory.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', paddingBottom: '6px', marginBottom: '6px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    <strong>{h.status}</strong>
                                    <span>{new Date(h.changedAt).toLocaleString()}</span>
                                  </div>
                                  <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{h.note}</p>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* TAB CONTENT: SAVED JOBS */}
            {seekerTab === 'saved' && (
              <section className="glass-card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Saved Jobs Bookmarks</h2>

                {savedJobs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                    You haven't bookmarked any jobs yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {savedJobs.map((j) => (
                      <div key={j.id} className="glass-card" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                            <Link to={`/job/${j.id}`} style={{ color: 'var(--text-primary)' }}>{j.title}</Link>
                          </h3>
                          <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.88rem' }}>{j.company}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '12px' }}>📍 {j.location}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <Link to={`/job/${j.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            View Details
                          </Link>
                          <button 
                            onClick={() => handleUnsaveJob(j.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* TAB CONTENT: INTERVIEWS */}
            {seekerTab === 'interviews' && (
              <section className="glass-card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Upcoming Schedule</h2>

                {interviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No interviews scheduled currently.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {interviews.map((int) => (
                      <div key={int.id} className="glass-card" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)' }}>
                        <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>📅</span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{int.jobTitle}</h4>
                        <h5 style={{ color: 'var(--accent-secondary)', fontSize: '0.88rem', fontWeight: 600 }}>{int.company}</h5>
                        
                        <div style={{
                          marginTop: '12px',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                          background: 'var(--accent-primary-glow)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(124, 58, 237, 0.2)'
                        }}>
                          <strong>⏰ Time:</strong> {new Date(int.dateTime).toLocaleString()}
                        </div>
                        
                        {int.note && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '12px', fontStyle: 'italic' }}>
                            Instructions: {int.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* TAB CONTENT: NOTIFICATIONS */}
            {seekerTab === 'notifications' && (
              <section className="glass-card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Notifications Inbox</h2>

                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                    Your inbox is empty.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notifications.map((notif) => (
                      <div key={notif.id} style={{
                        padding: '16px',
                        background: notif.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(124,58,237,0.05)',
                        border: '1px solid var(--card-border)',
                        borderColor: notif.isRead ? 'var(--card-border)' : 'rgba(124,58,237,0.2)',
                        borderRadius: 'var(--border-radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1, paddingRight: '16px' }}>
                          <p style={{
                            fontSize: '0.92rem',
                            color: 'var(--text-primary)',
                            fontWeight: notif.isRead ? 'normal' : 'bold'
                          }}>
                            {notif.message}
                          </p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <button 
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

          </div>
        </div>
        
      ) : (
        
        // ================= EMPLOYER DASHBOARD VIEW =================
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tabs Navigation Header */}
          <div className="admin-tabs">
            <button 
              className={`admin-tab ${employerTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setEmployerTab('jobs')}
              style={{ background: 'none', border: 'none', font: 'inherit' }}
            >
              💼 My Job Postings ({myJobs.length})
            </button>
            <button 
              className={`admin-tab ${employerTab === 'applicants' ? 'active' : ''}`}
              onClick={() => setEmployerTab('applicants')}
              style={{ background: 'none', border: 'none', font: 'inherit' }}
            >
              👥 Candidate Applications ({employerApps.length})
            </button>
            <button 
              className={`admin-tab ${employerTab === 'interviews' ? 'active' : ''}`}
              onClick={() => setEmployerTab('interviews')}
              style={{ background: 'none', border: 'none', font: 'inherit' }}
            >
              📅 Scheduled Interviews ({interviews.length})
            </button>
            <button 
              className={`admin-tab ${employerTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setEmployerTab('notifications')}
              style={{ background: 'none', border: 'none', font: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🔔 Notifications 
              {unreadNotifCount > 0 && (
                <span style={{
                  background: 'var(--danger)',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {unreadNotifCount}
                </span>
              )}
            </button>
          </div>

          {/* TAB CONTENT: MY JOBS */}
          {employerTab === 'jobs' && (
            <section className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Job Postings</h2>
                <Link to="/post-job" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                  + Post Job
                </Link>
              </div>

              {myJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                  You haven't posted any job openings yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {myJobs.map((j) => (
                    <div key={j.id} className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.01)' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        <Link to={`/job/${j.id}`} style={{ color: 'var(--text-primary)' }}>{j.title}</Link>
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                        📍 {j.location} | 💰 ${j.salary.toLocaleString()}/yr
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <span className="badge badge-full-time">{j.jobType || j.duration}</span>
                        <span className="badge badge-online">{j.workplaceType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB CONTENT: APPLICATIONS RECEIVED */}
          {employerTab === 'applicants' && (
            <section className="glass-card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Candidate Applications</h2>

              {employerApps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  No job applications received yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job Position</th>
                        <th>Applied Date</th>
                        <th>Resume</th>
                        <th>Current Status</th>
                        <th>ATS Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employerApps.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{app.applicantName}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{app.email}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{app.jobTitle}</div>
                          </td>
                          <td>{new Date(app.appliedDate || app.appliedAt).toLocaleDateString()}</td>
                          <td>
                            {app.resumePath ? (
                              <a 
                                href={app.resumePath} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.85rem' }}
                              >
                                📥 View Resume
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No Resume</span>
                            )}
                          </td>
                          <td>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: (app.status || app.atsStatus) === 'Selected' ? 'rgba(16,185,129,0.1)' : (app.status || app.atsStatus) === 'Interview' ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.05)',
                              color: (app.status || app.atsStatus) === 'Selected' ? '#34d399' : (app.status || app.atsStatus) === 'Interview' ? '#a78bfa' : 'var(--text-secondary)'
                            }}>
                              {app.status || app.atsStatus || 'Applied'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <select
                                value={app.status || app.atsStatus || 'Applied'}
                                onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                                className="form-control"
                                style={{ width: '130px', height: '32px', padding: '0 8px', fontSize: '0.8rem' }}
                              >
                                <option value="Applied">Applied</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Interview">Interview</option>
                                <option value="Selected">Selected</option>
                              </select>
                              
                              <button
                                onClick={() => setSchedulingAppId(app.id)}
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.78rem', height: '32px' }}
                              >
                                📅 Schedule
                              </button>
                              
                              {app.applicantId && (
                                <Link
                                  to={`/chat?partnerId=${app.applicantId}`}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.78rem', height: '32px', display: 'inline-flex', alignItems: 'center' }}
                                >
                                  💬 Chat
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Scheduling Modal Overlay */}
          {schedulingAppId && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <form onSubmit={handleScheduleInterview} className="glass-card" style={{ padding: '30px', width: '90%', maxWidth: '450px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>📅 Schedule Interview</h3>
                
                <div className="form-group">
                  <label className="form-label">Date &amp; Time</label>
                  <input 
                    type="datetime-local" 
                    className="form-control"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Meeting Instructions / Location Note</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    placeholder="e.g. Join the Zoom link: zoom.us/j/123456 or Office Address."
                    value={interviewNote}
                    onChange={(e) => setInterviewNote(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => { setSchedulingAppId(null); setInterviewDate(''); setInterviewNote(''); }}
                    className="btn btn-secondary"
                    style={{ height: '38px', padding: '0 16px' }}
                    disabled={schedulingLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ height: '38px', padding: '0 20px' }}
                    disabled={schedulingLoading}
                  >
                    {schedulingLoading ? 'Scheduling...' : 'Invite Candidate'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB CONTENT: SCHEDULED INTERVIEWS */}
          {employerTab === 'interviews' && (
            <section className="glass-card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Scheduled Interviews</h2>

              {interviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No upcoming interviews scheduled.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Candidate Name</th>
                        <th>Job Position</th>
                        <th>Scheduled Date &amp; Time</th>
                        <th>Notes / Invites</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((int) => (
                        <tr key={int.id}>
                          <td><strong>{int.seekerName}</strong></td>
                          <td>{int.jobTitle}</td>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              background: 'var(--accent-primary-glow)',
                              color: '#a78bfa',
                              fontWeight: 700,
                              borderRadius: '4px',
                              fontSize: '0.82rem'
                            }}>
                              {new Date(int.dateTime).toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              {int.note || 'None'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TAB CONTENT: NOTIFICATIONS */}
          {employerTab === 'notifications' && (
            <section className="glass-card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Notifications Inbox</h2>

              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                  Your inbox is empty.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {notifications.map((notif) => (
                    <div key={notif.id} style={{
                      padding: '16px',
                      background: notif.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(124,58,237,0.05)',
                      border: '1px solid var(--card-border)',
                      borderColor: notif.isRead ? 'var(--card-border)' : 'rgba(124,58,237,0.2)',
                      borderRadius: 'var(--border-radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                        <p style={{
                          fontSize: '0.92rem',
                          color: 'var(--text-primary)',
                          fontWeight: notif.isRead ? 'normal' : 'bold'
                        }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      )}
    </div>
  );
}

export default Dashboard;

