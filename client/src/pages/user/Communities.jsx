import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  FiSearch, 
  FiPlus, 
  FiUsers, 
  FiTrendingUp, 
  FiClock, 
  FiAward, 
  FiEye, 
  FiLock,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/communities.css';
import '../../styles/user/discover.css';

const Communities = () => {
  // Search parameters states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Loading & Data states
  const [loading, setLoading] = useState(false);
  const [landingLoading, setLandingLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  
  const [landingData, setLandingData] = useState({
    joined: [],
    featured: [],
    newest: [],
    recommended: [],
    categories: [],
  });

  const categoriesList = [
    'Technology', 'Programming', 'Artificial Intelligence', 'Design', 
    'Photography', 'Music', 'Fitness', 'Business', 'Education', 
    'Language Learning', 'Books', 'Gaming', 'Travel', 'Cooking', 'Health'
  ];

  // Debounce query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch landing page feeds
  const fetchLandingData = async () => {
    setLandingLoading(true);
    try {
      const response = await api.get('/communities');
      if (response.data?.status === 'success') {
        setLandingData(response.data.data);
      }
    } catch  {
      // Fail silently or load defaults
    } finally {
      setLandingLoading(false);
    }
  };

  useEffect(() => {
    fetchLandingData();
  }, []);

  // Search communities API
  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const params = {
        q: debouncedQuery,
        sortBy,
        page,
        limit: 9,
      };
      if (selectedCategory) params.category = selectedCategory;

      const response = await api.get('/communities/search', { params });
      if (response.data?.status === 'success') {
        setSearchResults(response.data.communities || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch  {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const isSearching = debouncedQuery.trim() !== '' || selectedCategory !== '';

  useEffect(() => {
    if (isSearching) {
      fetchSearchResults();
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, selectedCategory, sortBy, page, isSearching]);

  // Reset pagination to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, selectedCategory, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedCategory('');
    setSortBy('newest');
    setPage(1);
  };

  const renderCommunityCard = (comm) => {
    return (
      <div key={comm._id} className="hero-feature-card glass" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.75rem', position: 'relative' }}>
        
        {/* Visibility Pill Tag */}
        <span 
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem', 
            fontSize: '0.7rem', 
            backgroundColor: comm.visibility === 'private' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
            color: comm.visibility === 'private' ? 'var(--color-danger)' : 'var(--color-success)', 
            padding: '0.2rem 0.5rem', 
            borderRadius: '6px', 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          {comm.visibility === 'private' ? <FiLock /> : <FiEye />} {comm.visibility}
        </span>

        {/* Card Header (Logo and category) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {comm.logo ? (
              <img src={comm.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              comm.communityName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{comm.communityName}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{comm.category}</span>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minHeight: '38px', marginBottom: '1rem', lineHeight: 1.4 }}>
          {comm.description.length > 90 ? `${comm.description.slice(0, 90)}...` : comm.description}
        </p>

        {/* Tags */}
        <div className="badge-flex" style={{ marginBottom: '1.5rem' }}>
          {comm.tags.slice(0, 3).map(t => (
            <span key={t} className="badge-pill" style={{ fontSize: '0.7rem' }}>{t}</span>
          ))}
        </div>

        {/* Card Footer (Members Count + Action Button) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            👥 {comm.memberCount} members
          </span>
          <Link to={`/communities/${comm.slug}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}>
            Open Space
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Header Section */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Communities</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Collaborate with peers, share resources, and teach topics.</p>
          </div>
          <Link to="/communities/create" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontWeight: 600 }}>
            <FiPlus /> Create Community
          </Link>
        </div>

        {/* Global Search & Search Select Category Filter */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.95rem' }}
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="filter-select"
            style={{ padding: '0.85rem' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* DUAL WORKSPACE STATES */}
      {!isSearching ? (
        // STATE A: Communities Home Feed Dashboard
        landingLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Joined Communities */}
            {landingData.joined?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiUsers style={{ color: 'var(--color-primary)' }} /> My Communities
                </h2>
                <div className="communities-grid">
                  {landingData.joined.map((comm) => renderCommunityCard(comm))}
                </div>
              </div>
            )}

            {/* Recommended Communities */}
            {landingData.recommended?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiAward style={{ color: 'var(--color-accent)' }} /> Recommended Communities
                </h2>
                <div className="communities-grid">
                  {landingData.recommended.map((comm) => renderCommunityCard(comm))}
                </div>
              </div>
            )}

            {/* Featured Communities */}
            {landingData.featured?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiTrendingUp style={{ color: 'var(--color-secondary)' }} /> Featured Communities
                </h2>
                <div className="communities-grid">
                  {landingData.featured.map((comm) => renderCommunityCard(comm))}
                </div>
              </div>
            )}

            {/* Newest Communities */}
            {landingData.newest?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiClock style={{ color: 'var(--color-success)' }} /> Newest Spaces
                </h2>
                <div className="communities-grid">
                  {landingData.newest.map((comm) => renderCommunityCard(comm))}
                </div>
              </div>
            )}

          </div>
        )
      ) : (
        // STATE B: Search Results Feed
        <div className="search-layout" style={{ marginTop: 0 }}>
          
          {/* Filters Column */}
          <aside className="filter-sidebar glass" style={{ display: 'flex' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Sort & Filter</h3>
              <button 
                type="button" 
                onClick={handleResetFilters} 
                style={{ fontSize: '0.8rem', color: 'var(--color-primary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Reset
              </button>
            </div>
            
            <div className="filter-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Sort By</label>
              <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest Created</option>
                <option value="most_members">Popular (Members count)</option>
                <option value="alphabetical">Alphabetical (A-Z)</option>
              </select>
            </div>
          </aside>

          {/* Search Results Column */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>No Communities Found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Try searching different tag categories or name queries.</p>
                <button className="btn-primary" onClick={handleResetFilters} style={{ padding: '0.55rem 1.25rem', marginTop: '1.5rem', fontSize: '0.85rem' }}>Reset Filters</button>
              </div>
            ) : (
              <>
                <div className="communities-grid">
                  {searchResults.map((comm) => renderCommunityCard(comm))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '2rem' }}>
                    <button
                      className="nav-icon-badge-btn"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                    >
                      <FiChevronLeft />
                    </button>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="nav-icon-badge-btn"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}

      {/* Grid styles inside detail layout */}
      <style>{`
        @media (max-width: 768px) {
          .nav-search-bar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Communities;
