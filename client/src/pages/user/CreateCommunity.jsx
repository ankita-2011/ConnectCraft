import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiTrash, FiUpload } from 'react-icons/fi';
import '../../styles/user/auth.css';
import '../../styles/user/profile.css';
import '../../styles/user/communities.css';

const CreateCommunity = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields State
  const [formData, setFormData] = useState({
    communityName: '',
    description: '',
    category: 'Technology',
    visibility: 'public',
    location: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [rules, setRules] = useState(['Be respectful to fellow learners.', 'Share helpful code snippets.']);
  const [ruleInput, setRuleInput] = useState('');

  // Files State
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');

  const categoriesList = [
    'Technology', 'Programming', 'Artificial Intelligence', 'Design', 
    'Photography', 'Music', 'Fitness', 'Business', 'Education', 
    'Language Learning', 'Books', 'Gaming', 'Travel', 'Cooking', 'Health'
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Tag list controllers
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Rule controllers
  const handleAddRule = () => {
    const val = ruleInput.trim();
    if (val && !rules.includes(val)) {
      setRules([...rules, val]);
    }
    setRuleInput('');
  };

  const handleRemoveRule = (index) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  // Image upload triggers
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.communityName.trim() || !formData.description.trim() || !formData.category) {
      setError('Please fill in name, description and category.');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('communityName', formData.communityName.trim());
      data.append('description', formData.description.trim());
      data.append('category', formData.category);
      data.append('visibility', formData.visibility);
      data.append('location', formData.location.trim());
      
      // Append tags as individual array elements or strings
      tags.forEach(tag => data.append('tags', tag));
      rules.forEach(rule => data.append('rules', rule));

      if (logoFile) data.append('logo', logoFile);
      if (coverFile) data.append('cover', coverFile);

      const response = await api.post('/communities', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.status === 'success') {
        // Redirect to detail page
        navigate(`/communities/${response.data.community.slug}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while creating community.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Back navigation */}
      <button 
        onClick={() => navigate('/communities')} 
        className="btn-secondary" 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', border: 'none' }}
      >
        <FiArrowLeft /> Back to Communities
      </button>

      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Create Community</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Start a learning circle. Set rules and collaborate with peers.</p>

        {error && <div className="alert-message error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Cover & Logo Upload Fields */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">Community Logo</label>
              <div 
                style={{ 
                  width: '90px', 
                  height: '90px', 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: '12px', 
                  position: 'relative', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                  marginTop: '0.5rem'
                }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FiUpload style={{ color: 'var(--text-muted)', fontSize: '1.5rem' }} />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'logo')}
                  style={{ position: 'absolute', opacity: 0, top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ flex: 2, minWidth: '240px' }}>
              <label className="form-label">Community Cover Banner</label>
              <div 
                style={{ 
                  height: '90px', 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: '12px', 
                  position: 'relative', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                  marginTop: '0.5rem'
                }}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <FiUpload /> Upload cover picture
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'cover')}
                  style={{ position: 'absolute', opacity: 0, top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="communityName">Community Name</label>
            <input
              type="text"
              id="communityName"
              name="communityName"
              className="form-input"
              placeholder="e.g. Node.js Builders Space"
              value={formData.communityName}
              onChange={handleInputChange}
            />
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-input"
              rows={4}
              placeholder="What is this community about? Define topics, expectations..."
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Category & Visibility Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                className="filter-select"
                value={formData.category}
                onChange={handleInputChange}
              >
                {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="visibility">Visibility</label>
              <select
                id="visibility"
                name="visibility"
                className="filter-select"
                value={formData.visibility}
                onChange={handleInputChange}
              >
                <option value="public">Public (Anyone joins instantly)</option>
                <option value="private">Private (Requires invite/approval)</option>
              </select>
            </div>
          </div>

          {/* Location Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="location">Location (Optional)</label>
            <input
              type="text"
              id="location"
              name="location"
              className="form-input"
              placeholder="e.g. London / Remote"
              value={formData.location}
              onChange={handleInputChange}
            />
          </div>

          {/* Tags / Skills input */}
          <div className="form-group">
            <label className="form-label">Tags / Associated Skills (Press Enter to add)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Node, React, System Design"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            <div className="badge-flex" style={{ marginTop: '0.75rem' }}>
              {tags.map(t => (
                <span key={t} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  {t}
                  <button type="button" onClick={() => handleRemoveTag(t)} style={{ border: 'none', background: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Rules builder */}
          <div className="form-group">
            <label className="form-label">Community Rules</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add rule (e.g. No promotional spamming)"
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
              />
              <button type="button" onClick={handleAddRule} className="btn-secondary" style={{ padding: '0 1rem' }}>Add</button>
            </div>
            <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {rules.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{rule}</span>
                    <button type="button" onClick={() => handleRemoveRule(idx)} style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex' }}>
                      <FiTrash />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '0.9rem 0', fontWeight: 600, fontSize: '1rem', marginTop: '1rem' }}
          >
            {loading ? 'Creating Space...' : 'Create Community'}
          </button>

        </form>
      </div>

    </div>
  );
};

export default CreateCommunity;
