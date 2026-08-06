import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ConnectionModal from '../../components/shared/ConnectionModal';
import LevelBadge from '../../components/shared/LevelBadge';
import { getAvatarUrl, getInitials } from '../../utils/avatar';
import { 
  Users, 
  Code, 
  BookOpen, 
  Calendar, 
  UserPlus, 
  ArrowRight,
  ExternalLink,
  Award,
  MapPin,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import '../../styles/user/dashboard.css';
import '../../styles/user/profile.css';
import '../../styles/shared/cards.css';
import '../../styles/shared/buttons.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [comms, setComms] = useState({ joined: [], recommended: [], newest: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [projectsData, setProjectsData] = useState({ discover: [], owned: [], joined: [], pendingInvitations: [] });
  const [trendingResources, setTrendingResources] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);
  const [upcomingWorkshops, setUpcomingWorkshops] = useState([]);
  const [impactSummary, setImpactSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState({ id: '', name: '' });

  const fetchDashboardData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/profile/me'),
        api.get('/communities'),
        api.get('/connections/suggestions'),
        api.get('/connections/pending'),
        api.get('/connections'),
        api.get('/projects/my'),
        api.get('/projects/discover?limit=4'),
        api.get('/resources/trending'),
        api.get('/conversations'),
        api.get('/workshops'),
        api.get('/impact/me'),
      ]);

      const [
        profileRes,
        commsRes,
        suggestionsRes,
        pendingRes,
        connRes,
        myProjRes,
        discoverProjRes,
        trendingRes,
        convsRes,
        workshopsRes,
        impactRes
      ] = results;

      if (profileRes.status === 'fulfilled' && profileRes.value.data?.status === 'success') {
        setProfile(profileRes.value.data.profile);
      }
      if (commsRes.status === 'fulfilled' && commsRes.value.data?.status === 'success') {
        setComms({
          joined: commsRes.value.data.data?.joined || [],
          recommended: commsRes.value.data.data?.recommended || commsRes.value.data.recommended || [],
          newest: commsRes.value.data.data?.newest || commsRes.value.data.newest || [],
        });
      }
      if (suggestionsRes.status === 'fulfilled' && suggestionsRes.value.data?.status === 'success') {
        setSuggestions(suggestionsRes.value.data.suggestions || []);
      }
      if (pendingRes.status === 'fulfilled' && pendingRes.value.data?.status === 'success') {
        setPendingRequests(pendingRes.value.data.requests || []);
      }
      if (connRes.status === 'fulfilled' && connRes.value.data?.status === 'success') {
        setConnectionsCount((connRes.value.data.connections || []).length);
      }

      const owned = (myProjRes.status === 'fulfilled' && myProjRes.value.data?.data?.owned) || [];
      const joined = (myProjRes.status === 'fulfilled' && myProjRes.value.data?.data?.joined) || [];
      const pendingInvitations = (myProjRes.status === 'fulfilled' && myProjRes.value.data?.data?.pendingInvitations) || [];
      const discover = (discoverProjRes.status === 'fulfilled' && discoverProjRes.value.data?.projects) || [];

      setProjectsData({ owned, joined, pendingInvitations, discover });

      if (trendingRes.status === 'fulfilled' && trendingRes.value.data?.status === 'success') {
        setTrendingResources(trendingRes.value.data.resources || []);
      }
      if (convsRes.status === 'fulfilled' && convsRes.value.data?.status === 'success') {
        setRecentConversations(convsRes.value.data.conversations || []);
      }
      if (workshopsRes.status === 'fulfilled' && workshopsRes.value.data?.status === 'success') {
        setUpcomingWorkshops(workshopsRes.value.data.workshops || []);
      }
      if (impactRes.status === 'fulfilled' && impactRes.value.data?.status === 'success') {
        setImpactSummary(impactRes.value.data.impact);
      }
    } catch  {
      setError('Could not retrieve dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAcceptRequest = async (reqId) => {
    try {
      const res = await api.post(`/connections/accept/${reqId}`);
      if (res.data?.status === 'success') {
        toast.success('Connection request accepted!');
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Error accepting connection request.');
    }
  };

  const handleRejectRequest = async (reqId) => {
    try {
      const res = await api.post(`/connections/reject/${reqId}`);
      if (res.data?.status === 'success') {
        toast.info('Connection request declined.');
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Error rejecting connection request.');
    }
  };

  const triggerConnectModal = (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    setModalOpen(true);
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-section)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const impactPoints = impactSummary?.impactScore || profile?.impactScore || profile?.reputation || 0;

  return (
    <div className="dashboard-container">
      
      {/* HEADER BANNER CARD */}
      <div className="card dashboard-header-card">
        <div className="dashboard-header-inner">
          <div className="dashboard-header-content">
            <div className="badge-pill" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
              <Sparkles style={{ width: '14px', height: '14px' }} /> Collaborative Learning Space
            </div>
            <h1 className="text-section-title" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
              {getGreeting()}, {user?.name.split(' ')[0]} 👋
            </h1>
            <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: '1rem', maxWidth: '640px' }}>
              {profile?.headline || 'Welcome to your ConnectCraft workspace. Connect with peers, share skills, and build real projects together.'}
            </p>
            <div className="dashboard-header-meta">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }} />
                {profile?.location || 'Location not set'}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                <Award style={{ width: '14px', height: '14px' }} />
                {impactPoints} Impact Points
              </span>
              <span>•</span>
              <Link to="/connections" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users style={{ width: '14px', height: '14px' }} />
                {connectionsCount} Connections
              </Link>
            </div>
          </div>

          {/* User Profile Avatar */}
          <div className="dashboard-header-avatar">
            {profile?.profilePhoto ? (
              <img src={getAvatarUrl(profile.profilePhoto)} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(user?.name)
            )}
          </div>
        </div>

        {/* Profile Completion Alert */}
        {profile && profile.profileCompletion < 100 && (
          <div className="dashboard-progress-box">
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-primary)' }}>Profile Setup Progress</span>
                <span style={{ color: 'var(--color-primary)' }}>{profile.profileCompletion}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-section)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${profile.profileCompletion}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
            <Link to="/profile/edit" className="btn btn-primary btn-sm">
              Complete Profile <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Link>
          </div>
        )}
      </div>

      {/* QUICK STATISTICS ROW */}
      <div className="dashboard-stats-grid">
        <div className="card dashboard-stat-card">
          <div className="dashboard-stat-title">Impact Points</div>
          <div className="dashboard-stat-value" style={{ color: 'var(--color-accent)' }}>{impactPoints} pts</div>
        </div>

        <div className="card dashboard-stat-card">
          <div className="dashboard-stat-title">Active Collaborations</div>
          <div className="dashboard-stat-value" style={{ color: 'var(--color-primary)' }}>
            {projectsData.owned.length + projectsData.joined.length} Projects
          </div>
        </div>

        <div className="card dashboard-stat-card">
          <div className="dashboard-stat-title">Communities Joined</div>
          <div className="dashboard-stat-value" style={{ color: 'var(--color-primary)' }}>
            {comms.joined.length} Spaces
          </div>
        </div>

        <div className="card dashboard-stat-card">
          <div className="dashboard-stat-title">Connections</div>
          <div className="dashboard-stat-value" style={{ color: 'var(--color-primary)' }}>{connectionsCount} Peers</div>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="text-card-title" style={{ marginBottom: '0.75rem' }}>Quick Actions</h2>
        <div className="dashboard-actions-grid">
          <Link to="/communities/create" className="btn btn-secondary dashboard-action-card">
            <Users style={{ width: '20px', height: '20px', color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textAlign: 'center' }}>Create Community</span>
          </Link>

          <Link to="/projects/create" className="btn btn-secondary dashboard-action-card">
            <Code style={{ width: '20px', height: '20px', color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textAlign: 'center' }}>Create Project</span>
          </Link>

          <Link to="/resources/create" className="btn btn-secondary dashboard-action-card">
            <BookOpen style={{ width: '20px', height: '20px', color: 'var(--color-accent)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textAlign: 'center' }}>Share Resource</span>
          </Link>

          <Link to="/workshops/create" className="btn btn-secondary dashboard-action-card">
            <Calendar style={{ width: '20px', height: '20px', color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textAlign: 'center' }}>Host Workshop</span>
          </Link>

          <Link to="/connections" className="btn btn-secondary dashboard-action-card">
            <UserPlus style={{ width: '20px', height: '20px', color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textAlign: 'center' }}>Find Connections</span>
          </Link>
        </div>
      </div>

      {/* MAIN CONTENT GRID (8 COLS LEFT / 4 COLS RIGHT ON DESKTOP) */}
      <div className="dashboard-main-grid">
        
        {/* LEFT COLUMN: Main Workspaces */}
        <div className="dashboard-main-col">
              {/* WIDGET 1: COMMUNITIES WORKSPACE */}
          <div className="card">
            <div className="dashboard-section-header">
              <h3 className="text-card-title">Communities Workspace</h3>
              <Link to="/communities" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>Explore All</Link>
            </div>

            {comms.joined.length === 0 && comms.recommended.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: 'var(--bg-section)', borderRadius: 'var(--radius-input)' }}>
                <Users style={{ width: '32px', height: '32px', color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <p className="text-body" style={{ marginBottom: '1rem' }}>No communities joined yet. Connect with tech spaces to share knowledge!</p>
                <Link to="/communities" className="btn btn-primary btn-sm btn-mobile-full">Explore Communities</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(comms.joined.length > 0 ? comms.joined : comms.recommended).slice(0, 3).map((comm) => (
                  <div key={comm._id} className="dashboard-list-item">
                    <div className="dashboard-list-item-content">
                      <div className="dashboard-list-item-title">{comm.communityName}</div>
                      <div className="dashboard-list-item-sub">{comm.category} • {comm.memberCount || comm.members?.length || 0} Members</div>
                    </div>
                    <Link to={`/communities/${comm.slug}`} className="btn btn-secondary btn-sm btn-mobile-full">Open Space</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WIDGET 2: PROJECTS WORKSPACE */}
          <div className="card">
            <div className="dashboard-section-header">
              <h3 className="text-card-title">Active Projects</h3>
              <Link to="/projects" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>Browse Projects</Link>
            </div>

            {projectsData.owned.length === 0 && projectsData.joined.length === 0 && projectsData.discover.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: 'var(--bg-section)', borderRadius: 'var(--radius-input)' }}>
                <Code style={{ width: '32px', height: '32px', color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <p className="text-body" style={{ marginBottom: '1rem' }}>No active projects yet. Start a software project or join open teams!</p>
                <Link to="/projects/create" className="btn btn-primary btn-sm btn-mobile-full">Create Project</Link>
              </div>
            ) : (
              <div className="dashboard-card-grid-2col">
                {(projectsData.owned.length > 0 ? projectsData.owned : projectsData.discover).slice(0, 2).map((proj) => (
                  <div key={proj._id} style={{ padding: '1.15rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-input)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge-pill" style={{ fontSize: '0.65rem' }}>{proj.category}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>{proj.status}</span>
                    </div>
                    <div className="dashboard-project-title" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{proj.title}</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.35, minHeight: '34px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{proj.shortDescription}</p>
                    <Link to={`/projects/${proj._id}`} className="btn btn-secondary btn-sm btn-mobile-full" style={{ marginTop: 'auto' }}>
                      View Project <ExternalLink style={{ width: '12px', height: '12px' }} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WIDGET 3: KNOWLEDGE RESOURCES */}
          <div className="card">
            <div className="dashboard-section-header">
              <h3 className="text-card-title">Trending Resources</h3>
              <Link to="/resources" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>Knowledge Library</Link>
            </div>

            {trendingResources.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: 'var(--bg-section)', borderRadius: 'var(--radius-input)' }}>
                <BookOpen style={{ width: '32px', height: '32px', color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <p className="text-body" style={{ marginBottom: '1rem' }}>No shared resources yet. Publish documentation, tutorials, or repos!</p>
                <Link to="/resources/create" className="btn btn-primary btn-sm btn-mobile-full">Share Resource</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {trendingResources.slice(0, 3).map((res) => (
                  <div key={res._id} className="dashboard-list-item">
                    <div className="dashboard-list-item-content">
                      <div className="dashboard-list-item-title">{res.title}</div>
                      <div className="dashboard-list-item-sub">{res.category} • {res.resourceType}</div>
                    </div>
                    <Link to={`/resources/${res._id}`} className="btn btn-secondary btn-sm btn-mobile-full">View Resource</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WIDGET 4: WORKSHOPS & EVENTS */}
          <div className="card">
            <div className="dashboard-section-header">
              <h3 className="text-card-title">Upcoming Workshops</h3>
              <Link to="/workshops" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>Events Space</Link>
            </div>

            {upcomingWorkshops.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: 'var(--bg-section)', borderRadius: 'var(--radius-input)' }}>
                <Calendar style={{ width: '32px', height: '32px', color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <p className="text-body" style={{ marginBottom: '1rem' }}>No workshops scheduled yet. Host live sync sessions with peers!</p>
                <Link to="/workshops/create" className="btn btn-primary btn-sm btn-mobile-full">Host Workshop</Link>
              </div>
            ) : (
              <div className="dashboard-card-grid-2col">
                {upcomingWorkshops.slice(0, 2).map((ws) => (
                  <div key={ws._id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-input)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-primary)', fontWeight: 700 }}>{new Date(ws.date).toLocaleDateString()}</div>
                    <div className="dashboard-workshop-title" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{ws.title}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Host: {ws.host?.name || 'Peer Host'}</div>
                    <Link to={`/workshops/${ws._id}`} className="btn btn-secondary btn-sm btn-mobile-full" style={{ marginTop: 'auto' }}>
                      Event Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar Metric & Activity Widgets */}
        <div className="dashboard-side-col">
          
          {/* WIDGET 1: RECENT MESSAGES */}
          <div className="card">
            <div className="dashboard-section-header">
              <h3 className="text-card-title" style={{ fontSize: '0.95rem' }}>Recent Messages</h3>
              <Link to="/messages" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Open Chat</Link>
            </div>

            {recentConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No recent conversations. Connect and chat with peers!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {recentConversations.slice(0, 3).map((conv) => (
                  <Link
                    key={conv._id}
                    to={`/messages?userId=${conv.peer?._id}`}
                    style={{ textDecoration: 'none', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--bg-section)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {conv.peer?.profilePhoto ? (
                        <img src={getAvatarUrl(conv.peer.profilePhoto)} alt={conv.peer?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(conv.peer?.name)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.peer?.name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.lastMessage || 'Start conversation...'}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* WIDGET 2: PENDING CONNECTION REQUESTS */}
          <div className="card">
            <div className="dashboard-section-header">
              <h3 className="text-card-title" style={{ fontSize: '0.95rem' }}>Pending Requests ({pendingRequests.length})</h3>
              <Link to="/connections" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Manage</Link>
            </div>

            {pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No pending connection requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {pendingRequests.slice(0, 3).map((req) => (
                  <div key={req._id} style={{ padding: '0.65rem', borderRadius: 'var(--radius-input)', backgroundColor: 'var(--bg-section)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{req.sender?.name}</span>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => handleAcceptRequest(req._id)} className="btn btn-primary btn-sm" style={{ padding: '0.2rem 0.45rem', fontSize: '0.65rem' }}>
                          <Check style={{ width: '12px', height: '12px' }} />
                        </button>
                        <button onClick={() => handleRejectRequest(req._id)} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.45rem', fontSize: '0.65rem', color: 'var(--color-danger)' }}>
                          <X style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WIDGET 3: IMPACT & RECOGNITION */}
          <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <div className="dashboard-section-header">
              <h3 className="text-card-title" style={{ fontSize: '0.95rem' }}>Impact & Recognition</h3>
              <Link to="/impact" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Space →</Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Status:</span>
              <LevelBadge level={impactSummary?.levelInfo?.currentLevel || profile?.level || 'Explorer'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Progress to {impactSummary?.levelInfo?.nextLevel || 'Next Level'}</span>
                <span><strong>{impactSummary?.levelInfo?.progressPercent || 0}%</strong></span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-section)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${impactSummary?.levelInfo?.progressPercent || 0}%`, height: '100%', backgroundColor: 'var(--color-primary)' }}></div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Connection Request Modal */}
      <ConnectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        recipientId={selectedUser.id}
        recipientName={selectedUser.name}
        onSuccess={fetchDashboardData}
      />

    </div>
  );
};

export default Dashboard;
