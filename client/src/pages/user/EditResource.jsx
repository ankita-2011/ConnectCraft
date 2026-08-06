import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import '../../styles/user/auth.css';
import '../../styles/user/profile.css';
import '../../styles/user/resources.css';

const EditResource = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    content: '',
    resourceType: 'Article',
    externalLink: '',
    category: 'Web Development',
    tagsInput: '',
    visibility: 'Public',
    thumbnail: '',
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const fetchResource = async () => {
      setInitialLoading(true);
      setError('');
      try {
        const response = await api.get(`/resources/${id}`);
        if (response.data?.status === 'success') {
          const r = response.data.resource;
          if (!r.isCreator) {
            setError('Only the resource creator can edit settings.');
            return;
          }

          setFormData({
            title: r.title || '',
            shortDescription: r.shortDescription || '',
            content: r.content || '',
            resourceType: r.resourceType || 'Article',
            externalLink: r.externalLink || '',
            category: r.category || 'Web Development',
            tagsInput: (r.tags || []).join(', '),
            visibility: r.visibility || 'Public',
            thumbnail: r.thumbnail || '',
          });
        }
      } catch  {
        setError('Failed to load resource details.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchResource();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tags = formData.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title: formData.title.trim(),
        shortDescription: formData.shortDescription.trim(),
        content: formData.content.trim(),
        resourceType: formData.resourceType,
        externalLink: formData.externalLink.trim(),
        category: formData.category,
        tags,
        visibility: formData.visibility,
        thumbnail: formData.thumbnail.trim(),
      };

      const response = await api.put(`/resources/${id}`, payload);
      if (response.data?.status === 'success') {
        navigate(`/resources/${id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to update resource.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <Link to={`/resources/${id}`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
          <FiArrowLeft /> Back to Resource
        </Link>
      </div>

      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Edit Resource
        </h1>

        {error && <div className="alert-message error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label className="form-label">Resource Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Resource Type *</label>
              <select name="resourceType" className="filter-select" value={formData.resourceType} onChange={handleChange}>
                {resourceTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select name="category" className="filter-select" value={formData.category} onChange={handleChange}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">External Link (URL)</label>
            <input
              type="url"
              name="externalLink"
              className="form-input"
              value={formData.externalLink}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Summary *</label>
            <input
              type="text"
              name="shortDescription"
              className="form-input"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value.slice(0, 250) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Content & Guide Breakdown *</label>
            <textarea
              name="content"
              className="form-input"
              rows={8}
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Skill Tags (Comma separated)</label>
              <input
                type="text"
                name="tagsInput"
                className="form-input"
                value={formData.tagsInput}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Thumbnail Image URL</label>
              <input
                type="url"
                name="thumbnail"
                className="form-input"
                value={formData.thumbnail}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link to={`/resources/${id}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '0.8rem 0' }}>
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, padding: '0.8rem 0', fontSize: '0.95rem', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default EditResource;
