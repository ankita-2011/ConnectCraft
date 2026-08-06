import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getInitials } from '../../utils/avatar';
import { 
  FiSearch, 
  FiPlus, 
  FiCode, 
  FiClock, 
  FiCheck, 
  FiX, 
  FiChevronLeft, 
  FiChevronRight,
  FiCompass
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/projects.css';
import { useToast } from '../../context/ToastContext';

const Projects = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('discover');
  
  // Discover tab states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    status: '',
    skill: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [discoverProjects, setDiscoverProjects] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);

  // My Projects tab data states
  const [myProjectsData, setMyProjectsData] = useState({
    owned: [],
    joined: [],
    pendingInvitations: [],
    sentInvitations: [],
    completed: [],
  });
  const [myLoading, setMyLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch discover projects
  const fetchDiscoverProjects = async () => {
    setDiscoverLoading(true);
    setError('');
    try {
      const params = {
        q: debouncedQuery,
        page,
        limit: 9,
      };
      if (filters.category) params.category = filters.category;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.status) params.status = filters.status;
      if (filters.skill) params.skill = filters.skill;

      const response = await api.get('/projects/discover', { params });
      if (response.data?.status === 'success') {
        setDiscoverProjects(response.data.projects || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch  {
      setError('Failed to retrieve discover projects.');
    } finally {
      setDiscoverLoading(false);
    }
  };

  // Fetch user projects
  const fetchMyProjectsData = async () => {
    setMyLoading(true);
    setError('');
    try {
      const response = await api.get('/projects/my');
      if (response.data?.status === 'success') {
        setMyProjectsData(response.data.data);
      }
    } catch  {
      setError('Failed to retrieve user projects.');
    } finally {
      setMyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchDiscoverProjects();
    } else {
      fetchMyProjectsData();
    }
  }, [activeTab, debouncedQuery, filters, page]);

  // Reset page pagination when search parameters modify
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filters]);

  // Invitation handlers
  const handleAcceptInvite = async (invId) => {
    try {
      const res = await api.post(`/project-invitations/${invId}/accept`);
      if (res.data?.status === 'success') {
        toast.success('Project invitation accepted!');
        fetchMyProjectsData();
      }
    } catch (err) {
      toast.error(err.message || 'Error accepting project invitation.');
    }
  };

  const handleRejectInvite = async (invId) => {
    try {
      const res = await api.post(`/project-invitations/${invId}/reject`);
      if (res.data?.status === 'success') {
        toast.info('Project invitation declined.');
        fetchMyProjectsData();
      }
    } catch (err) {
      toast.error(err.message || 'Error rejecting invitation.');
    }
  };

  const handleCancelInvite = async (invId) => {
    try {
      const res = await api.post(`/project-invitations/${invId}/cancel`);
      if (res.data?.status === 'success') {
        toast.info('Project invitation cancelled.');
        fetchMyProjectsData();
      }
    } catch (err) {
      toast.error(err.message || 'Error cancelling invitation.');
    }
  };

  const categories = [
    'Web Development',
    'Mobile Development',
    'AI / Machine Learning',
    'Data Science',
    'Cyber Security',
    'Blockchain',
    'UI / UX',
    'Game Development',
    'Cloud Computing',
    'Research',
    'Hackathon',
    'Open Source',
    'Other',
  ];

  const renderProjectCard = (project) => {
    const ownerName = project.owner?.name || 'Project Owner';
    const initials = getInitials(ownerName);
    const statusClass = (project.status || 'recruiting').toLowerCase().replace(' ', '-');
    const difficultyClass = (project.difficulty || 'intermediate').toLowerCase();

    return (
      <div key={project._id} className="project-card">
        {/* Banner Section */}
        <div className="project-banner-wrapper">
          {project.bannerImage ? (
            <img src={project.bannerImage} alt={project.title} className="project-banner-img" />
          ) : (
            <div className="project-banner-placeholder">
              <FiCode />
            </div>
          )}
          <span className={`project-status-badge ${statusClass}`}>{project.status}</span>
        </div>

        {/* Card Body */}
        <div className="project-card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span className="badge-pill" style={{ fontSize: '0.7rem' }}>{project.category}</span>
            <span className={`project-difficulty-tag ${difficultyClass}`}>{project.difficulty}</span>
          </div>

          <h3 className="project-title">{project.title}</h3>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, height: '40px', overflow: 'hidden' }}>
            {project.shortDescription}
          </p>

          <div className="project-owner-meta">
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {initials}
            </div>
            <span>{ownerName}</span>
          </div>

          {/* Required Skills */}
          {project.requiredSkills?.length > 0 && (
            <div className="badge-flex">
              {project.requiredSkills.slice(0, 3).map((skill) => (
                <span key={skill} className="badge-pill teach" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                  {skill}
                </span>
              ))}
              {project.requiredSkills.length > 3 && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{project.requiredSkills.length - 3}</span>
              )}
            </div>
          )}

          {/* Meta footer details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <span className="open-positions-pill">
              👥 {project.openPositions !== undefined ? project.openPositions : Math.max(0, project.teamSize - (project.memberCount || 1))} Open ({project.memberCount || 1}/{project.teamSize})
            </span>
            
            <Link to={`/projects/${project._id}`} className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
              View Details
            </Link>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header section */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Project Collaboration Workspace</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Build software, AI & design projects with peer developers across ConnectCraft.
          </p>
        </div>
        <Link to="/projects/create" className="btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <FiPlus /> Create Project
        </Link>
      </div>

      {/* Tabs bar */}
      <div className="detail-tabs-bar">
        <button className={`detail-tab-btn ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>
          Discover Projects
        </button>
        <button className={`detail-tab-btn ${activeTab === 'my-projects' ? 'active' : ''}`} onClick={() => setActiveTab('my-projects')}>
          My Projects ({myProjectsData.owned.length + myProjectsData.joined.length})
        </button>
        <button className={`detail-tab-btn ${activeTab === 'pending-invitations' ? 'active' : ''}`} onClick={() => setActiveTab('pending-invitations')}>
          Pending Invitations ({myProjectsData.pendingInvitations.length})
        </button>
        <button className={`detail-tab-btn ${activeTab === 'sent-invitations' ? 'active' : ''}`} onClick={() => setActiveTab('sent-invitations')}>
          Sent Invitations ({myProjectsData.sentInvitations.length})
        </button>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      {/* Discover Projects */}
      {activeTab === 'discover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Search & Filters Controls */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: 'var(--border-radius-md)', fontSize: '0.95rem' }}
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <select
                className="filter-select"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                className="filter-select"
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              >
                <option value="">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <select
                className="filter-select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="Recruiting">Recruiting</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>

              <input
                type="text"
                className="filter-input"
                placeholder="Filter by skill..."
                value={filters.skill}
                onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
              />
            </div>
          </div>

          {/* Results Grid */}
          {discoverLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : discoverProjects.length === 0 ? (
            <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
              <FiCompass style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>No Projects Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Try refining your search terms or filter selections.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {discoverProjects.map((project) => renderProjectCard(project))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                  <button
                    className="nav-icon-badge-btn"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  >
                    <FiChevronLeft />
                  </button>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="nav-icon-badge-btn"
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* My Projects */}
      {activeTab === 'my-projects' && (
        myLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Owned Projects Section */}
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>Owned Projects ({myProjectsData.owned.length})</h2>
              {myProjectsData.owned.length === 0 ? (
                <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>You haven't created any projects yet.</p>
                  <Link to="/projects/create" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block', fontSize: '0.85rem' }}>
                    Create First Project
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {myProjectsData.owned.map((project) => renderProjectCard(project))}
                </div>
              )}
            </div>

            {/* Joined Projects Section */}
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>Joined Collaborations ({myProjectsData.joined.length})</h2>
              {myProjectsData.joined.length === 0 ? (
                <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>You haven't joined any team projects yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {myProjectsData.joined.map((project) => renderProjectCard(project))}
                </div>
              )}
            </div>

            {/* Completed Projects Section */}
            {myProjectsData.completed?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>Completed Projects ({myProjectsData.completed.length})</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {myProjectsData.completed.map((project) => renderProjectCard(project))}
                </div>
              </div>
            )}

          </div>
        )
      )}

      {/* Pending Invitations */}
      {activeTab === 'pending-invitations' && (
        myLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : myProjectsData.pendingInvitations.length === 0 ? (
          <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
            <FiClock style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No Pending Project Invitations</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>You have no pending invitations to join teams.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            {myProjectsData.pendingInvitations.map((inv) => {
              const senderName = inv.sender?.name || 'Explorer';
              const project = inv.project || {};

              return (
                <div key={inv._id} className="request-review-card glass">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span className="badge-pill teach" style={{ fontSize: '0.7rem', marginBottom: '0.5rem', display: 'inline-block' }}>{project.category}</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{project.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Invited by <strong>{senderName}</strong></p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => handleAcceptInvite(inv._id)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FiCheck /> Accept
                      </button>
                      <button onClick={() => handleRejectInvite(inv._id)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FiX /> Reject
                      </button>
                    </div>
                  </div>

                  {inv.message && (
                    <div className="request-message-box">
                      "{inv.message}"
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Link to={`/projects/${project._id}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Inspect Project Details →</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Sent Invitations */}
      {activeTab === 'sent-invitations' && (
        myLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : myProjectsData.sentInvitations.length === 0 ? (
          <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
            <FiClock style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No Sent Project Invitations</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>You have no active pending invitations sent to connections.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            {myProjectsData.sentInvitations.map((inv) => {
              const receiverName = inv.receiver?.name || 'Explorer';
              const project = inv.project || {};

              return (
                <div key={inv._id} className="request-review-card glass">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{project.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Sent to <strong>{receiverName}</strong></p>
                    </div>

                    <button onClick={() => handleCancelInvite(inv._id)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                      Cancel Invitation
                    </button>
                  </div>

                  {inv.message && (
                    <div className="request-message-box">
                      "{inv.message}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

    </div>
  );
};

export default Projects;
