import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FiCalendar, 
  FiClock, 
  FiVideo, 
  FiUsers, 
  FiSearch, 
  FiUser, 
  FiCheckCircle 
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/workshops.css';
import '../../styles/user/auth.css';

const Workshops = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [eventType, setEventType] = useState('');
  const [mode, setMode] = useState('');

  const categoriesList = [
    'Web Development', 'Mobile Development', 'AI / Machine Learning', 
    'Data Science', 'Cyber Security', 'Blockchain', 'UI / UX', 
    'Game Development', 'Cloud Computing', 'Research', 'Other'
  ];

  const eventTypesList = [
    'Workshop', 'Webinar', 'Study Session', 'Project Meeting', 
    'Hackathon', 'AMA', 'Community Meetup', 'Code Review Session', 'Tech Talk', 'Other'
  ];

  const fetchWorkshops = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (eventType) params.eventType = eventType;
      if (mode) params.mode = mode;

      const response = await api.get('/workshops', { params });
      if (response.data?.status === 'success') {
        setWorkshops(response.data.workshops || []);
      }
    } catch  {
      setError('Failed to load workshops feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, [category, eventType, mode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWorkshops();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Hero Header Section */}
      <div className="glass" style={{ padding: '2rem 2.5rem', borderRadius: 'var(--border-radius-lg)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Workshops & Events Space</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Discover tech talks, live webinars, study sessions, and community hackathons.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/workshops/my" className="btn-secondary" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}>
            My Workshops
          </Link>
          <Link to="/workshops/create" className="btn-primary" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}>
            + Organize Event
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </form>

        {/* Category Filter */}
        <select className="filter-select" style={{ fontSize: '0.85rem', width: 'auto' }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categoriesList.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Event Type Filter */}
        <select className="filter-select" style={{ fontSize: '0.85rem', width: 'auto' }} value={eventType} onChange={(e) => setEventType(e.target.value)}>
          <option value="">All Event Types</option>
          {eventTypesList.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Mode Filter */}
        <select className="filter-select" style={{ fontSize: '0.85rem', width: 'auto' }} value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">All Modes</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      {/* Workshops Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : workshops.length === 0 ? (
        <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
          <FiCalendar style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No Workshops Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            No upcoming events match your selected filters. Try resetting filters or organize a workshop!
          </p>
          <Link to="/workshops/create" className="btn-primary" style={{ marginTop: '1.25rem', display: 'inline-block', fontSize: '0.85rem' }}>
            Organize First Event
          </Link>
        </div>
      ) : (
        <div className="workshop-grid">
          {workshops.map((ws) => {
            const hostName = ws.host?.name || 'ConnectCraft Host';
            const availableSeats = ws.availableSeats !== undefined ? ws.availableSeats : (ws.maxParticipants - (ws.registeredCount || 0));

            return (
              <div key={ws._id} className="workshop-card">
                
                {/* Banner Hero */}
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
                    <span className="calendar-badge">
                      <FiCalendar /> {new Date(ws.date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3 }}>{ws.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1 }}>{ws.shortDescription}</p>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Host:</strong> {hostName}</span>
                      <span><strong>Mode:</strong> {ws.mode}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><FiClock /> {ws.startTime} - {ws.endTime}</span>
                      <span><FiUsers /> {availableSeats} Seats Left</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <Link to={`/workshops/${ws._id}`} className="btn-secondary" style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', textAlign: 'center' }}>
                      View Details
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Workshops;
