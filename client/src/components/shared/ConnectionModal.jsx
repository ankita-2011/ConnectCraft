import { useState } from 'react';
import api from '../../services/api';
import { FiX, FiSend } from 'react-icons/fi';
import '../../styles/user/auth.css';
import '../../styles/user/connections.css';

const ConnectionModal = ({ isOpen, onClose, recipientId, recipientName, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [connectionType, setConnectionType] = useState('learning');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/connections/request', {
        receiverId: recipientId,
        connectionType,
        message: message.trim(),
      });

      if (response.data?.status === 'success') {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send connection request.');
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

        <h3 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Connect with {recipientName}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Set up a learning request to match skills and learn together.
        </p>

        {error && <div className="alert-message error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Connection Type */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Connection Purpose</label>
            <select
              className="filter-select"
              value={connectionType}
              onChange={(e) => setConnectionType(e.target.value)}
            >
              <option value="learning">Learning Exchange (Complementary skills)</option>
              <option value="mentorship" disabled>Mentorship (Coming soon)</option>
              <option value="project_collaboration" disabled>Project Collaboration (Coming soon)</option>
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
              placeholder="e.g. Hi Rahul, I noticed you teach Docker, and I'd love to learn it. I can help you with React in exchange!"
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
              <FiSend /> {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ConnectionModal;
