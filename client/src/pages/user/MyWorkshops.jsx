import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  FiCalendar, 
  FiClock, 
  FiArrowLeft,
  FiPlus
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/workshops.css';

const MyWorkshops = () => {
  const [activeTab, setActiveTab] = useState('hosting');
  const [data, setData] = useState({ hosting: [], registered: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyWorkshops = async () => {
    setLoading(true);
    try {
      const response = await api.get('/workshops/my');
      if (response.data?.status === 'success') {
        setData(response.data.data);
      }
    } catch  {
      setError('Failed to load user workshops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWorkshops();
  }, []);

  const list = activeTab === 'hosting' ? data.hosting : data.registered;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/workshops" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <FiArrowLeft /> Back to Workshops Discovery
        </Link>
        <Link to="/workshops/create" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          + Organize Event
        </Link>
      </div>

      <div className="glass" style={{ padding: '1.75rem 2rem', borderRadius: 'var(--border-radius-lg)', borderLeft: '4px solid var(--color-primary)' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Workshops & Events</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          Manage your organized sessions and track workshops you are registered to attend.
        </p>
      </div>

      {/* Tabs bar */}
      <div className="detail-tabs-bar">
        <button className={`detail-tab-btn ${activeTab === 'hosting' ? 'active' : ''}`} onClick={() => setActiveTab('hosting')}>
          Hosting ({data.hosting.length})
        </button>
        <button className={`detail-tab-btn ${activeTab === 'registered' ? 'active' : ''}`} onClick={() => setActiveTab('registered')}>
          Registered ({data.registered.length})
        </button>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : list.length === 0 ? (
        <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
          <FiCalendar style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No Workshops Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {activeTab === 'hosting' ? 'You have not organized any workshops yet.' : 'You have not registered for any upcoming workshops.'}
          </p>
          <Link to="/workshops" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block', fontSize: '0.85rem' }}>
            Discover Workshops
          </Link>
        </div>
      ) : (
        <div className="workshop-grid">
          {list.map((ws) => (
            <div key={ws._id} className="workshop-card">
              {ws.bannerImage ? (
                <img src={ws.bannerImage} alt={ws.title} className="workshop-banner-hero" />
              ) : (
                <div className="workshop-banner-placeholder">
                  <FiCalendar />
                </div>
              )}

              <div className="workshop-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge-pill" style={{ fontSize: '0.65rem' }}>{ws.eventType}</span>
                  <span className="calendar-badge"><FiCalendar /> {new Date(ws.date).toLocaleDateString()}</span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{ws.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ws.shortDescription}</p>

                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span><FiClock /> {ws.startTime} - {ws.endTime}</span>
                  <span><strong>Mode:</strong> {ws.mode}</span>
                </div>

                <Link to={`/workshops/${ws._id}`} className="btn-secondary" style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.8rem', padding: '0.45rem' }}>
                  Open Event Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MyWorkshops;
