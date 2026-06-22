import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../App';

function CompanyProfile() {
  const { id } = useParams();
  const { user, token, isAuthenticated } = useAuth();

  // States
  const [company, setCompany] = useState(null);
  const [reviewsData, setReviewsData] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState(null);

  // Fetch company profile details
  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      // Fetch details of this user (which is the employer)
      const res = await fetch(`/api/users/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!res.ok) throw new Error('Company not found.');
      const companyUser = await res.json();
      
      // Fetch detailed company profile settings from user collection
      // Since users endpoint returns name/email/role, we'll fetch profile endpoint directly if it is the current user,
      // or we can fetch reviews. To get company info like website, logo, description, we'll implement a public endpoint or fetch it.
      // Wait, let's look at how we fetch details. To let seekers view company profile, we need a public endpoint
      // `GET /api/companies/:id` or let seekers read company details.
      // Wait! Let's check: did we implement a `GET /api/companies/:id`? No, we had `GET /api/users/:id` which returns:
      // `{ id, name, email, role, verified }`.
      // Let's check: does it also need to return company website/description/etc. for employers?
      // Yes! Let's verify our `GET /api/users/:id` in server.js. Lines 979-998 of server.js:
      // We can modify it to also return: `companyName`, `companyLogo`, `industry`, `companyDescription`, `companyWebsite`, `companyLocation`.
      // That is extremely easy! Let's modify `GET /api/users/:id` to include company details so that seekers can see it!
      // First, let's write `CompanyProfile.jsx` assuming those details are returned from `GET /api/users/:id`.
      
      setCompany(companyUser);

      // Fetch reviews
      const revRes = await fetch(`/api/companies/${id}/reviews`);
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviewsData(revData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    try {
      setSubmittingReview(true);
      setReviewError(null);

      const res = await fetch(`/api/companies/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, reviewText })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review.');

      // Refresh reviews list
      const revRes = await fetch(`/api/companies/${id}/reviews`);
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviewsData(revData);
      }

      setReviewText('');
      setRating(5);
      alert('Review posted successfully!');
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h3>Loading company portfolio details...</h3>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container" style={{ paddingTop: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h3>Company Portfolio Not Found</h3>
        <p><Link to="/" style={{ color: 'var(--accent-secondary)' }}>Return Home</Link></p>
      </div>
    );
  }

  return (
    <div className="page-transition container" style={{ paddingTop: '40px', marginBottom: '80px' }}>
      
      {/* Company Header Block */}
      <div className="glass-card" style={{
        padding: '40px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {company.companyLogo ? (
            <img
              src={company.companyLogo}
              alt="Logo"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid var(--accent-secondary)'
              }}
            />
          ) : (
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '2px dashed var(--card-border)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '2rem'
            }}>
              🏢
            </div>
          )}
          
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              {company.companyName || company.name}
              {company.verified && (
                <span className="verified-badge" title="Verified Employer">
                  ✓ Verified
                </span>
              )}
            </h1>
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-secondary)', fontWeight: 600, marginTop: '4px' }}>
              {company.industry || 'Tech / Engineering'} Industry
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
              📍 {company.companyLocation || company.location || 'Remote'} | 🌐 <a href={company.companyWebsite || '#'} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', textDecoration: 'none' }}>{company.companyWebsite ? 'Visit Website' : 'No URL provided'}</a>
            </p>
          </div>
        </div>

        {/* Rating Display */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-secondary)' }}>
            {reviewsData.averageRating ? reviewsData.averageRating.toFixed(1) : '0.0'}
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
            ⭐ ({reviewsData.totalReviews} Reviews)
          </div>
        </div>
      </div>

      {/* Grid Layout: Description & Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px', alignItems: 'start' }}>
        
        {/* Description & Reviews List */}
        <div>
          {/* Company Description */}
          <section className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Company Description</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
              {company.companyDescription || 'No detailed company description provided.'}
            </p>
          </section>

          {/* Reviews List */}
          <section className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>
              Candidate Reviews ({reviewsData.totalReviews})
            </h2>

            {reviewsData.reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                No reviews yet. Be the first to review this company.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reviewsData.reviews.map((r) => (
                  <article key={r.id || r._id} style={{
                    borderBottom: '1px solid var(--card-border)',
                    paddingBottom: '16px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{r.seekerName}</strong>
                      <span style={{ color: 'var(--accent-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', lineHeight: '1.5' }}>
                      {r.reviewText}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Posted on: {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Submit Review Card */}
        <div>
          {isAuthenticated && user?.role === 'seeker' ? (
            <aside className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Leave a Review</h3>
              
              {reviewError && (
                <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '12px' }}>
                  ⚠️ {reviewError}
                </div>
              )}

              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label className="form-label">Company Rating</label>
                  <select
                    className="form-control"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    style={{ height: '36px', padding: '0 8px' }}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3">⭐⭐⭐ (3 Stars)</option>
                    <option value="2">⭐⭐ (2 Stars)</option>
                    <option value="1">⭐ (1 Star)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Review Details</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Describe your recruitment experience or company culture..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn btn-primary"
                  style={{ width: '100%', height: '36px' }}
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            </aside>
          ) : (
            <aside className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <h4>Write a Review</h4>
              <p style={{ fontSize: '0.82rem', marginTop: '6px', lineHeight: '1.4' }}>
                Only logged-in job seekers can rate and review company profiles.
              </p>
            </aside>
          )}
        </div>

      </div>

    </div>
  );
}

export default CompanyProfile;
