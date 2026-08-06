import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiX, FiSend, FiUsers } from 'react-icons/fi';
import '../../styles/user/auth.css';
import '../../styles/user/connections.css';
import '../../styles/user/projects.css';

const ProjectInviteModal = ({ isOpen, onClose, projectId, projectTitle, isTeamFull = false, onSuccess }) => {
  const [connections, setConnections] = useState([]);
  const [selectedReceiverId, setSelectedReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingConnections, setFetchingConnections] = useState(true);
  const [error, setError] = useState('');

  // Fetch active user connections when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchConnections = async () => {
      setFetchingConnections(true);
      setError('');
      try {
        const response = await api.get('/connections');
        if (response.data?.status === 'success') {
          setConnections(response.data.connections || []);
          if (response.data.connections?.length > 0) {
            setSelectedReceiverId(response.data.connections[0].userId?._id || '');
          }
        }
      } catch  {
        setError('Could not retrieve active connections.');
      } finally {
        setFetchingConnections(false);
      }
    };

    fetchConnections();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isTeamFull) {
      setError('Project has reached its maximum team size capacity.');
      return;
    }
    if (!selectedReceiverId) {
      setError('Please select a connection to invite.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/projects/${projectId}/invite`, {
        receiverId: selectedReceiverId,
        message: message.trim(),
      });

      if (response.data?.status === 'success') {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to send project invitation.');
    } finally {
      setLoading(false);
    }
  };

  const charLimit = 250;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card glass" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <FiX />
        </button>

        <h3 className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Invite Connection to Project
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Recruit a connected peer to collaborate on <strong>{projectTitle}</strong>.
        </p>

        {isTeamFull && (
          <div className="alert-message error" style={{ marginBottom: '1.25rem' }}>
            Project has reached its maximum team size capacity.
          </div>
        )}

        {error && !isTeamFull && <div className="alert-message error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        {fetchingConnections ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : isTeamFull ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              You cannot send new invitations because this project team is currently at full capacity.
            </p>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.6rem 1.25rem' }}>
              Close
            </button>
          </div>
        ) : connections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <FiUsers style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              You don't have any active connections yet. Establish connections with peers first to invite them.
            </p>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.6rem 1.25rem' }}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Select Connection */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Connection</label>
              <select
                className="filter-select"
                value={selectedReceiverId}
                onChange={(e) => setSelectedReceiverId(e.target.value)}
              >
                {connections.map((c) => {
                  const uId = c.userId?._id || c._id;
                  const name = c.userId?.name || 'Connected Peer';
                  return (
                    <option key={uId} value={uId}>
                      {name} (@{c.username})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Optional Message */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>Message (Optional)</label>
                <span 
                  style={{ 
                    fontSize: '0.7rem', 
                    color: message.length > charLimit - 20 ? 'var(--color-danger)' : 'var(--text-muted)' 
                  }}
                >
                  {message.length} / {charLimit}
                </span>
              </div>
              <textarea
                className="form-input"
                rows={4}
                placeholder="e.g. Hi Rahul, we are looking for a React developer to build our dashboard UI. Would love to have you on the team!"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, charLimit))}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
                style={{ flex: 1, padding: '0.7rem 0' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                style={{ flex: 1, padding: '0.7rem 0', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                <FiSend /> {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

export default ProjectInviteModal;
