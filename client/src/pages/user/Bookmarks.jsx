import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FiBookmark, FiHeart, FiEye, FiBookOpen, FiCode, FiVideo, FiFileText, FiGlobe, FiFigma, FiFolder } from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/resources.css';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookmarks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/resources/bookmarks');
      if (response.data?.status === 'success') {
        setBookmarks(response.data.bookmarks || []);
      }
    } catch  {
      setError('Could not retrieve saved bookmarks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (resourceId) => {
    try {
      const res = await api.delete(`/resources/${resourceId}/bookmark`);
      if (res.data?.status === 'success') {
        setBookmarks((prev) => prev.filter((r) => r._id !== resourceId));
      }
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  };

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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header section */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', borderLeft: '4px solid var(--color-warning)' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Saved Bookmarks</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Your curated collection of bookmarked articles, guides, GitHub repos, and video tutorials.
        </p>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      {bookmarks.length === 0 ? (
        <div className="glass" style={{ padding: '4rem 2rem', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
          <FiBookmark style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No Saved Bookmarks</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Explore the Resource Space and click the bookmark icon on any guide or link to save it here.</p>
          <Link to="/resources" className="btn-primary" style={{ marginTop: '1.25rem', display: 'inline-block', fontSize: '0.85rem' }}>
            Explore Knowledge Library
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {bookmarks.map((res) => {
            const creatorName = res.creator?.name || 'Creator';
            const initials = creatorName.split(' ').map((n) => n[0]).join('').toUpperCase();

            return (
              <div key={res._id} className="resource-card">
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

                <div className="resource-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge-pill" style={{ fontSize: '0.7rem' }}>{res.category}</span>
                    <button
                      className="stat-icon-btn bookmarked"
                      onClick={() => handleRemoveBookmark(res._id)}
                      title="Remove Bookmark"
                    >
                      <FiBookmark style={{ fill: '#facc15' }} /> Saved
                    </button>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <div className="resource-stats-bar">
                      <span><FiEye /> {res.views || 0}</span>
                      <span><FiHeart /> {res.likesCount || 0}</span>
                    </div>

                    <Link to={`/resources/${res._id}`} className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
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

export default Bookmarks;
