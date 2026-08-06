import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FiCalendar, 
  FiClock, 
  FiVideo, 
  FiMapPin, 
  FiUserCheck, 
  FiEdit, 
  FiTrash2, 
  FiArrowLeft,
  FiExternalLink,
  FiCheckCircle,
  FiUserMinus,
  FiXCircle
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/workshops.css';
import '../../styles/user/impact.css';
import LevelBadge from '../../components/shared/LevelBadge';


import { useToast } from '../../context/ToastContext';

const WorkshopDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [workshop, setWorkshop] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/workshops/${id}`);
      if (response.data?.status === 'success') {
        const ws = response.data.workshop;
        setWorkshop(ws);

        // If user is host, fetch participants roster
        if (ws.isHost) {
          try {
            const pRes = await api.get(`/workshops/${id}/participants`);
            if (pRes.data?.status === 'success') {
              setParticipants(pRes.data.participants || []);
            }
          } catch (pErr) {
            console.error('Error fetching participants roster:', pErr);
          }
        }
      }
    } catch  {
      setError('Workshop not found or server error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleRegister = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post(`/workshops/${id}/register`);
      if (response.data?.status === 'success') {
        setSuccess('Registration confirmed! You have secured your seat.');
        fetchDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCancelRegistration = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/workshops/${id}/register`);
      if (response.data?.status === 'success') {
        toast.info('Your registration has been cancelled.');
        setCancelModalOpen(false);
        fetchDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteWorkshop = async () => {
    const check = window.confirm('CRITICAL: This will delete this workshop and notify all registered attendees. Proceed?');
    if (!check) return;

    setActionLoading(true);
    try {
      const response = await api.delete(`/workshops/${id}`);
      if (response.data?.status === 'success') {
        navigate('/workshops');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete workshop.');
      setActionLoading(false);
    }
  };

  const handleRemoveParticipant = async (targetUserId, targetName) => {
    const confirmRemove = window.confirm(`Remove ${targetName} from workshop roster?`);
    if (!confirmRemove) return;

    try {
      const response = await api.delete(`/workshops/${id}/participants/${targetUserId}`);
      if (response.data?.status === 'success') {
        toast.info(`${targetName} removed from workshop roster.`);
        setParticipants((prev) => prev.filter((p) => p.user._id !== targetUserId));
        fetchDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Error removing participant.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error && !workshop) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="alert-message error">{error}</div>
        <button onClick={() => navigate('/workshops')} className="btn-primary" style={{ marginTop: '1.5rem' }}>Back to Workshops</button>
      </div>
    );
  }

  const hostName = workshop.host?.name || 'ConnectCraft Member';
  const hostUsername = workshop.hostProfile?.username || '';
  const hostPhoto = workshop.hostProfile?.profilePhoto || '';
  const availableSeats = workshop.availableSeats !== undefined ? workshop.availableSeats : (workshop.maxParticipants - (workshop.registeredCount || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <Link to="/workshops" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'max-content', fontSize: '0.85rem' }}>
        <FiArrowLeft /> All Workshops & Events
      </Link>

      {error && <div className="alert-message error">{error}</div>}
      {success && <div className="alert-message success">{success}</div>}

      {/* Main Grid Layout */}
      <div className="workshop-detail-container">
        
        {/* LEFT COLUMN: Event Content & Description */}
        <div className="workshop-main-panel">
          
          {/* Banner / Hero Card */}
          <div className="glass" style={{ borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            {workshop.bannerImage ? (
              <img src={workshop.bannerImage} alt={workshop.title} style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '180px', width: '100%', background: 'linear-gradient(135deg, var(--color-primary-glow) 0%, var(--bg-tertiary) 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3.5rem', color: 'var(--color-primary)' }}>
                <FiCalendar />
              </div>
            )}

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge-pill" style={{ fontSize: '0.7rem' }}>{workshop.eventType}</span>
                <span className="badge-pill teach" style={{ fontSize: '0.7rem' }}>{workshop.category}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: workshop.status === 'Cancelled' ? 'var(--color-danger)' : 'var(--color-success)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                  ● {workshop.status}
                </span>
              </div>

              <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.75rem' }}>{workshop.title}</h1>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{workshop.shortDescription}</p>
            </div>
          </div>

          {/* Detailed Agenda */}
          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--border-radius-md)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Event Overview & Agenda</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
              {workshop.description}
            </p>

            {workshop.tags?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Associated Skills & Tags</h4>
                <div className="badge-flex">
                  {workshop.tags.map((t) => <span key={t} className="badge-pill" style={{ fontSize: '0.75rem' }}>#{t}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Online Meeting Link Reveal Card */}
          {(workshop.isRegistered || workshop.isHost) && workshop.meetingLink && (
            <div className="glass" style={{ padding: '1.75rem', borderRadius: 'var(--border-radius-md)', borderLeft: '4px solid var(--color-success)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <FiVideo style={{ fontSize: '1.5rem', color: 'var(--color-success)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Online Access Credentials</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                You are registered for this event! Access the live meeting room via the link below:
              </p>
              <a href={workshop.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', backgroundColor: 'var(--color-success)' }}>
                <FiExternalLink /> Join Online Meeting Room
              </a>
            </div>
          )}

          {/* Host Participant Management Panel */}
          {workshop.isHost && (
            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--border-radius-md)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Registered Participants ({participants.length} / {workshop.maxParticipants})</h3>
              
              {participants.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No participants registered yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {participants.map((p) => (
                    <div key={p._id} className="participant-avatar-row">
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 600, color: 'var(--color-primary)', overflow: 'hidden' }}>
                        {p.profile?.profilePhoto ? (
                          <img src={p.profile.profilePhoto} alt={p.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          p.user.name.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.user.name}</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registered {new Date(p.registeredAt).toLocaleDateString()}</span>
                      </div>

                      <button onClick={() => handleRemoveParticipant(p.user._id, p.user.name)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: 'var(--color-danger)' }} title="Remove Attendee">
                        <FiUserMinus /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sidebar Action Box & Metadata */}
        <div className="workshop-side-panel">
          
          {/* Registration & Action Card */}
          <div className="glass" style={{ padding: '1.75rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--border-color)' }}>
            
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Seat Status</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: availableSeats > 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '0.25rem' }}>
                {availableSeats} Seats Available
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Capacity: {workshop.maxParticipants} attendees</span>
            </div>

            {/* Action Buttons */}
            {workshop.isHost ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span className="badge-pill" style={{ width: 'max-content', fontSize: '0.7rem' }}>👑 You are Hosting</span>
                <Link to={`/workshops/${workshop._id}/edit`} className="btn-secondary" style={{ textAlign: 'center', padding: '0.65rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                  <FiEdit /> Edit Event Settings
                </Link>
                <button onClick={handleDeleteWorkshop} className="btn-secondary" style={{ padding: '0.65rem', fontSize: '0.85rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                  <FiTrash2 /> Cancel / Delete Event
                </button>
              </div>
            ) : workshop.isRegistered ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                  <FiCheckCircle /> You are Registered
                </div>
                <button onClick={() => setCancelModalOpen(true)} className="btn-secondary" disabled={actionLoading} style={{ padding: '0.65rem', fontSize: '0.85rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  Cancel Registration
                </button>
              </div>
            ) : (
              <button onClick={handleRegister} className="btn-primary" disabled={actionLoading || availableSeats <= 0 || workshop.status === 'Cancelled'} style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem' }}>
                {actionLoading ? 'Registering...' : availableSeats <= 0 ? 'Event Full' : 'Register for Workshop'}
              </button>
            )}

            {/* Date & Time metadata */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FiCalendar style={{ color: 'var(--color-primary)' }} />
                <span><strong>Date:</strong> {new Date(workshop.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FiClock style={{ color: 'var(--color-primary)' }} />
                <span><strong>Time:</strong> {workshop.startTime} - {workshop.endTime}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FiVideo style={{ color: 'var(--color-primary)' }} />
                <span><strong>Mode:</strong> {workshop.mode}</span>
              </div>

              {workshop.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FiMapPin style={{ color: 'var(--color-primary)' }} />
                  <span><strong>Location:</strong> {workshop.location}</span>
                </div>
              )}
            </div>

            {/* Host Info Box */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', flexShrink: 0 }}>
                {hostPhoto ? (
                  <img src={hostPhoto} alt={hostName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  hostName.slice(0, 2).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Host</span>
                  <LevelBadge level={workshop.hostProfile?.level || 'Explorer'} showIcon={true} />
                </div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.2rem' }}>{hostName}</h4>
                {hostUsername && (
                  <Link to={`/profile/${hostUsername}`} style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>View Profile</Link>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Cancel Registration Confirmation Modal */}
      {cancelModalOpen && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center', padding: '2.25rem 1.75rem', borderRadius: '16px' }}>
            <div style={{ width: '58px', height: '58px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1.15rem auto' }}>
              <FiXCircle />
            </div>
            
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.5rem' }}>
              Cancel Event Registration?
            </h3>
            
            <p style={{ fontSize: '0.875rem', color: '#57534E', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Are you sure you want to cancel your registration for <strong>"{workshop?.title}"</strong>? Your reserved seat will be released to other attendees.
            </p>

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCancelModalOpen(false)}
                disabled={actionLoading}
                style={{ padding: '0.65rem 1.35rem', minWidth: '115px', fontWeight: 600 }}
              >
                Keep Seat
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmCancelRegistration}
                disabled={actionLoading}
                style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF', padding: '0.65rem 1.35rem', minWidth: '140px', fontWeight: 600 }}
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel Seat'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkshopDetails;
