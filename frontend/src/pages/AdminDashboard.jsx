import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

function AdminDashboard() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Navigation Guard (Enforce Admin Role)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // States
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSeekers: 0,
    totalEmployers: 0,
    totalJobs: 0,
    totalApplications: 0,
    totalVerifiedCompanies: 0
  });
  const [usersList, setUsersList] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'jobs' | 'companies'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Stats & Table Data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch admin stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch users
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }

      // Fetch jobs
      const jobsRes = await fetch('/api/admin/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobsList(jobsData);
      }

    } catch (err) {
      console.error('Error loading admin details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  // Handle User Suspension Toggle
  const handleToggleSuspend = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    
    if (!window.confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'SUSPEND' : 'REACTIVATE'} this user?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update user status.');
      }

      // Update state locally
      setUsersList(prev => prev.map(u => {
        if (u.id === userId) return { ...u, status: newStatus };
        return u;
      }));

      alert(`User account has been ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}.`);
      fetchData(); // refresh stats
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('WARNING: Deleting this user will permanently remove their profile, posted jobs, and application records. Proceed?')) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete user.');
      }

      setUsersList(prev => prev.filter(u => u.id !== userId));
      alert('User and all associated data deleted successfully.');
      fetchData(); // refresh stats
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Company Verification Badge Toggle
  const handleToggleVerifyCompany = async (companyId, currentVerifiedState) => {
    const nextState = !currentVerifiedState;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/companies/${companyId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verified: nextState })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to toggle company verification.');
      }

      setUsersList(prev => prev.map(u => {
        if (u.id === companyId) return { ...u, verified: nextState };
        return u;
      }));

      alert(`Company verification status has been updated to: ${nextState ? 'VERIFIED' : 'UNVERIFIED'}.`);
      fetchData(); // refresh stats
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Administrative Job Deletion
  const handleDeleteJobAdmin = async (jobId) => {
    if (!window.confirm('Are you sure you want to remove this job posting from the platform?')) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove job listing.');
      }

      setJobsList(prev => prev.filter(j => j.id !== jobId));
      alert('Job listing and its application files removed successfully.');
      fetchData(); // refresh stats
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="page-transition container" style={{ paddingTop: '40px', marginBottom: '80px' }}>
      
      {/* Admin Title Section */}
      <section style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '6px' }}>🛡️ Administrative Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage user credentials, moderate posted jobs, verify employer companies, and review overall site statistics.
        </p>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <h3>Loading platform dashboard analytics...</h3>
        </div>
      ) : (
        <div>
          
          {/* Statistics Grid */}
          <div className="admin-stats-grid">
            
            <div className="glass-card admin-stat-card" style={{ background: 'rgba(124, 58, 237, 0.05)' }}>
              <span style={{ fontSize: '1.75rem' }}>👥</span>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginTop: '8px', textTransform: 'uppercase' }}>
                Total Seekers
              </div>
              <div className="admin-stat-val">{stats.totalSeekers}</div>
            </div>

            <div className="glass-card admin-stat-card" style={{ background: 'rgba(6, 182, 212, 0.05)' }}>
              <span style={{ fontSize: '1.75rem' }}>💼</span>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginTop: '8px', textTransform: 'uppercase' }}>
                Total Employers
              </div>
              <div className="admin-stat-val" style={{ color: 'var(--accent-primary)' }}>{stats.totalEmployers}</div>
            </div>

            <div className="glass-card admin-stat-card" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
              <span style={{ fontSize: '1.75rem' }}>📁</span>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginTop: '8px', textTransform: 'uppercase' }}>
                Active Jobs
              </div>
              <div className="admin-stat-val" style={{ color: 'var(--success)' }}>{stats.totalJobs}</div>
            </div>

            <div className="glass-card admin-stat-card" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
              <span style={{ fontSize: '1.75rem' }}>📩</span>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginTop: '8px', textTransform: 'uppercase' }}>
                Applications
              </div>
              <div className="admin-stat-val" style={{ color: 'var(--warning)' }}>{stats.totalApplications}</div>
            </div>

            <div className="glass-card admin-stat-card" style={{ background: 'rgba(6, 182, 212, 0.05)' }}>
              <span style={{ fontSize: '1.75rem' }}>✅</span>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginTop: '8px', textTransform: 'uppercase' }}>
                Verified Companies
              </div>
              <div className="admin-stat-val">{stats.totalVerifiedCompanies}</div>
            </div>

          </div>

          {/* Navigation Tabs */}
          <div className="admin-tabs">
            <button 
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
              style={{ background: 'none', border: 'none', font: 'inherit' }}
            >
              👥 User Accounts ({usersList.length})
            </button>
            <button 
              className={`admin-tab ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
              style={{ background: 'none', border: 'none', font: 'inherit' }}
            >
              📁 Active Job Postings ({jobsList.length})
            </button>
            <button 
              className={`admin-tab ${activeTab === 'companies' ? 'active' : ''}`}
              onClick={() => setActiveTab('companies')}
              style={{ background: 'none', border: 'none', font: 'inherit' }}
            >
              🏢 Verified Companies ({stats.totalVerifiedCompanies})
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="glass-card fade-in" style={{ padding: '30px' }}>
            
            {activeTab === 'users' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>User Account Moderation</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Account Name</th>
                        <th>Email / Username</th>
                        <th>Account Role</th>
                        <th>Active Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u.id}>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td>
                            <span className="badge" style={{
                              background: u.role === 'admin' ? 'rgba(245,158,11,0.1)' : u.role === 'employer' ? 'var(--accent-primary-glow)' : 'rgba(255,255,255,0.05)',
                              color: u.role === 'admin' ? '#fbbf24' : u.role === 'employer' ? '#a78bfa' : 'var(--text-secondary)',
                              fontWeight: 700,
                              fontSize: '0.72rem'
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              color: u.status === 'suspended' ? 'var(--danger)' : 'var(--success)',
                              fontWeight: 'bold',
                              fontSize: '0.9rem'
                            }}>
                              {u.status === 'suspended' ? 'Suspended 🚫' : 'Active ✅'}
                            </span>
                          </td>
                          <td>
                            {u.role !== 'admin' ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleToggleSuspend(u.id, u.status)}
                                  disabled={actionLoading}
                                  className={u.status === 'suspended' ? "btn btn-secondary" : "btn btn-danger"}
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={actionLoading}
                                  className="btn btn-danger"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239,68,68,0.2)' }}
                                >
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Protected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Job Postings Moderation</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Location</th>
                        <th>Compensation</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobsList.map((job) => (
                        <tr key={job.id}>
                          <td><strong>{job.title}</strong></td>
                          <td>{job.company}</td>
                          <td>{job.location}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 600 }}>${job.salary.toLocaleString()}/yr</td>
                          <td>
                            <button
                              onClick={() => handleDeleteJobAdmin(job.id)}
                              disabled={actionLoading}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              Delete Job
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'companies' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Company Verification Management</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Company Name</th>
                        <th>Primary Email</th>
                        <th>Verification Status</th>
                        <th>Verify Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.filter(u => u.role === 'employer').map((company) => (
                        <tr key={company.id}>
                          <td>
                            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {company.name}
                              {company.verified && (
                                <span className="verified-badge">✓ Verified</span>
                              )}
                            </strong>
                          </td>
                          <td>{company.email}</td>
                          <td>
                            <span style={{
                              color: company.verified ? 'var(--accent-secondary)' : 'var(--text-muted)',
                              fontWeight: 'bold',
                              fontSize: '0.9rem'
                            }}>
                              {company.verified ? 'Badge Awarded' : 'Unverified'}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleVerifyCompany(company.id, company.verified)}
                              disabled={actionLoading}
                              className="btn btn-secondary"
                              style={{ 
                                padding: '6px 14px', 
                                fontSize: '0.8rem',
                                borderColor: company.verified ? 'var(--danger)' : 'var(--accent-secondary)',
                                color: company.verified ? '#ff6b6b' : 'var(--accent-secondary)',
                                background: 'transparent'
                              }}
                            >
                              {company.verified ? 'Revoke Badge' : 'Verify Company'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
