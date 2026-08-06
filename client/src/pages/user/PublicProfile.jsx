import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ConnectionModal from '../../components/shared/ConnectionModal';
import { getInitials } from '../../utils/avatar';
import { 
  FiMapPin, 
  FiGlobe, 
  FiEdit, 
  FiAward, 
  FiClock, 
  FiCheckCircle,
  FiUserPlus,
  FiUserMinus,
  FiCheck,
  FiX,
  FiMessageSquare
} from 'react-icons/fi';
import { 
  FaGithub, 
  FaLinkedin, 
  FaDribbble, 
  FaYoutube, 
  FaInstagram, 
  FaUserCircle 
} from 'react-icons/fa';
import '../../styles/user/profile.css';
import '../../styles/user/connections.css';
import LevelBadge from '../../components/shared/LevelBadge';



import { useToast } from '../../context/ToastContext';

const PublicProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [ownedCommunities, setOwnedCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [projectsCreated, setProjectsCreated] = useState([]);
  const [projectsJoined, setProjectsJoined] = useState([]);
  const [projectsCompleted, setProjectsCompleted] = useState([]);
  const [resourcesShared, setResourcesShared] = useState([]);
  const [resourcesLiked, setResourcesLiked] = useState([]);
  const [resourcesSaved, setResourcesSaved] = useState([]);
  const [workshopsHosted, setWorkshopsHosted] = useState([]);
  const [workshopsAttended, setWorkshopsAttended] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [connectionId, setConnectionId] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [recommendationSummary, setRecommendationSummary] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/profile/${username}`);
      if (response.data?.status === 'success') {
        setProfile(response.data.profile);
        setOwnedCommunities(response.data.ownedCommunities || []);
        setJoinedCommunities(response.data.joinedCommunities || []);
        setProjectsCreated(response.data.projectsCreated || []);
        setProjectsJoined(response.data.projectsJoined || []);
        setProjectsCompleted(response.data.projectsCompleted || []);
        setResourcesShared(response.data.resourcesShared || []);
        setResourcesLiked(response.data.resourcesLiked || []);
        setResourcesSaved(response.data.resourcesSaved || []);
        setWorkshopsHosted(response.data.workshopsHosted || []);
        setWorkshopsAttended(response.data.workshopsAttended || []);
        setConnectionStatus(response.data.connectionStatus || 'none');
        setConnectionId(response.data.connectionId);
        setRequestId(response.data.requestId);
        setRecommendationSummary(response.data.recommendationSummary);
      }
    } catch (err) {
      setError(err.message || 'Profile not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card glass" style={{ textAlign: 'center', maxWidth: '440px' }}>
          <h2 style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>Profile Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error || 'This user profile does not exist.'}</p>
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser._id === profile.userId?._id;
  const fullName = profile.userId?.name || 'ConnectCraft Member';

  const handleAccept = async () => {
    if (!requestId) return;
    try {
      const res = await api.post(`/connections/accept/${requestId}`);
      if (res.data?.status === 'success') {
        toast.success('Connection request accepted!');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to accept request.');
    }
  };

  const handleReject = async () => {
    if (!requestId) return;
    try {
      const res = await api.post(`/connections/reject/${requestId}`);
      if (res.data?.status === 'success') {
        toast.info('Connection request declined.');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reject request.');
    }
  };

  const handleCancel = async () => {
    if (!requestId) return;
    try {
      const res = await api.post(`/connections/cancel/${requestId}`);
      if (res.data?.status === 'success') {
        toast.info('Connection request cancelled.');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel request.');
    }
  };

  const handleRemove = async () => {
    if (!connectionId) return;
    const confirmDelete = window.confirm('Are you sure you want to remove this connection?');
    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/connections/${connectionId}`);
      if (res.data?.status === 'success') {
        toast.info('Connection removed.');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove connection.');
    }
  };

  // Render social links dynamically if present
  const renderSocials = () => {
    const links = profile.socialLinks || {};
    const icons = {
      github: <FaGithub />,
      linkedin: <FaLinkedin />,
      dribbble: <FaDribbble />,
      youtube: <FaYoutube />,
      instagram: <FaInstagram />,
      website: <FiGlobe />,
      portfolio: <FiGlobe />
    };

    return Object.entries(links)
      .filter(([_, url]) => url && url.trim() !== '')
      .map(([name, url]) => (
        <a 
          key={name}
          href={url.startsWith('http') ? url : `https://${url}`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="social-icon-btn"
          title={name}
        >
          {icons[name] || <FiGlobe />}
        </a>
      ));
  };

  return (
    <div className="profile-view-container">
      {/* Header Info */}
      <div className="profile-header-wrapper">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div className="profile-avatar-box">
            {profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt={fullName} className="profile-avatar-img" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3.5rem', fontWeight: 800, backgroundColor: 'var(--bg-secondary)', color: 'var(--color-primary)' }}>
                {getInitials(fullName)}
              </div>
            )}
          </div>

          {/* Action buttons (Edit Profile / Connection Status) */}
          {isOwner ? (
            <Link to="/profile/edit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 'var(--border-radius-md)' }}>
              <FiEdit /> Edit Profile
            </Link>
          ) : currentUser ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(profile?.userId?.role) ? (
                <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366F1', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.6rem 1.25rem', borderRadius: 'var(--border-radius-md)', fontWeight: 600, fontSize: '0.9rem' }}>
                  Admin Account
                </span>
              ) : (
                <>
                  {connectionStatus === 'connected' && (
                    <>
                      <span style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--color-success)', border: '1px solid var(--color-success)', padding: '0.6rem 1.25rem', borderRadius: 'var(--border-radius-md)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <FiCheckCircle /> Connected
                      </span>
                      <Link to={`/messages?userId=${profile.userId?._id || profile.userId}&username=${profile.username}`} className="btn-primary" style={{ padding: '0.6rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                        <FiMessageSquare /> Message
                      </Link>
                      <button onClick={handleRemove} className="btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.3)', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FiUserMinus /> Remove
                      </button>
                    </>
                  )}

                  {connectionStatus === 'pending_sent' && (
                    <>
                      <span style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)', padding: '0.6rem 1.25rem', borderRadius: 'var(--border-radius-md)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <FiClock /> Request Sent
                      </span>
                      <button onClick={handleCancel} className="btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.3)', padding: '0.6rem 1rem' }}>
                        Cancel Request
                      </button>
                    </>
                  )}

                  {connectionStatus === 'pending_received' && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={handleAccept} className="btn-primary" style={{ padding: '0.6rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiCheck /> Accept Request
                      </button>
                      <button onClick={handleReject} className="btn-secondary" style={{ color: 'var(--color-danger)', padding: '0.6rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiX /> Reject
                      </button>
                    </div>
                  )}

                  {connectionStatus === 'none' && (
                    <button onClick={() => setModalOpen(true)} className="btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiUserPlus /> Connect
                    </button>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Layout Grid */}
        <div className="profile-meta-grid">
          {/* Main Info */}
          <div className="profile-details-card glass">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{fullName}</h1>
              <LevelBadge level={profile.level || 'Explorer'} />
            </div>
            <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '1.1rem' }}>@{profile.username}</p>

            {profile.headline && (
              <h2 style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {profile.headline}
              </h2>
            )}

            {profile.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <FiMapPin /> {profile.location}
              </div>
            )}

            {profile.bio && (
              <div>
                <h3 className="info-section-title">About Me</h3>
                <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>{profile.bio}</p>
              </div>
            )}

            {/* Why Recommended Match Summary Box */}
            {!isOwner && recommendationSummary && (
              <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)', borderLeft: '4px solid var(--color-primary)', marginTop: '1rem' }}>
                <h3 className="info-section-title" style={{ marginTop: 0 }}>Why You Match</h3>
                <div className="recom-box" style={{ padding: '1rem', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  {recommendationSummary.canTeachYou?.length > 0 && (
                    <div style={{ marginBottom: '0.6rem' }}>
                      <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.35rem' }}>Skills they can teach you</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {recommendationSummary.canTeachYou.map(s => <span key={s} style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.25rem 0.65rem', borderRadius: '16px', fontSize: '0.775rem', fontWeight: 600 }}>{s}</span>)}
                      </div>
                    </div>
                  )}
                  {recommendationSummary.youCanTeach?.length > 0 && (
                    <div style={{ marginBottom: '0.6rem' }}>
                      <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.35rem' }}>Skills you can teach them</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {recommendationSummary.youCanTeach.map(s => <span key={s} style={{ background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1', padding: '0.25rem 0.65rem', borderRadius: '16px', fontSize: '0.775rem', fontWeight: 600 }}>{s}</span>)}
                      </div>
                    </div>
                  )}
                  {recommendationSummary.sharedInterests?.length > 0 && (
                    <div style={{ marginBottom: '0.6rem' }}>
                      <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.35rem' }}>⚡ Matched Interests</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {recommendationSummary.sharedInterests.map(i => (
                          <span key={i} style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '0.25rem 0.65rem', borderRadius: '16px', fontSize: '0.775rem', fontWeight: 600 }}>
                            ✓ {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {recommendationSummary.sharedCommunities?.length > 0 && (
                    <div style={{ marginBottom: '0.6rem' }}>
                      <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.35rem' }}>Shared Communities</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {recommendationSummary.sharedCommunities.map(c => <span key={c} style={{ background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', padding: '0.25rem 0.65rem', borderRadius: '16px', fontSize: '0.775rem', fontWeight: 600 }}>{c}</span>)}
                      </div>
                    </div>
                  )}
                  {recommendationSummary.sharedLanguages?.length > 0 && (
                    <div>
                      <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.35rem' }}>Shared Languages</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {recommendationSummary.sharedLanguages.map(l => <span key={l} style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.25rem 0.65rem', borderRadius: '16px', fontSize: '0.775rem', fontWeight: 600 }}>{l}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills grid section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
              <div>
                <h3 className="info-section-title">Skills I Can Teach</h3>
                <div className="badge-flex">
                  {profile.skillsToTeach?.map((skill) => (
                    <span key={skill} className="badge-pill teach">{skill}</span>
                  )) || <span style={{ color: 'var(--text-muted)' }}>None specified</span>}
                </div>
              </div>

              <div>
                <h3 className="info-section-title">Skills I Want to Learn</h3>
                <div className="badge-flex">
                  {profile.skillsToLearn?.map((skill) => (
                    <span key={skill} className="badge-pill learn">{skill}</span>
                  )) || <span style={{ color: 'var(--text-muted)' }}>None specified</span>}
                </div>
              </div>
            </div>

            {/* Communities Sections */}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
              <h3 className="info-section-title">Communities ({ownedCommunities.length + joinedCommunities.length})</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {ownedCommunities.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Owned Communities</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {ownedCommunities.map(comm => (
                        <div key={comm._id} className="glass" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{comm.communityName}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{comm.category} • {comm.memberCount} members</p>
                          </div>
                          <Link to={`/communities/${comm.slug}`} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>Open</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {joinedCommunities.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Joined Communities</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {joinedCommunities.map(comm => (
                        <div key={comm._id} className="glass" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{comm.communityName}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{comm.category} • {comm.memberCount} members</p>
                          </div>
                          <Link to={`/communities/${comm.slug}`} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>Open</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ownedCommunities.length === 0 && joinedCommunities.length === 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Not a member of any communities yet.</span>
                )}
              </div>
            </div>

            {/* Projects Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
              <h3 className="info-section-title">Projects ({projectsCreated.length + projectsJoined.length + projectsCompleted.length})</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {projectsCreated.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Projects Created</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {projectsCreated.map(proj => (
                        <div key={proj._id} className="glass" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{proj.title}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{proj.category} • {proj.status}</p>
                          </div>
                          <Link to={`/projects/${proj._id}`} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>View</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {projectsJoined.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Projects Joined</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {projectsJoined.map(proj => (
                        <div key={proj._id} className="glass" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{proj.title}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{proj.category} • {proj.status}</p>
                          </div>
                          <Link to={`/projects/${proj._id}`} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>View</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {projectsCompleted.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Completed Projects</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {projectsCompleted.map(proj => (
                        <div key={proj._id} className="glass" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{proj.title}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{proj.category} • Completed</p>
                          </div>
                          <Link to={`/projects/${proj._id}`} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>View</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {projectsCreated.length === 0 && projectsJoined.length === 0 && projectsCompleted.length === 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No collaboration projects created or joined yet.</span>
                )}
              </div>
            </div>

            {/* Knowledge Resources Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
              <h3 className="info-section-title">Knowledge Resources ({resourcesShared.length + resourcesLiked.length + resourcesSaved.length})</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {resourcesShared.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Resources Shared</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {resourcesShared.map(res => (
                        <div key={res._id} className="glass" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{res.title}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{res.resourceType} • {res.category}</p>
                          </div>
                          <Link to={`/resources/${res._id}`} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>View</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resourcesLiked.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Liked Resources</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {resourcesLiked.map(res => (
                        <div key={res._id} className="glass" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{res.title}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{res.resourceType} • {res.category}</p>
                          </div>
                          <Link to={`/resources/${res._id}`} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>View</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resourcesSaved.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Saved Resources</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {resourcesSaved.map(res => (
                        <div key={res._id} className="glass" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{res.title}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{res.resourceType} • {res.category}</p>
                          </div>
                          <Link to={`/resources/${res._id}`} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>View</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resourcesShared.length === 0 && resourcesLiked.length === 0 && resourcesSaved.length === 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No resources shared or saved yet.</span>
                )}
              </div>
            </div>

            {/* Workshops & Events Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
              <h3 className="info-section-title">Workshops & Events ({workshopsHosted.length + workshopsAttended.length})</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {workshopsHosted.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Workshops Hosted</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {workshopsHosted.map(ws => (
                        <div key={ws._id} className="glass" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ws.title}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{ws.eventType} • {new Date(ws.date).toLocaleDateString()}</p>
                          </div>
                          <Link to={`/workshops/${ws._id}`} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>View</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {workshopsAttended.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Workshops Attended</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {workshopsAttended.map(ws => (
                        <div key={ws._id} className="glass" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ws.title}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{ws.eventType} • {new Date(ws.date).toLocaleDateString()}</p>
                          </div>
                          <Link to={`/workshops/${ws._id}`} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>View</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {workshopsHosted.length === 0 && workshopsAttended.length === 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No workshops hosted or attended yet.</span>
                )}
              </div>
            </div>

            {/* Analytics & Growth Summary */}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
              <h3 className="info-section-title">Analytics & Contribution Metrics</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--border-radius-md)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Impact Points</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>{profile.impactScore || 0} pts</div>
                </div>

                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--border-radius-md)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Projects Lead</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>{projectsCreated.length}</div>
                </div>

                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--border-radius-md)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Resources Shared</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>{resourcesShared.length}</div>
                </div>

                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--border-radius-md)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Events Hosted</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>{workshopsHosted.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Impact Points Card */}
            <div className="profile-side-card glass" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em', fontWeight: 700 }}>Impact Points</h4>
                  <div style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{profile.impactScore || profile.reputation || 0}</div>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.6rem', lineHeight: 1.45 }}>
                    Represents a user's overall contribution and engagement within ConnectCraft.
                  </p>
                </div>
                <div style={{ fontSize: '2.5rem', color: 'var(--color-primary)', opacity: 0.8 }}><FiAward /></div>
              </div>
            </div>

            {/* General widgets */}
            <div className="profile-side-card glass">
              {profile.interests?.length > 0 && (
                <div>
                  <h3 className="info-section-title">Interests</h3>
                  <div className="badge-flex">
                    {profile.interests.map((interest) => (
                      <span key={interest} className="badge-pill">{interest}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.languages?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 className="info-section-title">Languages</h3>
                  <div className="badge-flex">
                    {profile.languages.map((lang) => (
                      <span key={lang} className="badge-pill" style={{ borderColor: 'rgba(250, 204, 21, 0.4)' }}>{lang}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.availability?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 className="info-section-title">Availability</h3>
                  <div className="badge-flex">
                    {profile.availability.map((avail) => (
                      <span key={avail} className="badge-pill" style={{ color: 'var(--color-secondary)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>{avail}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="info-section-title">Social Profiles</h3>
                <div className="social-icon-row">
                  {renderSocials()}
                </div>
              </div>

              {profile.badges?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 className="info-section-title">Badges</h3>
                  <div className="badge-flex">
                    {profile.badges.map((badge) => (
                      <span key={badge} className="badge-pill" style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
                        🏆 {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Completion Indicator */}
            {isOwner && (
              <div className="profile-side-card glass" style={{ gap: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Profile Completion: {profile.profileCompletion}%</h4>
                <div className="progress-bar-bg" style={{ height: '6px' }}>
                  <div className="progress-bar-fill" style={{ width: `${profile.profileCompletion}%` }}></div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Complete your profile to increase your Impact Points.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Request Modal */}
      {profile.userId?._id && (
        <ConnectionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          recipientId={profile.userId._id}
          recipientName={fullName}
          onSuccess={fetchProfile}
        />
      )}

    </div>
  );
};

export default PublicProfile;
