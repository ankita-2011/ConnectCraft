import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import EmptyState from '../../components/shared/EmptyState';
import ConnectionModal from '../../components/shared/ConnectionModal';
import { 
  FiSearch, 
  FiMapPin, 
  FiBookOpen, 
  FiGrid, 
  FiUsers, 
  FiChevronLeft, 
  FiChevronRight, 
  FiAward,
  FiTrendingUp,
  FiUserPlus
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/discover.css';
import '../../styles/user/connections.css';

const Discover = () => {
  // Modal states for Connect button
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState({ id: '', name: '' });

  // Search parameters states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const [filters, setFilters] = useState({
    skill: '',
    location: '',
    language: '',
    interest: '',
  });

  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Data fetching states
  const [loading, setLoading] = useState(false);
  const [landingLoading, setLandingLoading] = useState(true);

  // Results & Landing data states
  const [profiles, setProfiles] = useState([]);
  const [landingData, setLandingData] = useState({
    trendingSkills: [],
    popularInterests: [],
    featuredUsers: [],
    recentlyJoined: [],
    recommended: [],
  });

  // Debounce search query changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Helper to check if a profile is non-connectable (admin account or non-active status)
  const isNonConnectableProfile = (profile) => {
    const role = profile?.userId?.role;
    const accountStatus = profile?.userId?.accountStatus;
    const isAdmin = role && ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(role);
    const isInactive = accountStatus && accountStatus !== 'active';
    return isAdmin || isInactive;
  };

  // Fetch landing panel feeds on mount
  const fetchLandingData = async () => {
    setLandingLoading(true);
    try {
      const response = await api.get('/discover');
      if (response.data?.status === 'success') {
        const rawData = response.data.data || {};
        setLandingData({
          ...rawData,
          featuredUsers: (rawData.featuredUsers || []).filter((p) => !isNonConnectableProfile(p)),
          recentlyJoined: (rawData.recentlyJoined || []).filter((p) => !isNonConnectableProfile(p)),
          recommended: (rawData.recommended || []).filter((p) => !isNonConnectableProfile(p)),
        });
      }
    } catch  {
      // Quiet fail or placeholder loading handler
    } finally {
      setLandingLoading(false);
    }
  };

  useEffect(() => {
    fetchLandingData();
  }, []);

  // 3. Fetch search results when parameters modify
  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const params = {
        q: debouncedQuery,
        sortBy,
        page,
        limit: 9,
      };
      
      // Attach truthy filters
      if (filters.skill) params.skill = filters.skill;
      if (filters.location) params.location = filters.location;
      if (filters.language) params.language = filters.language;
      if (filters.interest) params.interest = filters.interest;

      const response = await api.get('/discover/search', { params });
      if (response.data?.status === 'success') {
        const rawProfiles = response.data.profiles || [];
        setProfiles(rawProfiles.filter((p) => !isNonConnectableProfile(p)));
        setTotalPages(response.data.totalPages || 1);
      }
    } catch  {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search when query or filters change
  const hasActiveFilters = 
    debouncedQuery.trim() !== '' || 
    Object.values(filters).some((val) => val.trim() !== '');

  useEffect(() => {
    if (hasActiveFilters) {
      fetchSearchResults();
    } else {
      // If search query is cleared, reset page results
      setProfiles([]);
    }
  }, [debouncedQuery, filters, sortBy, page, hasActiveFilters]);

  // Reset page pagination to 1 on parameter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filters, sortBy]);

  // Reset all search states
  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setFilters({
      skill: '',
      location: '',
      language: '',
      interest: '',
    });
    setSortBy('newest');
    setPage(1);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  // Trigger tag click to apply filters
  const applyTagFilter = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const triggerConnectModal = (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    setModalOpen(true);
  };

  const renderProfileCard = (profile) => {
    const name = profile.userId?.name || 'Explorer';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const summary = profile.recommendationSummary;
    const recipientId = profile.userId?._id || profile.userId;

    const hasSummaryContent = summary && (
      (summary.canTeachYou && summary.canTeachYou.length > 0) ||
      (summary.youCanTeach && summary.youCanTeach.length > 0) ||
      (summary.sharedInterests && summary.sharedInterests.length > 0) ||
      (summary.sharedCommunities && summary.sharedCommunities.length > 0)
    );

    return (
      <div key={profile._id} className="hero-feature-card glass" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem 1.5rem', transition: 'all var(--transition-normal)' }}>
        
        {/* Profile Card Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center', marginBottom: '1.25rem', overflow: 'visible', paddingTop: '0.35rem' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 600, fontSize: '1.5rem', color: 'var(--color-primary)', flexShrink: 0 }}>
            {profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{name}</h4>
            <span style={{ color: 'var(--color-primary)', fontSize: '0.825rem', fontWeight: 600, display: 'inline-block', lineHeight: 1.3 }}>@{profile.username}</span>
          </div>
        </div>

        {/* Headline & Location */}
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', minHeight: '38px', marginBottom: '1rem', lineHeight: 1.4 }}>
          {profile.headline || 'ConnectCraft explorer'}
        </p>

        {profile.location && (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <FiMapPin /> {profile.location}
          </span>
        )}

        {/* Structured Match Summary Reasons */}
        {hasSummaryContent && (
          <div className="recom-box" style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            {summary.canTeachYou?.length > 0 && (
              <div style={{ marginBottom: '0.4rem' }}>
                <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.3rem' }}>Can Teach You</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {summary.canTeachYou.slice(0, 3).map(s => <span key={s} style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.2rem 0.55rem', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>)}
                </div>
              </div>
            )}
            {summary.youCanTeach?.length > 0 && (
              <div style={{ marginBottom: '0.4rem' }}>
                <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.3rem' }}>You Can Teach</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {summary.youCanTeach.slice(0, 3).map(s => <span key={s} style={{ background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1', padding: '0.2rem 0.55rem', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>)}
                </div>
              </div>
            )}
            {summary.sharedInterests?.length > 0 && (
              <div style={{ marginBottom: '0.4rem' }}>
                <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.3rem' }}>⚡ Matched Interests</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {summary.sharedInterests.slice(0, 3).map(i => (
                    <span key={i} style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '0.2rem 0.55rem', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
                      ✓ {i}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {summary.sharedCommunities?.length > 0 && (
              <div>
                <span className="recom-section-title" style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.3rem' }}>Shared Communities</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {summary.sharedCommunities.slice(0, 3).map(c => <span key={c} style={{ background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', padding: '0.2rem 0.55rem', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>{c}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Matched / Profile Interests Section */}
        {(summary?.sharedInterests?.length > 0 || profile.interests?.length > 0) && (
          <div className="skills-section-container" style={{ marginTop: '0.5rem', marginBottom: '0.75rem', paddingTop: '0.75rem' }}>
            <div className="skills-section-header">
              <span className="skills-section-title" style={{ color: summary?.sharedInterests?.length > 0 ? '#B45309' : 'var(--text-secondary)' }}>
                {summary?.sharedInterests?.length > 0 ? '⚡ Matched Interests' : 'Interests'}
              </span>
              <div className="skills-section-divider" style={{ backgroundColor: summary?.sharedInterests?.length > 0 ? '#FDE68A' : 'var(--border-color)' }} />
            </div>

            <div className="skills-tags-flex">
              {(summary?.sharedInterests?.length > 0 ? summary.sharedInterests : profile.interests).slice(0, 4).map((interest) => {
                const isMatched = summary?.sharedInterests?.includes(interest);
                return (
                  <span
                    key={interest}
                    className="skill-tag-badge"
                    style={{
                      background: isMatched ? '#FFFBEB' : '#F5F5F4',
                      color: isMatched ? '#B45309' : '#44403C',
                      border: isMatched ? '1px solid #FDE68A' : '1px solid #E7E5E4',
                      fontWeight: 600
                    }}
                  >
                    {isMatched ? `✓ ${interest}` : interest}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Redesigned Skills Section */}
        {(profile.skillsToTeach?.length > 0 || profile.skillsToLearn?.length > 0) && (
          <div className="skills-section-container" style={{ marginTop: '0', paddingTop: '0.5rem', borderTop: 'none' }}>
            {/* Clear Section Title */}
            <div className="skills-section-header">
              <span className="skills-section-title">Skills</span>
              <div className="skills-section-divider" />
            </div>

            {/* Teaches Group */}
            {profile.skillsToTeach?.length > 0 && (
              <div className="skills-category-group">
                <div className="skills-category-heading">
                  <span className="skills-category-dot teach" />
                  <span className="skills-category-title">Teaches</span>
                </div>
                <div className="skills-tags-flex">
                  {profile.skillsToTeach.slice(0, 4).map((s) => (
                    <span key={s} className="skill-tag-badge teach">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Group */}
            {profile.skillsToLearn?.length > 0 && (
              <div className="skills-category-group">
                <div className="skills-category-heading">
                  <span className="skills-category-dot learn" />
                  <span className="skills-category-title">Learning</span>
                </div>
                <div className="skills-tags-flex">
                  {profile.skillsToLearn.slice(0, 4).map((s) => (
                    <span key={s} className="skill-tag-badge learn">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <Link to={`/profile/${profile.username}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '0.55rem 0', fontSize: '0.8rem', fontWeight: 600, borderRadius: 'var(--border-radius-md)' }}>
            View Profile
          </Link>
          {recipientId && (
            <button 
              onClick={() => triggerConnectModal(recipientId, name)}
              className="btn-primary" 
              style={{ flex: 1, padding: '0.55rem 0', fontSize: '0.8rem', fontWeight: 600, borderRadius: 'var(--border-radius-md)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem' }}
            >
              <FiUserPlus /> Connect
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Search Bar Header */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Explore ConnectCraft</h1>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '1.05rem' }}
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FiSearch style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.35rem', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* DUAL INTERACTIVE WORKSPACES */}
      {!hasActiveFilters ? (
        // STATE A: Landing Feed (No active search query/filters)
        landingLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Trending Skills */}
            {landingData.trendingSkills?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiTrendingUp style={{ color: 'var(--color-primary)' }} /> Trending Skills
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {landingData.trendingSkills.map((s) => (
                    <div 
                      key={s.name} 
                      className="badge-pill clickable-chip" 
                      style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem' }}
                      onClick={() => applyTagFilter('skill', s.name)}
                    >
                      <span>{s.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({s.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Interests */}
            {landingData.popularInterests?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiGrid style={{ color: 'var(--color-secondary)' }} /> Popular Interests
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {landingData.popularInterests.map((i) => (
                    <div 
                      key={i.name} 
                      className="badge-pill clickable-chip" 
                      style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', borderColor: 'rgba(250, 204, 21, 0.4)', display: 'flex', gap: '0.5rem' }}
                      onClick={() => applyTagFilter('interest', i.name)}
                    >
                      <span>{i.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({i.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Matches */}
            {landingData.recommended?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiAward style={{ color: 'var(--color-accent)' }} /> Recommended for You
                </h2>
                <div className="results-grid">
                  {landingData.recommended.map((profile) => renderProfileCard(profile))}
                </div>
              </div>
            )}

            {/* Featured Members */}
            {landingData.featuredUsers?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiUsers style={{ color: 'var(--color-success)' }} /> Featured Members
                </h2>
                <div className="results-grid">
                  {landingData.featuredUsers.map((profile) => renderProfileCard(profile))}
                </div>
              </div>
            )}

            {/* Recently Joined */}
            {landingData.recentlyJoined?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiBookOpen style={{ color: 'var(--color-primary-hover)' }} /> Recently Joined
                </h2>
                <div className="results-grid">
                  {landingData.recentlyJoined.map((profile) => renderProfileCard(profile))}
                </div>
              </div>
            )}

          </div>
        )
      ) : (
        // STATE B: Search Results Feed (Active search query or filters)
        <div className="search-layout">
          
          {/* LEFT SIDEBAR: Filters panel */}
          <aside className="filter-sidebar glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Filters</h3>
              <button 
                type="button" 
                onClick={handleResetFilters} 
                style={{ fontSize: '0.8rem', color: 'var(--color-primary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Reset All
              </button>
            </div>

            {/* Sort Filter */}
            <div className="filter-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Sort By</label>
              <select 
                className="filter-select" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest Joined</option>
                <option value="most_completed">Profile Completion</option>
                <option value="alphabetical">Alphabetical (A-Z)</option>
              </select>
            </div>

            {/* Skill filter */}
            <div className="filter-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Skill (Learn or Teach)</label>
              <input
                type="text"
                name="skill"
                className="filter-input"
                placeholder="e.g. Python, React, Figma"
                value={filters.skill}
                onChange={handleFilterChange}
              />
            </div>

            {/* Location filter */}
            <div className="filter-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Location</label>
              <input
                type="text"
                name="location"
                className="filter-input"
                placeholder="e.g. London"
                value={filters.location}
                onChange={handleFilterChange}
              />
            </div>

            {/* Language filter */}
            <div className="filter-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Languages</label>
              <input
                type="text"
                name="language"
                className="filter-input"
                placeholder="e.g. Spanish"
                value={filters.language}
                onChange={handleFilterChange}
              />
            </div>

            {/* Interests filter */}
            <div className="filter-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Interests</label>
              <input
                type="text"
                name="interest"
                className="filter-input"
                placeholder="e.g. AI"
                value={filters.interest}
                onChange={handleFilterChange}
              />
            </div>
          </aside>

          {/* RIGHT VIEWPORT: Results cards grids */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {loading ? (
              <div className="results-grid">
                <LoadingSkeleton count={6} />
              </div>
            ) : profiles.length === 0 ? (
              <EmptyState onReset={handleResetFilters} />
            ) : (
              <>
                <div className="results-grid">
                  {profiles.map((profile) => renderProfileCard(profile))}
                </div>

                {/* Pagination Controls */}
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

        </div>
      )}



      {/* Connect Modal */}
      <ConnectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        recipientId={selectedUser.id}
        recipientName={selectedUser.name}
        onSuccess={() => {
          if (hasActiveFilters) {
            fetchSearchResults();
          } else {
            fetchLandingData();
          }
        }}
      />

    </div>
  );
};

export default Discover;
