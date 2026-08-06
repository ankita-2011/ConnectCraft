import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        color: '#F8FAFC'
      }}>
        <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid #334155', borderTop: '3px solid #6366F1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const isAdminRole = user && ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(user.role);

  if (!user || !isAdminRole) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;
