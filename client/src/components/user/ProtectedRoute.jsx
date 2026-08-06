import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

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

  // Redirect to login if user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // System Administrators belong in the Admin Dashboard, not standard user pages
  const isAdminRole = user && ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(user.role);
  if (isAdminRole) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If authenticated but onboarding is incomplete, restrict access to other protected routes
  if (!user?.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If authenticated and onboarding is already complete, prevent them from accessing /onboarding
  if (user?.onboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
