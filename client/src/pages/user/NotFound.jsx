import { Link } from 'react-router-dom';
import { FiAlertOctagon, FiArrowLeft } from 'react-icons/fi';
import '../../styles/user/auth.css';

const NotFound = () => {
  return (
    <div className="auth-wrapper">
      <div className="auth-card glass" style={{ textAlign: 'center', maxWidth: '440px' }}>
        <div 
          style={{
            fontSize: '4.5rem',
            fontWeight: 800,
            lineHeight: 1,
            marginBottom: '1rem',
            color: 'var(--color-danger)'
          }}
        >
          404
        </div>
        
        <div 
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--color-danger)',
            fontSize: '1.5rem'
          }}
        >
          <FiAlertOctagon />
        </div>

        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Lost in Space</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          The coordinates you entered led to an empty region of ConnectCraft.
        </p>

        <Link 
          to="/" 
          className="auth-btn"
          style={{ display: 'inline-flex', width: 'auto', padding: '0.8rem 1.5rem', gap: '0.5rem', margin: '0 auto' }}
        >
          <FiArrowLeft /> Return to Safety
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
