import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { 
  FiBell, 
  FiTrash2, 
  FiUserCheck, 
  FiBriefcase, 
  FiBookOpen, 
  FiUsers, 
  FiInfo,
  FiX
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/chat.css';

const Notifications = () => {
  const { notifications, deleteNotification, clearAllNotifications, refreshNotifications } = useSocket();

  useEffect(() => {
    refreshNotifications();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'connection_request': case 'connection_accepted':
        return <FiUserCheck style={{ color: 'var(--color-primary)' }} />;
      case 'project_invitation': case 'project_invitation_accepted': case 'project_invitation_rejected': case 'added_to_project':
        return <FiBriefcase style={{ color: 'var(--color-secondary)' }} />;
      case 'resource_shared':
        return <FiBookOpen style={{ color: 'var(--color-warning)' }} />;
      case 'community_announcement':
        return <FiUsers style={{ color: 'var(--color-accent)' }} />;
      default:
        return <FiInfo style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Section */}
      <div className="glass" style={{ padding: '2rem 2.5rem', borderRadius: 'var(--border-radius-lg)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Notification History</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Real-time updates regarding connections, project invites, and community events.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="btn-secondary"
            style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.55rem 1.15rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiTrash2 /> Clear All Notifications
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
          <FiBell style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No Notifications Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            You will receive instant notifications when peers connect, invite you to projects, or share resources.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((notif) => {
            const senderName = notif.sender?.name || 'ConnectCraft System';
            const initials = senderName.split(' ').map((n) => n[0]).join('').toUpperCase();

            return (
              <div key={notif._id} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.25rem', border: '1px solid var(--border-color)' }}>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                  {/* Sender Avatar */}
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)', overflow: 'hidden', flexShrink: 0 }}>
                    {notif.senderProfile?.profilePhoto ? (
                      <img src={notif.senderProfile.profilePhoto} alt={senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Content details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
                        {getNotificationIcon(notif.type)}
                      </span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{notif.title}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {notif.message}
                    </p>

                    {/* Navigation Link shortcuts if referenceId exists */}
                    {notif.type.includes('project') && (
                      <Link to="/projects" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, display: 'inline-block', marginTop: '0.5rem' }}>
                        View Projects Workspace →
                      </Link>
                    )}
                    {notif.type.includes('connection') && (
                      <Link to="/connections" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, display: 'inline-block', marginTop: '0.5rem' }}>
                        View Connections →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Delete single notification button */}
                <button
                  onClick={() => deleteNotification(notif._id)}
                  className="stat-icon-btn"
                  style={{ color: 'var(--text-muted)', fontSize: '1.1rem', padding: '0.2rem' }}
                  title="Delete Notification"
                >
                  <FiX />
                </button>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Notifications;
