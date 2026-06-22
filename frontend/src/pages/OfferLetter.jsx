import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

function OfferLetter() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/offers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Offer not found.');
      setOffer(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOffer();
    }
  }, [id, token]);

  const handleDecision = async (decision) => {
    if (!window.confirm(`Are you sure you want to ${decision.toLowerCase()} this job offer?`)) {
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/offers/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: decision })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update offer status.');

      setOffer(data.offer);
      alert(`Job offer has been ${decision.toLowerCase()} successfully.`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/offers/download/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to download PDF.');
      }
      
      // Trigger native download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${offer.company.replace(/\s+/g, '_')}_Offer_Letter.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h3>Loading formal offer letter...</h3>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="container" style={{ paddingTop: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h3>Error Accessing Offer Letter</h3>
        <p style={{ color: '#ff6b6b', margin: '12px 0' }}>{error || 'Offer letter record could not be retrieved.'}</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isExpired = new Date(offer.expiryDate) < new Date() && offer.status === 'Sent';

  return (
    <div className="page-transition container" style={{ paddingTop: '40px', marginBottom: '80px', maxWidth: '800px' }}>
      
      <section style={{ marginBottom: '24px' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
          ← Back to Dashboard
        </button>
      </section>

      {/* Offer Letter Details Display */}
      <div className="glass-card" style={{ padding: '40px', boxShadow: 'var(--shadow-premium), var(--shadow-glow)' }}>
        
        {/* Header Ribbon */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: '20px',
          marginBottom: '30px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Formal Job Offer</h1>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              From: <strong style={{ color: 'var(--text-primary)' }}>{offer.company}</strong>
            </span>
          </div>
          <div>
            <span className="badge" style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '20px',
              background: offer.status === 'Accepted' ? 'rgba(16,185,129,0.1)' : offer.status === 'Declined' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              color: offer.status === 'Accepted' ? '#34d399' : offer.status === 'Declined' ? '#ff6b6b' : '#fbbf24'
            }}>
              Offer {offer.status}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid var(--card-border)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '30px'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Position</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{offer.jobTitle}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Compensation</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>${offer.salary.toLocaleString()}/yr</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Start Date</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{new Date(offer.startDate).toLocaleDateString()}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Expiry Date</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{new Date(offer.expiryDate).toLocaleDateString()}</strong>
          </div>
        </div>

        {/* Additional Terms */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Additional Terms & Notes</h3>
          <div style={{
            background: 'rgba(0,0,0,0.15)',
            border: '1px solid var(--card-border)',
            borderRadius: '6px',
            padding: '20px',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-line',
            fontStyle: 'italic'
          }}>
            {offer.additionalTerms || 'No custom terms or conditions specified.'}
          </div>
        </div>

        {/* Action Button Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '30px',
          marginTop: '30px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Download Action */}
          <button
            onClick={handleDownload}
            className="btn btn-secondary"
            style={{
              padding: '10px 24px',
              fontSize: '0.92rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📄 Download Offer Letter PDF
          </button>

          {/* Decision Actions (Seekers only, when status is Sent or Viewed) */}
          {user.role === 'seeker' && (offer.status === 'Sent' || offer.status === 'Viewed') && !isExpired && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleDecision('Declined')}
                disabled={submitting}
                className="btn btn-danger"
                style={{ padding: '10px 24px', fontSize: '0.92rem' }}
              >
                Decline Offer
              </button>
              <button
                onClick={() => handleDecision('Accepted')}
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.92rem' }}
              >
                Accept Offer
              </button>
            </div>
          )}

          {isExpired && (
            <div style={{ color: '#ff6b6b', fontWeight: 600, fontSize: '0.9rem' }}>
              ⚠️ This offer expired on {new Date(offer.expiryDate).toLocaleDateString()}.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default OfferLetter;
