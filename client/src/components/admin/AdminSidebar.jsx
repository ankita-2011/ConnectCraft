import { 
  LayoutDashboard, 
  Users, 
  Globe, 
  FolderGit2, 
  Calendar, 
  BookOpen, 
  BarChart3, 
  Shield, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = ({ activeTab, setActiveTab, isMobileOpen, closeSidebar }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'communities', label: 'Communities', icon: Globe },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'workshops', label: 'Workshops', icon: Calendar },
    { id: 'resources', label: 'Learning Resources', icon: BookOpen },
    { id: 'analytics', label: 'Analytics & Growth', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    if (closeSidebar) closeSidebar();
    await logout();
    navigate('/admin/login');
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (closeSidebar) closeSidebar();
  };

  return (
    <div className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="admin-sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#CCFBF1',
            fontWeight: 800,
            fontSize: '1.1rem',
            flexShrink: 0
          }}>
            <Shield size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#F5F5F4', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
              ConnectCraft
            </h2>
            <span style={{ fontSize: '0.65rem', color: '#5EEAD4', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Admin Portal
            </span>
          </div>
        </div>

        {closeSidebar && (
          <button 
            onClick={closeSidebar}
            className="admin-sidebar-close-btn"
            aria-label="Close Sidebar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Sidebar Navigation Items */}
      <div className="admin-sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`admin-menu-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer Log Out */}
      <div className="admin-sidebar-footer">
        <button
          onClick={handleLogout}
          className="admin-menu-item admin-logout-btn"
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap' }}>Sign Out Admin</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
