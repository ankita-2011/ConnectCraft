import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl, getInitials } from '../../utils/avatar';
import { 
  LayoutGrid, 
  Compass, 
  UserCheck, 
  Users, 
  Code, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Bookmark, 
  Settings
} from 'lucide-react';
import '../../styles/user/dashboard.css';
import '../../styles/user/sidebar.css';
import '../../styles/shared/modals.css';

const Sidebar = ({ isMobileOpen, closeSidebar }) => {
  const { user } = useAuth();
  const iconStyle = { width: '18px', height: '18px' };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutGrid style={iconStyle} /> },
    { name: 'Discover', path: '/discover', icon: <Compass style={iconStyle} /> },
    { name: 'Connections', path: '/connections', icon: <UserCheck style={iconStyle} /> },
    { name: 'Communities', path: '/communities', icon: <Users style={iconStyle} /> },
    { name: 'Projects', path: '/projects', icon: <Code style={iconStyle} /> },
    { name: 'Resources', path: '/resources', icon: <BookOpen style={iconStyle} /> },
    { name: 'Workshops', path: '/workshops', icon: <Calendar style={iconStyle} /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare style={iconStyle} /> },
    { name: 'Bookmarks', path: '/bookmarks', icon: <Bookmark style={iconStyle} /> },
    { name: 'Settings', path: '/settings', icon: <Settings style={iconStyle} /> },
  ];

  const roleDisplay = user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'ADMIN' ? 'Admin' : 'Community Member';

  return (
    <>
      <aside className={`sidebar-area ${isMobileOpen ? 'mobile-open' : ''}`}>
        
        {/* Navigation List links */}
        <ul className="sidebar-list">
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item-btn ${isActive ? 'active' : ''}`
                }
                onClick={closeSidebar}
              >
                <span className="sidebar-icon-wrap">{item.icon}</span>
                <span className="sidebar-text">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Sidebar Footer Section */}
        <div className="sidebar-footer">
          {/* User Profile Info Card */}
          <div className="sidebar-user-profile">
            <div className="sidebar-avatar">
              {user?.profilePhoto ? (
                <img src={getAvatarUrl(user.profilePhoto)} alt={user.name || 'User'} />
              ) : (
                getInitials(user?.name)
              )}
            </div>

            <div className="sidebar-user-details">
              <div className="sidebar-user-name">
                {user?.name || 'ConnectCraft User'}
              </div>
              <div className="sidebar-user-role">
                {roleDisplay}
              </div>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
