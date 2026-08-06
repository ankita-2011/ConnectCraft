import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConnectionModal from '../../components/shared/ConnectionModal';
import { getInitials } from '../../utils/avatar';
import { 
  FiUsers, 
  FiUserMinus, 
  FiClock, 
  FiCheck, 
  FiX, 
  FiCompass, 
  FiUserPlus,
  FiMapPin,
  FiMessageSquare
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/connections.css';
import '../../styles/user/discover.css';
import '../../styles/user/auth.css';

const Connections = () => {
  const [activeTab, setActiveTab] = useState('my-connections');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Modal control states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState({ id: '', name: '' });

  // Load active tab data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'my-connections') {
        const response = await api.get('/connections');
        if (response.data?.status === 'success') {
          setConnections(response.data.connections || []);
        }
      } else if (activeTab === 'pending-requests') {
        const response = await api.get('/connections/pending');
        if (response.data?.status === 'success') {
          setPendingRequests(response.data.requests || []);
        }
      } else if (activeTab === 'sent-requests') {
        const response = await api.get('/connections/sent');
        if (response.data?.status === 'success') {
          setSentRequests(response.data.requests || []);
        }
      } else if (activeTab === 'suggestions') {
        const response = await api.get('/connections/suggestions');
        if (response.data?.status === 'success') {
          const rawSuggestions = response.data.suggestions || [];
          const validSuggestions = rawSuggestions.filter((p) => {
            const role = p?.userId?.role;
            const status = p?.userId?.accountStatus;
            const isAdmin = role && ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(role);
            const isInactive = status && status !== 'active';
            return !isAdmin && !isInactive;
          });
          setSuggestions(validSuggestions);
        }
      }
    } catch  {
      setError('Could not retrieve connections data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Request actions
  const handleAccept = async (reqId) => {
    try {
      const response = await api.post(`/connections/accept/${reqId}`);
      if (response.data?.status === 'success') {
        toast.success('Connection request accepted!');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Error accepting connection request.');
    }
  };

  const handleReject = async (reqId) => {
    try {
      const response = await api.post(`/connections/reject/${reqId}`);
      if (response.data?.status === 'success') {
        toast.info('Connection request declined.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Error rejecting connection request.');
    }
  };

  const handleCancel = async (reqId) => {
    try {
      const response = await api.post(`/connections/cancel/${reqId}`);
      if (response.data?.status === 'success') {
        toast.info('Connection request cancelled.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Error cancelling connection request.');
    }
  };

  const handleRemove = async (connId) => {
    const confirmDelete = window.confirm('Are you sure you want to remove this connection?');
    if (!confirmDelete) return;

    try {
      const response = await api.delete(`/connections/${connId}`);
      if (response.data?.status === 'success') {
        toast.info('Connection removed.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Error removing connection.');
    }
  };

  const triggerConnectModal = (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    setModalOpen(true);
  };

  const renderRecommendationSummary = (summary, profileInterests = []) => {
    const { canTeachYou = [], youCanTeach = [], sharedInterests = [], sharedCommunities = [] } = summary || {};
    
    // Determine interests to highlight: Matched interests take priority, fallback to profile interests
    const interestsToShow = sharedInterests.length > 0 ? sharedInterests : (profileInterests || []).slice(0, 3);
    const isMatched = sharedInterests.length > 0;

    const hasReason = 
      canTeachYou.length > 0 || 
      youCanTeach.length > 0 || 
      interestsToShow.length > 0 || 
      sharedCommunities.length > 0;

    if (!hasReason) return null;

    return (
      <div className="recom-box" style={{ marginTop: '0.75rem', marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        {canTeachYou.length > 0 && (
          <div style={{ marginBottom: '0.4rem' }}>
            <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.3rem' }}>Can Teach You</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {canTeachYou.map(s => <span key={s} style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.2rem 0.55rem', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>)}
            </div>
          </div>
        )}

        {youCanTeach.length > 0 && (
          <div style={{ marginBottom: '0.4rem' }}>
            <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.3rem' }}>You Can Teach Them</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {youCanTeach.map(s => <span key={s} style={{ background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1', padding: '0.2rem 0.55rem', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>)}
            </div>
          </div>
        )}

        {interestsToShow.length > 0 && (
          <div style={{ marginBottom: '0.4rem' }}>
            <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: isMatched ? '#B45309' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.3rem' }}>
              {isMatched ? '⚡ Matched Interests' : '💡 Key Interests'}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {interestsToShow.map(i => (
                <span 
                  key={i} 
                  style={{ 
                    background: isMatched ? '#FFFBEB' : '#F1F5F9', 
                    color: isMatched ? '#B45309' : '#475569', 
                    border: isMatched ? '1px solid #FDE68A' : '1px solid #CBD5E1', 
                    padding: '0.2rem 0.55rem', 
                    borderRadius: '16px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600 
                  }}
                >
                  {isMatched ? `✓ ${i}` : i}
                </span>
              ))}
            </div>
          </div>
        )}

        {sharedCommunities.length > 0 && (
          <div>
            <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.3rem' }}>Shared Communities</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {sharedCommunities.map(c => <span key={c} style={{ background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', padding: '0.2rem 0.55rem', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>{c}</span>)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header section */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', borderLeft: '4px solid var(--color-primary)' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Connections Workspace</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Connect with peer developers to swap teach/learn skills and learn together.
        </p>
      </div>

      {/* Tabs list */}
      <div className="detail-tabs-bar">
        <button className={`detail-tab-btn ${activeTab === 'my-connections' ? 'active' : ''}`} onClick={() => setActiveTab('my-connections')}>My Connections ({connections.length})</button>
        <button className={`detail-tab-btn ${activeTab === 'pending-requests' ? 'active' : ''}`} onClick={() => setActiveTab('pending-requests')}>Pending Requests ({pendingRequests.length})</button>
        <button className={`detail-tab-btn ${activeTab === 'sent-requests' ? 'active' : ''}`} onClick={() => setActiveTab('sent-requests')}>Sent Requests ({sentRequests.length})</button>
        <button className={`detail-tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveTab('suggestions')}>Suggestions</button>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      {/* TAB PANELS CONTENTS */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : (
        <div style={{ marginTop: '0.5rem' }}>
          
          {/* Active Connections */}
          {activeTab === 'my-connections' && (
            connections.length === 0 ? (
              <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
                <FiUsers style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>No Connections Yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Start matching with peers to swap tech/art skills.</p>
                <button className="btn-primary" onClick={() => setActiveTab('suggestions')} style={{ padding: '0.6rem 1.25rem', marginTop: '1.5rem', fontSize: '0.85rem' }}>Explore Suggestions</button>
              </div>
            ) : (
              <div className="results-grid">
                {connections.map((profile) => {
                  const name = profile.userId?.name || 'Peer Developer';
                  const initials = getInitials(name);
                  
                  return (
                    <div key={profile._id} className="hero-feature-card glass" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem 1.5rem', position: 'relative' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.35rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                          {profile.profilePhoto ? (
                            <img src={profile.profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            initials
                          )}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>@{profile.username}</span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', minHeight: '36px', marginBottom: '1rem' }}>
                        {profile.headline || 'ConnectCraft Explorer'}
                      </p>

                      {profile.location && (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                          <FiMapPin /> {profile.location}
                        </span>
                      )}

                      {/* Action buttons: Message, View Profile, Remove */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                        <Link 
                          to={`/messages?userId=${profile.userId?._id || profile.userId}&username=${profile.username}`} 
                          className="btn-primary" 
                          style={{ flex: 2, textAlign: 'center', padding: '0.55rem 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                        >
                          <FiMessageSquare /> Message
                        </Link>
                        <Link 
                          to={`/profile/${profile.username}`} 
                          className="btn-secondary" 
                          style={{ flex: 2, textAlign: 'center', padding: '0.55rem 0', fontSize: '0.8rem' }}
                        >
                          Profile
                        </Link>
                        <button 
                          onClick={() => handleRemove(profile.connectionId)} 
                          className="btn-secondary" 
                          style={{ flex: 1, color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '0.55rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                          title="Remove connection"
                        >
                          <FiUserMinus />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Pending Received Requests */}
          {activeTab === 'pending-requests' && (
            pendingRequests.length === 0 ? (
              <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
                <FiClock style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>No Pending Requests</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>You have review-cleared all connection requests.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                {pendingRequests.map((req) => {
                  const name = req.sender?.name || 'Explorer';
                  const initials = getInitials(name);
                  const profilePhoto = req.senderProfile?.profilePhoto;
                  const headline = req.senderProfile?.headline;

                  return (
                    <div key={req._id} className="request-review-card glass">
                      
                      {/* Header Sender Metadata */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                          {profilePhoto ? (
                            <img src={profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            initials
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{name}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{headline || 'ConnectCraft member'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button onClick={() => handleAccept(req._id)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FiCheck /> Accept
                          </button>
                          <button onClick={() => handleReject(req._id)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FiX /> Reject
                          </button>
                        </div>
                      </div>

                      {/* Sender Optional Message */}
                      {req.message && (
                        <div className="request-message-box">
                          "{req.message}"
                        </div>
                      )}

                      {/* Match explanation reasons */}
                      {renderRecommendationSummary(req.recommendationSummary)}

                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Sent Requests */}
          {activeTab === 'sent-requests' && (
            sentRequests.length === 0 ? (
              <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
                <FiClock style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>No Sent Requests</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>You have no active sent connection requests.</p>
                <button className="btn-primary" onClick={() => setActiveTab('suggestions')} style={{ padding: '0.6rem 1.25rem', marginTop: '1.5rem', fontSize: '0.85rem' }}>Find Partners</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                {sentRequests.map((req) => {
                  const name = req.receiver?.name || 'Explorer';
                  const initials = getInitials(name);
                  const profilePhoto = req.receiverProfile?.profilePhoto;
                  const headline = req.receiverProfile?.headline;

                  return (
                    <div key={req._id} className="request-review-card glass">
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                          {profilePhoto ? (
                            <img src={profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            initials
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{name}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{headline || 'ConnectCraft member'}</p>
                        </div>
                        <button onClick={() => handleCancel(req._id)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          Cancel Request
                        </button>
                      </div>

                      {req.message && (
                        <div className="request-message-box">
                          "{req.message}"
                        </div>
                      )}

                      {renderRecommendationSummary(req.recommendationSummary)}

                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Suggestions list */}
          {activeTab === 'suggestions' && (
            suggestions.length === 0 ? (
              <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
                <FiCompass style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>No Suggestions Available</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Update your skills to learn/teach tags to fetch match results.</p>
              </div>
            ) : (
              <div className="results-grid">
                {suggestions.map((profile) => {
                  const name = profile.userId?.name || 'Explorer';
                  const initials = getInitials(name);

                  return (
                    <div key={profile._id} className="hero-feature-card glass" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem 1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.35rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                          {profile.profilePhoto ? (
                            <img src={profile.profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            initials
                          )}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>@{profile.username}</span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', minHeight: '36px', marginBottom: '1rem' }}>
                        {profile.headline || 'ConnectCraft Explorer'}
                      </p>

                      {/* Structured reasons */}
                      {renderRecommendationSummary(profile.recommendationSummary, profile.interests)}

                      <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                        <Link to={`/profile/${profile.username}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '0.55rem 0', fontSize: '0.8rem' }}>
                          View Profile
                        </Link>
                        <button 
                          onClick={() => triggerConnectModal(profile.userId._id, name)} 
                          className="btn-primary" 
                          style={{ flex: 1, padding: '0.55rem 0', fontSize: '0.8rem', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <FiUserPlus /> Connect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

        </div>
      )}

      {/* Connect Modal */}
      <ConnectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        recipientId={selectedUser.id}
        recipientName={selectedUser.name}
        onSuccess={fetchData}
      />

    </div>
  );
};

export default Connections;
