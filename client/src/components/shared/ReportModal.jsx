import { useState } from 'react';
import api from '../../services/api';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import '../../styles/user/auth.css';

const ReportModal = ({ isOpen, onClose, targetType = 'Resource', targetId = '', targetTitle = '' }) => {
  const [reason, setReason] = useState('Inappropriate Content');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/reports', {
        targetType,
        targetId,
        reason,
        description,
      });

      if (response.data?.status === 'success') {
        setSuccess('Report submitted to platform moderators.');
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '480px', borderRadius: 'var(--border-radius-lg)', padding: '2rem', border: '1px solid var(--border-color)', position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
          <FiX />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <FiAlertTriangle style={{ fontSize: '1.5rem', color: 'var(--color-warning)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Report Content / User</h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Reporting <strong>{targetType}</strong>: <em>{targetTitle || targetId}</em>
        </p>

        {error && <div className="alert-message error">{error}</div>}
        {success && <div className="alert-message success">{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="form-group">
            <label className="form-label">Violation Reason *</label>
            <select className="filter-select" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="Inappropriate Content">Inappropriate Content</option>
              <option value="Spam or Misleading">Spam or Misleading</option>
              <option value="Harassment or Abuse">Harassment or Abuse</option>
              <option value="Copyright Violation">Copyright Violation</option>
              <option value="Other Policy Violation">Other Policy Violation</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Additional Details</label>
            <textarea className="form-input" rows={3} placeholder="Provide specific details to assist moderators..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ReportModal;
