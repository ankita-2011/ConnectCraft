import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  FiArrowLeft, 
  FiHeart, 
  FiBookmark, 
  FiExternalLink, 
  FiEdit, 
  FiTrash2,
  FiBookOpen,
  FiCode,
  FiVideo,
  FiFileText,
  FiGlobe,
  FiFigma,
  FiFolder
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/resources.css';

import { useToast } from '../../context/ToastContext';

const ResourceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [resource, setResource] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [relatedResources, setRelatedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResourceDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/resources/${id}`);
      if (response.data?.status === 'success') {
        const resData = response.data.resource;
        setResource(resData);
        setCreatorProfile(response.data.creatorProfile);

        // Fetch related resources
        if (resData.category) {
          const relRes = await api.get('/resources', {
            params: { category: resData.category, limit: 3 },
          });
          if (relRes.data?.status === 'success') {
            setRelatedResources(
              (relRes.data.resources || []).filter((r) => r._id !== id)
            );
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Could not load resource details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchResourceDetails();
    }
  }, [id]);

  const handleToggleLike = async () => {
    if (!resource) return;
    try {
      const endpoint = `/resources/${id}/like`;
      const res = resource.isLiked ? await api.delete(endpoint) : await api.post(endpoint);
      if (res.data?.status === 'success') {
        setResource({
          ...resource,
          isLiked: !resource.isLiked,
          likesCount: res.data.likesCount,
        });
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleToggleBookmark = async () => {
    if (!resource) return;
    try {
      const endpoint = `/resources/${id}/bookmark`;
      const res = resource.isBookmarked ? await api.delete(endpoint) : await api.post(endpoint);
      if (res.data?.status === 'success') {
        setResource({
          ...resource,
          isBookmarked: !resource.isBookmarked,
          bookmarksCount: res.data.bookmarksCount,
        });
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteResource = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this resource?');
    if (!confirmDelete) return;

    try {
      const response = await api.delete(`/resources/${id}`);
      if (response.data?.status === 'success') {
        toast.info('Resource deleted successfully.');
        navigate('/resources');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete resource.');
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

  if (error || !resource) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="glass" style={{ padding: '3rem 2rem', borderRadius: 'var(--border-radius-lg)' }}>
          <h2 style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>Resource Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error || 'Resource not found.'}</p>
          <Link to="/resources" className="btn-primary">Back to Knowledge Library</Link>
        </div>
      </div>
    );
  }

  const creatorName = resource.creator?.name || 'Creator';
  const initials = creatorName.split(' ').map((n) => n[0]).join('').toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Back button */}
      <div>
        <Link to="/resources" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
          <FiArrowLeft /> Back to Knowledge Library
        </Link>
      </div>

      {/* Hero Header Section */}
      <div className="resource-detail-hero glass">
        <div className="resource-hero-cover">
          {resource.thumbnail ? (
            <img src={resource.thumbnail} alt={resource.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="resource-thumbnail-placeholder" style={{ fontSize: '4.5rem' }}>
              {getTypeIcon(resource.resourceType)}
            </div>
          )}
          <span className="resource-type-badge" style={{ top: '1.25rem', left: '1.25rem', fontSize: '0.8rem' }}>
            {getTypeIcon(resource.resourceType)} {resource.resourceType}
          </span>
        </div>

        <div className="resource-hero-content">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge-pill" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{resource.category}</span>
                <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>📅 {new Date(resource.createdAt).toLocaleDateString()}</span>
                <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>• {resource.visibility}</span>
              </div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, margin: '0.3rem 0' }}>{resource.title}</h1>
              <p style={{ fontSize: '1.05rem', color: '#334155', marginTop: '0.5rem', lineHeight: 1.5 }}>{resource.shortDescription}</p>
            </div>

            {/* Interaction Buttons & Link Redirect */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              {resource.externalLink && (
                <a
                  href={resource.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ padding: '0.65rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <FiExternalLink /> Open External Resource
                </a>
              )}

              <button
                onClick={handleToggleLike}
                className="btn-secondary"
                style={{ padding: '0.65rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: resource.isLiked ? '#ef4444' : 'var(--text-primary)', borderColor: resource.isLiked ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)' }}
              >
                <FiHeart style={{ fill: resource.isLiked ? '#ef4444' : 'none' }} /> {resource.likesCount}
              </button>

              <button
                onClick={handleToggleBookmark}
                className="btn-secondary"
                style={{ padding: '0.65rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: resource.isBookmarked ? '#facc15' : 'var(--text-primary)', borderColor: resource.isBookmarked ? 'rgba(250, 204, 21, 0.4)' : 'var(--border-color)' }}
              >
                <FiBookmark style={{ fill: resource.isBookmarked ? '#facc15' : 'none' }} /> {resource.isBookmarked ? 'Saved' : 'Save'}
              </button>

              {resource.isCreator && (
                <>
                  <Link to={`/resources/${id}/edit`} className="btn-secondary" style={{ padding: '0.65rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <FiEdit /> Edit
                  </Link>
                  <button onClick={handleDeleteResource} className="btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.65rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <FiTrash2 /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="profile-meta-grid">
        
        {/* LEFT COLUMN: Article Content & Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="resource-content-box">
            <h3 className="info-section-title" style={{ marginTop: 0 }}>Resource Overview & Study Notes</h3>
            <div style={{ whiteSpace: 'pre-line', color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
              {resource.content}
            </div>

            {/* Tags */}
            {resource.tags?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                <h3 className="info-section-title">Topic Tags</h3>
                <div className="badge-flex">
                  {resource.tags.map((tag) => (
                    <span key={tag} className="badge-pill teach" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related Resources */}
          {relatedResources.length > 0 && (
            <div className="profile-details-card glass">
              <h3 className="info-section-title" style={{ marginTop: 0 }}>Related Resources</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {relatedResources.map((rel) => (
                  <div key={rel._id} className="glass" style={{ padding: '1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span className="badge-pill" style={{ fontSize: '0.65rem', width: 'max-content' }}>{rel.resourceType}</span>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{rel.title}</h4>
                    <Link to={`/resources/${rel._id}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', marginTop: 'auto', width: 'max-content' }}>
                      Inspect Resource
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Creator & Stats Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Creator Profile Card */}
          <div className="profile-side-card glass" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>Shared By</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.75rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                {creatorProfile?.profilePhoto ? (
                  <img src={creatorProfile.profilePhoto} alt={creatorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  initials
                )}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{creatorName}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{creatorProfile?.headline || 'ConnectCraft Community Educator'}</p>
              </div>
            </div>

            {creatorProfile?.username && (
              <Link to={`/profile/${creatorProfile.username}`} className="btn-secondary" style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', padding: '0.45rem 0' }}>
                View Full Profile
              </Link>
            )}
          </div>

          {/* Stats Summary Widget */}
          <div className="profile-side-card glass">
            <h3 className="info-section-title">Resource Analytics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Views:</span>
                <span style={{ fontWeight: 600 }}>👁 {resource.views}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Peer Likes:</span>
                <span style={{ fontWeight: 600 }}>❤️ {resource.likesCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bookmarks Saved:</span>
                <span style={{ fontWeight: 600 }}>🔖 {resource.bookmarksCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Type:</span>
                <span style={{ fontWeight: 600 }}>{resource.resourceType}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ResourceDetails;
