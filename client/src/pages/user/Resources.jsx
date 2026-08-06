import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  FiSearch, 
  FiPlus, 
  FiBookOpen, 
  FiHeart, 
  FiBookmark, 
  FiEye, 
  FiCompass, 
  FiChevronLeft, 
  FiChevronRight,
  FiCode,
  FiVideo,
  FiFileText,
  FiGlobe,
  FiFigma,
  FiFolder
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/projects.css';
import '../../styles/user/resources.css';
import '../../styles/user/auth.css';

const Resources = () => {
  const [activeTab, setActiveTab] = useState('discover');
  
  // Discover feed states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    resourceType: '',
    skillTag: '',
    sortBy: 'newest',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [discoverResources, setDiscoverResources] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);

  // My Shared and Bookmarks states
  const [myShared, setMyShared] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch discover resources
  const fetchDiscoverResources = async () => {
    setDiscoverLoading(true);
    setError('');
    try {
      const params = {
        q: debouncedQuery,
        sortBy: filters.sortBy,
        page,
        limit: 9,
      };
      if (filters.category) params.category = filters.category;
      if (filters.resourceType) params.resourceType = filters.resourceType;
      if (filters.skillTag) params.skillTag = filters.skillTag;

      const response = await api.get('/resources', { params });
      if (response.data?.status === 'success') {
        setDiscoverResources(response.data.resources || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch  {
      setError('Could not retrieve resources feed.');
    } finally {
      setDiscoverLoading(false);
    }
  };

  // Fetch tab data
  const fetchTabData = async () => {
    setTabLoading(true);
    setError('');
    try {
      if (activeTab === 'my-shared') {
        const res = await api.get('/resources', { params: { limit: 50 } });
        if (res.data?.status === 'success') {
          setMyShared((res.data.resources || []).filter((r) => r.isCreator));
        }
      } else if (activeTab === 'saved-bookmarks') {
        const res = await api.get('/resources/bookmarks');
        if (res.data?.status === 'success') {
          setBookmarks(res.data.bookmarks || []);
        }
      }
    } catch  {
      setError('Could not retrieve tab resources.');
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchDiscoverResources();
    } else {
      fetchTabData();
    }
  }, [activeTab, debouncedQuery, filters, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filters]);

  // Interaction handlers (Like & Bookmark)
  const handleToggleLike = async (e, resourceId, isLiked) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const endpoint = `/resources/${resourceId}/like`;
      const res = isLiked ? await api.delete(endpoint) : await api.post(endpoint);
      if (res.data?.status === 'success') {
        // Update local state
        const updateList = (list) =>
          list.map((r) =>
            r._id === resourceId
              ? { ...r, isLiked: !isLiked, likesCount: res.data.likesCount }
              : r
          );
        setDiscoverResources(updateList);
        setMyShared(updateList);
        setBookmarks(updateList);
      }
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  };

  const handleToggleBookmark = async (e, resourceId, isBookmarked) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const endpoint = `/resources/${resourceId}/bookmark`;
      const res = isBookmarked ? await api.delete(endpoint) : await api.post(endpoint);
      if (res.data?.status === 'success') {
        const updateList = (list) =>
          list.map((r) =>
            r._id === resourceId
              ? { ...r, isBookmarked: !isBookmarked, bookmarksCount: res.data.bookmarksCount }
              : r
          );
        setDiscoverResources(updateList);
        setMyShared(updateList);
        if (isBookmarked && activeTab === 'saved-bookmarks') {
          setBookmarks((prev) => prev.filter((r) => r._id !== resourceId));
        } else {
          setBookmarks(updateList);
        }
      }
    } catch (err) {
      console.error('Bookmark toggle error:', err);
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
    'Other',
  ];

  const resourceTypes = [
    'Article',
    'GitHub Repository',
    'YouTube Video',
    'Website',
    'Documentation',
    'Research Paper',
    'Course',
    'Figma Design',
    'Google Drive',
    'Other',
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'GitHub Repository': return <FiCode />;
      case 'YouTube Video': return <FiVideo />;
      case 'Figma Design': return <FiFigma />;
      case 'Google Drive': return <FiFolder />;
      case 'Documentation': case 'Research Paper': return <FiFileText />;
      case 'Website': return <FiGlobe />;
      default: return <FiBookOpen />;
    }
  };

  const renderResourceCard = (res) => {
    const creatorName = res.creator?.name || 'ConnectCraft Creator';
    const initials = creatorName.split(' ').map((n) => n[0]).join('').toUpperCase();

    return (
      <div key={res._id} className="resource-card">
        {/* Thumbnail Section */}
        <div className="resource-thumbnail-wrapper">
          {res.thumbnail ? (
            <img src={res.thumbnail} alt={res.title} className="resource-thumbnail-img" />
          ) : (
            <div className="resource-thumbnail-placeholder">
              {getTypeIcon(res.resourceType)}
            </div>
          )}
          <span className="resource-type-badge">
            {getTypeIcon(res.resourceType)} {res.resourceType}
          </span>
        </div>

        {/* Card Body */}
        <div className="resource-card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge-pill" style={{ fontSize: '0.7rem' }}>{res.category}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(res.createdAt).toLocaleDateString()}</span>
          </div>

          <h3 className="resource-title">{res.title}</h3>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, height: '40px', overflow: 'hidden' }}>
            {res.shortDescription}
          </p>

          <div className="resource-creator-meta">
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {initials}
            </div>
            <span>{creatorName}</span>
          </div>

          {/* Tags */}
          {res.tags?.length > 0 && (
            <div className="badge-flex">
              {res.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="badge-pill teach" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta footer stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            
            <div className="resource-stats-bar">
              <span title="Views" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <FiEye /> {res.views || 0}
              </span>
              <button 
                className={`stat-icon-btn ${res.isLiked ? 'liked' : ''}`} 
                onClick={(e) => handleToggleLike(e, res._id, res.isLiked)}
                title={res.isLiked ? 'Unlike' : 'Like'}
              >
                <FiHeart style={{ fill: res.isLiked ? '#ef4444' : 'none' }} /> {res.likesCount || 0}
              </button>
              <button 
                className={`stat-icon-btn ${res.isBookmarked ? 'bookmarked' : ''}`} 
                onClick={(e) => handleToggleBookmark(e, res._id, res.isBookmarked)}
                title={res.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
              >
                <FiBookmark style={{ fill: res.isBookmarked ? '#facc15' : 'none' }} /> {res.bookmarksCount || 0}
              </button>
            </div>

            <Link to={`/resources/${res._id}`} className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
              View
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
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Knowledge Library & Resources</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Discover and share tech roadmaps, GitHub repos, articles, documentation, and video tutorials.
          </p>
        </div>
        <Link to="/resources/create" className="btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <FiPlus /> Share Resource
        </Link>
      </div>

      {/* Tabs bar */}
      <div className="detail-tabs-bar">
        <button className={`detail-tab-btn ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>
          Discover Resources
        </button>
        <button className={`detail-tab-btn ${activeTab === 'my-shared' ? 'active' : ''}`} onClick={() => setActiveTab('my-shared')}>
          My Shared ({myShared.length})
        </button>
        <button className={`detail-tab-btn ${activeTab === 'saved-bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('saved-bookmarks')}>
          Saved Bookmarks ({bookmarks.length})
        </button>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      {/* Discover Resources */}
      {activeTab === 'discover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Filter Bar */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: 'var(--border-radius-md)', fontSize: '0.95rem' }}
                placeholder="Search resources..."
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
                value={filters.resourceType}
                onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
              >
                <option value="">All Resource Types</option>
                {resourceTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                className="filter-select"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="newest">Newest First</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="most_liked">Most Liked</option>
                <option value="most_bookmarked">Most Bookmarked</option>
              </select>

              <input
                type="text"
                className="filter-input"
                placeholder="Tag filter (e.g. React)"
                value={filters.skillTag}
                onChange={(e) => setFilters({ ...filters, skillTag: e.target.value })}
              />
            </div>
          </div>

          {/* Results Grid */}
          {discoverLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : discoverResources.length === 0 ? (
            <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
              <FiCompass style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>No Resources Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Be the first to share a learning resource!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {discoverResources.map((res) => renderResourceCard(res))}
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

      {/* My Shared Resources */}
      {activeTab === 'my-shared' && (
        tabLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : myShared.length === 0 ? (
          <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
            <FiBookOpen style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No Shared Resources Yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Share articles, repos, or links to help peers learn.</p>
            <Link to="/resources/create" className="btn-primary" style={{ marginTop: '1.25rem', display: 'inline-block', fontSize: '0.85rem' }}>
              Share First Resource
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {myShared.map((res) => renderResourceCard(res))}
          </div>
        )
      )}

      {/* Saved Bookmarks */}
      {activeTab === 'saved-bookmarks' && (
        tabLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
            <FiBookmark style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No Saved Bookmarks</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Bookmark useful resources in the discover feed to view them anytime.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {bookmarks.map((res) => renderResourceCard(res))}
          </div>
        )
      )}

    </div>
  );
};

export default Resources;
