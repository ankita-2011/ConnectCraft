import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck } from 'lucide-react';

const AdminNavbar = ({ onMenuToggle, isMobileOpen }) => {
  const { user } = useAuth();

  return (
    <div className="admin-navbar">
      <div className="admin-nav-left">
        <button
          className="admin-hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Toggle Navigation"
        >
          {isMobileOpen ? '✕' : '☰'}
        </button>

        <ShieldCheck size={20} color="#0F766E" className="admin-nav-icon" />
        <span className="admin-nav-title">
          Management Control Center
        </span>
      </div>

      <div className="admin-nav-right">
        <div className="admin-nav-user-badge">
          <UserCheck size={16} color="#5EEAD4" />
          <span className="admin-nav-username">
            {user?.name || 'Administrator'}
          </span>
          <span className="admin-nav-role">
            {user?.role || 'ADMIN'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;
