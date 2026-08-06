import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiBookOpen } from 'react-icons/fi';
import '../../styles/user/auth.css';
import '../../styles/user/profile.css';
import '../../styles/user/resources.css';

const CreateResource = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preCommunityId = searchParams.get('communityId');
  const preProjectId = searchParams.get('projectId');

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    content: '',
    resourceType: 'Article',
    externalLink: '',
    category: 'Web Development',
    tagsInput: '',
    visibility: preCommunityId ? 'Community Only' : preProjectId ? 'Project Only' : 'Public',
    communityId: preCommunityId || '',
    projectId: preProjectId || '',
    thumbnail: '',
  });

  const [myCommunities, setMyCommunities] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Web Development',
    'Mobile Development',
    'AI / Machine Learning',
    'Data Science',
    'Cyber Security',
    'UI / UX & Design',
    'Arts & Creative Media',
    'Music & Audio Production',
    'Business & Entrepreneurship',
    'Content Creation & Writing',
    'Fitness, Sports & Wellness',
    'Languages & Academics',
    'Culinary Arts & Cooking',
    'Game Development',
    'Research & Innovation',
    'Other',
  ];

  const resourceTypes = [
    'Article / Guide',
    'YouTube Video / Tutorial',
    'Course / Playlist',
    'GitHub Repository',
    'Figma / Design Resource',
    'Podcast / Audio Lesson',
    'Book / E-Book',
    'Documentation / Cheat Sheet',
    'Research Paper',
    'Website / Tool',
    'Google Drive / PDF',
    'Other',
  ];

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [commRes, projRes] = await Promise.all([
          api.get('/communities'),
          api.get('/projects/my'),
        ]);

        if (commRes.data?.status === 'success') {
          setMyCommunities(commRes.data.data.joined || []);
        }
        if (projRes.data?.status === 'success') {
          const allProjs = [
            ...(projRes.data.data.owned || []),
            ...(projRes.data.data.joined || []),
          ];
          setMyProjects(allProjs);
        }
      } catch (err) {
        console.error('Error fetching scope options:', err);
      }
    };

    fetchOptions();
  }, []);

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
        community: formData.visibility === 'Community Only' ? formData.communityId || null : null,
        project: formData.visibility === 'Project Only' ? formData.projectId || null : null,
        thumbnail: formData.thumbnail.trim(),
      };

      const response = await api.post('/resources', payload);
      if (response.data?.status === 'success') {
        if (formData.visibility === 'Community Only' && formData.communityId) {
          navigate(`/communities/${formData.communityId}`);
        } else if (formData.visibility === 'Project Only' && formData.projectId) {
          navigate(`/projects/${formData.projectId}`);
        } else {
          navigate(`/resources/${response.data.resource._id}`);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to publish resource.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <Link to="/resources" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
          <FiArrowLeft /> Back to Knowledge Library
        </Link>
      </div>

      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Share Learning Resource
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Publish articles, documentation, GitHub repos, or video links for ConnectCraft peers.
        </p>

        {error && <div className="alert-message error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Resource Title */}
          <div className="form-group">
            <label className="form-label">Resource Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. Complete Roadmap to Master React Server Components & Next.js App Router"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Type & Category */}
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

          {/* External Link */}
          <div className="form-group">
            <label className="form-label">External Link (URL)</label>
            <input
              type="url"
              name="externalLink"
              className="form-input"
              placeholder="e.g. https://github.com/... or https://youtube.com/watch?v=..."
              value={formData.externalLink}
              onChange={handleChange}
            />
          </div>

          {/* Short Description */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Short Summary *</label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formData.shortDescription.length} / 250</span>
            </div>
            <input
              type="text"
              name="shortDescription"
              className="form-input"
              placeholder="A 1-2 sentence overview of what peers will learn from this resource..."
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value.slice(0, 250) })}
              required
            />
          </div>

          {/* Detailed Content Overview */}
          <div className="form-group">
            <label className="form-label">Detailed Content & Guide Breakdown *</label>
            <textarea
              name="content"
              className="form-input"
              rows={8}
              placeholder="Write an article, study guide, key takeaways, code examples, or notes..."
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>

          {/* Tags & Thumbnail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Skill Tags (Comma separated)</label>
              <input
                type="text"
                name="tagsInput"
                className="form-input"
                placeholder="e.g. React, NextJS, WebDev"
                value={formData.tagsInput}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Thumbnail Image URL (Optional)</label>
              <input
                type="url"
                name="thumbnail"
                className="form-input"
                placeholder="e.g. https://images.unsplash.com/photo-..."
                value={formData.thumbnail}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Visibility & Scope Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Visibility Scope</label>
              <select name="visibility" className="filter-select" value={formData.visibility} onChange={handleChange}>
                <option value="Public">Public (Available in public resource feed)</option>
                <option value="Community Only">Community Only (Bound to a specific community)</option>
                <option value="Project Only">Project Only (Bound to a specific project)</option>
              </select>
            </div>

            {formData.visibility === 'Community Only' && (
              <div className="form-group">
                <label className="form-label">Select Community *</label>
                <select name="communityId" className="filter-select" value={formData.communityId} onChange={handleChange} required>
                  <option value="">Select a Community</option>
                  {myCommunities.map((c) => (
                    <option key={c._id} value={c._id}>{c.communityName}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.visibility === 'Project Only' && (
              <div className="form-group">
                <label className="form-label">Select Project *</label>
                <select name="projectId" className="filter-select" value={formData.projectId} onChange={handleChange} required>
                  <option value="">Select a Project</option>
                  {myProjects.map((p) => (
                    <option key={p._id} value={p._id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link to="/resources" className="btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '0.8rem 0' }}>
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, padding: '0.8rem 0', fontSize: '0.95rem' }}>
              {loading ? 'Publishing...' : 'Publish Resource'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default CreateResource;
