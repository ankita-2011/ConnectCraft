import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Bell, Search, Menu, User, X, LogOut, Edit3, CheckCircle2 } from 'lucide-react';
import Logo from '../shared/Logo';
import '../../styles/user/dashboard.css';
import { getInitials } from '../../utils/avatar';

const Navbar = ({ onMenuToggle, isMobileOpen }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadNotifCount, setUnreadNotifCount, deleteNotification } = useSocket();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'CC';

  return (
    <nav className="navbar-area glass">
      {/* Brand Logo & Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="nav-icon-badge-btn hamburger-btn"
          onClick={onMenuToggle}
          style={{ display: 'none' }}
        >
          {isMobileOpen ? <X style={{ width: '18px', height: '18px' }} /> : <Menu style={{ width: '18px', height: '18px' }} />}
        </button>

        <Logo to="/dashboard" size="medium" />
      </div>

      {/* Global Search Bar Placeholder */}
      <form onSubmit={handleSearchSubmit} className="nav-search-bar">
        <input
          type="text"
          className="nav-search-input"
          placeholder={isMobileScreen ? 'Search...' : 'Search skills, partners, communities...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            width: '16px',
            height: '16px',
          }}
        />
      </form>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

        {/* Notifications Icon Trigger */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="nav-icon-badge-btn"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setUserMenuOpen(false);
              if (!notifOpen) {
                setUnreadNotifCount(0);
              }
            }}
            title="Notifications"
          >
            <Bell style={{ width: '18px', height: '18px' }} />
            {unreadNotifCount > 0 && <span className="nav-badge">{unreadNotifCount}</span>}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifOpen && (
            <div className="notification-dropdown glass">
              {/* Header */}
              <div
                style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid #F5F5F4',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#FAFAF9',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1C1917' }}>Recent Notifications</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0F766E', backgroundColor: '#CCFBF1', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                  {notifications.length}
                </span>
              </div>

              {/* Notification Items List */}
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: '#78716C', fontSize: '0.85rem' }}>
                    No recent notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif._id}
                      style={{
                        padding: '0.85rem 1.15rem',
                        borderBottom: '1px solid #F5F5F4',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ paddingRight: '0.5rem', flex: 1 }}>
                        <p style={{ color: '#1C1917', fontSize: '0.825rem', fontWeight: 700, margin: 0, lineHeight: 1.35 }}>
                          {notif.title}
                        </p>
                        <p style={{ color: '#57534E', fontSize: '0.78rem', margin: '0.2rem 0 0.35rem', lineHeight: 1.4 }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: '0.68rem', color: '#A8A29E', fontWeight: 500 }}>
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <button
                        onClick={() => deleteNotification(notif._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#A8A29E',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.15s ease',
                        }}
                        title="Delete notification"
                      >
                        <X style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* View All Footer Link */}
              <div style={{ textAlign: 'center', padding: '0.75rem', borderTop: '1px solid #F5F5F4', backgroundColor: '#FAFAF9', fontSize: '0.8rem' }}>
                <Link
                  to="/notifications"
                  onClick={() => setNotifOpen(false)}
                  style={{ color: '#0F766E', fontWeight: 700, textDecoration: 'none' }}
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Menu Dropdown */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotifOpen(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title={user?.name || 'User Menu'}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                border: userMenuOpen ? '2px solid #0F766E' : '1.5px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--color-primary)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
          </button>

          {/* Profile & Logout Dropdown Menu */}
          {userMenuOpen && (
            <div className="user-menu-dropdown glass">
              {/* User Info Header */}
              <div className="user-menu-header">
                <p className="user-menu-name">
                  {user?.name || 'ConnectCraft User'}
                </p>
                <p className="user-menu-email">
                  {user?.email}
                </p>
              </div>

              {/* Menu Links */}
              <div style={{ padding: '0.35rem 0.5rem' }}>
                <Link
                  to={user?.username ? `/profile/${user.username}` : '/profile/edit'}
                  onClick={() => setUserMenuOpen(false)}
                  className="user-menu-item"
                >
                  <User size={16} color="#0F766E" />
                  <span>View Public Profile</span>
                </Link>

                <Link
                  to="/profile/edit"
                  onClick={() => setUserMenuOpen(false)}
                  className="user-menu-item"
                >
                  <Edit3 size={16} color="#0F766E" />
                  <span>Edit Profile</span>
                </Link>
              </div>

              {/* Logout Button */}
              <div style={{ borderTop: '1px solid #F5F5F4', padding: '0.35rem 0.5rem 0.35rem' }}>
                <button
                  onClick={handleLogout}
                  className="user-menu-item logout"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <LogOut size={16} color="#DC2626" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Inline styling to manage specific layout overrides responsive */}
      <style>{`
        @media (max-width: 1024px) {
          .hamburger-btn {
            display: flex !important;
          }
          .nav-search-bar {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
};

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.55rem 0.75rem',
  fontSize: '0.85rem',
  color: '#292524',
  textDecoration: 'none',
  borderRadius: '8px',
  transition: 'background 0.15s ease',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 500,
};

export default Navbar;
