import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import '../../styles/user/auth.css';
import '../../styles/user/profile.css';
import '../../styles/user/projects.css';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: 'Web Development',
    requiredSkillsInput: '',
    tagsInput: '',
    difficulty: 'Intermediate',
    estimatedDuration: '1-2 months',
    teamSize: 4,
    visibility: 'Public',
    status: 'Recruiting',
    bannerImage: '',
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
    'Hackathon',
    'Open Source',
    'Other',
  ];

  useEffect(() => {
    const fetchProject = async () => {
      setInitialLoading(true);
      setError('');
      try {
        const response = await api.get(`/projects/${id}`);
        if (response.data?.status === 'success') {
          const p = response.data.project;
          if (!p.isOwner) {
            setError('Only the project owner can edit project settings.');
            return;
          }

          setFormData({
            title: p.title || '',
            shortDescription: p.shortDescription || '',
            description: p.description || '',
            category: p.category || 'Web Development',
            requiredSkillsInput: (p.requiredSkills || []).join(', '),
            tagsInput: (p.tags || []).join(', '),
            difficulty: p.difficulty || 'Intermediate',
            estimatedDuration: p.estimatedDuration || '1-2 months',
            teamSize: p.teamSize || 4,
            visibility: p.visibility || 'Public',
            status: p.status || 'Recruiting',
            bannerImage: p.bannerImage || '',
          });
        }
      } catch  {
        setError('Failed to load project details.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProject();
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
      const requiredSkills = formData.requiredSkillsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const tags = formData.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title: formData.title.trim(),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        category: formData.category,
        requiredSkills,
        tags,
        difficulty: formData.difficulty,
        estimatedDuration: formData.estimatedDuration.trim(),
        teamSize: Number(formData.teamSize),
        visibility: formData.visibility,
        status: formData.status,
        bannerImage: formData.bannerImage.trim(),
      };

      const response = await api.put(`/projects/${id}`, payload);
      if (response.data?.status === 'success') {
        navigate(`/projects/${id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to update project.');
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
        <Link to={`/projects/${id}`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
          <FiArrowLeft /> Back to Project Details
        </Link>
      </div>

      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Edit Project Settings
        </h1>

        {error && <div className="alert-message error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label className="form-label">Project Title *</label>
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
              <label className="form-label">Category *</label>
              <select name="category" className="filter-select" value={formData.category} onChange={handleChange}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select name="difficulty" className="filter-select" value={formData.difficulty} onChange={handleChange}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Short Description *</label>
            <input
              type="text"
              name="shortDescription"
              className="form-input"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value.slice(0, 200) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Project Overview *</label>
            <textarea
              name="description"
              className="form-input"
              rows={6}
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Required Skills (Comma separated)</label>
              <input
                type="text"
                name="requiredSkillsInput"
                className="form-input"
                value={formData.requiredSkillsInput}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (Comma separated)</label>
              <input
                type="text"
                name="tagsInput"
                className="form-input"
                value={formData.tagsInput}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Target Team Size *</label>
              <input
                type="number"
                name="teamSize"
                className="form-input"
                min={1}
                max={50}
                value={formData.teamSize}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Duration</label>
              <input
                type="text"
                name="estimatedDuration"
                className="form-input"
                value={formData.estimatedDuration}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Visibility</label>
              <select name="visibility" className="filter-select" value={formData.visibility} onChange={handleChange}>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Project Status</label>
              <select name="status" className="filter-select" value={formData.status} onChange={handleChange}>
                <option value="Recruiting">Recruiting</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Banner Image URL</label>
            <input
              type="url"
              name="bannerImage"
              className="form-input"
              value={formData.bannerImage}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link to={`/projects/${id}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '0.8rem 0' }}>
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

export default EditProject;
