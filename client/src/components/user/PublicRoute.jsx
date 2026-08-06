import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div 
          className="spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--bg-tertiary)',
            borderTop: '3px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading ConnectCraft...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    const isAdminRole = user && ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(user.role);
    if (isAdminRole) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to={user?.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />;
  }

  return children;
};

export default PublicRoute;
