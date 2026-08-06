import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiCode } from 'react-icons/fi';
import '../../styles/user/auth.css';
import '../../styles/user/profile.css';
import '../../styles/user/projects.css';

const CreateProject = () => {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Web Development',
    'Mobile Development',
    'AI / Machine Learning',
    'Data Science',
    'Cyber Security',
    'UI / UX & Design',
    'Game Development',
    'Arts & Creative Media',
    'Music & Audio Production',
    'Business & Entrepreneurship',
    'Content Creation & Writing',
    'Fitness, Sports & Wellness',
    'Languages & Academics',
    'Culinary Arts & Cooking',
    'Cloud & DevOps',
    'Blockchain / Web3',
    'Research & Innovation',
    'Other',
  ];

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

      const response = await api.post('/projects', payload);
      if (response.data?.status === 'success') {
        navigate(`/projects/${response.data.project._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header back button */}
      <div>
        <Link to="/projects" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
          <FiArrowLeft /> Back to Projects
        </Link>
      </div>

      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Create New Project
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Pitch your project idea, specify team requirements, and recruit connected members.
        </p>

        {error && <div className="alert-message error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Project Title */}
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. ConnectCraft Mobile Companion App"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category & Difficulty */}
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
                <option value="Beginner">Beginner (Starter friendly)</option>
                <option value="Intermediate">Intermediate (Standard stack)</option>
                <option value="Advanced">Advanced (Complex system)</option>
              </select>
            </div>
          </div>

          {/* Short Description */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Short Description *</label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formData.shortDescription.length} / 200</span>
            </div>
            <input
              type="text"
              name="shortDescription"
              className="form-input"
              placeholder="A brief summary of what you are building..."
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value.slice(0, 200) })}
              required
            />
          </div>

          {/* Detailed Description */}
          <div className="form-group">
            <label className="form-label">Detailed Project Overview *</label>
            <textarea
              name="description"
              className="form-input"
              rows={6}
              placeholder="Explain the project goals, architecture, target features, and what collaborators will learn/build..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Skills Required & Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Required Skills (Comma separated)</label>
              <input
                type="text"
                name="requiredSkillsInput"
                className="form-input"
                placeholder="e.g. React, Node.js, MongoDB"
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
                placeholder="e.g. OpenSource, Hackathon, Fullstack"
                value={formData.tagsInput}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Team Size, Duration, Visibility, Status */}
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
                placeholder="e.g. 1-2 months"
                value={formData.estimatedDuration}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Visibility</label>
              <select name="visibility" className="filter-select" value={formData.visibility} onChange={handleChange}>
                <option value="Public">Public (Discoverable by everyone)</option>
                <option value="Private">Private (Invite only)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select name="status" className="filter-select" value={formData.status} onChange={handleChange}>
                <option value="Recruiting">Recruiting (Open positions)</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
              </select>
            </div>
          </div>

          {/* Banner Image URL */}
          <div className="form-group">
            <label className="form-label">Banner Image URL (Optional)</label>
            <input
              type="url"
              name="bannerImage"
              className="form-input"
              placeholder="e.g. https://images.unsplash.com/photo-..."
              value={formData.bannerImage}
              onChange={handleChange}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link to="/projects" className="btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '0.8rem 0' }}>
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, padding: '0.8rem 0', fontSize: '0.95rem' }}>
              {loading ? 'Creating Project...' : 'Publish Project'}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default CreateProject;
