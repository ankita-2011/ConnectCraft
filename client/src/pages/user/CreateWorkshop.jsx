import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiUpload } from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/auth.css';

const CreateWorkshop = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const communityIdParam = searchParams.get('communityId');
  const projectIdParam = searchParams.get('projectId');

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    eventType: 'Workshop',
    category: 'Web Development',
    tags: '',
    mode: 'Online',
    meetingLink: '',
    location: '',
    community: communityIdParam || '',
    project: projectIdParam || '',
    date: '',
    startTime: '18:00',
    endTime: '19:00',
    duration: '60 mins',
    maxParticipants: 50,
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categoriesList = [
    'Web Development', 'Mobile Development', 'AI / Machine Learning', 
    'Data Science', 'Cyber Security', 'UI / UX & Design', 
    'Arts & Creative Media', 'Music & Audio Production', 'Business & Entrepreneurship',
    'Content Creation & Writing', 'Fitness, Sports & Wellness', 'Languages & Academics',
    'Culinary Arts & Cooking', 'Game Development', 'Research', 'Other'
  ];

  const eventTypesList = [
    'Workshop', 'Webinar', 'Masterclass', 'Jam Session', 'Study Session', 
    'Project Meeting', 'AMA / Q&A', 'Community Meetup', 'Practice & Training', 'Talk / Speech', 'Other'
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.shortDescription || !formData.description || !formData.date) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });

      if (bannerFile) {
        data.append('banner', bannerFile);
      }

      const response = await api.post('/workshops', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.status === 'success') {
        const createdId = response.data.workshop._id;
        navigate(`/workshops/${createdId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workshop event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Link to="/workshops" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'max-content', fontSize: '0.85rem' }}>
        <FiArrowLeft /> Back to Workshops
      </Link>

      <div className="glass" style={{ padding: '2rem 2.5rem', borderRadius: 'var(--border-radius-lg)', borderLeft: '4px solid var(--color-primary)' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800 }}>Organize Workshop / Event</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          Schedule a live study session, webinar, project sync meeting, or tech talk.
        </p>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-md)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input type="text" name="title" className="form-input" placeholder="e.g. Building Scalable Web APIs with Node.js & Redis" value={formData.title} onChange={handleInputChange} required />
          </div>

          {/* Event Type & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Event Type *</label>
              <select name="eventType" className="filter-select" value={formData.eventType} onChange={handleInputChange}>
                {eventTypesList.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select name="category" className="filter-select" value={formData.category} onChange={handleInputChange}>
                {categoriesList.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Short Description */}
          <div className="form-group">
            <label className="form-label">Short Summary *</label>
            <input type="text" name="shortDescription" className="form-input" placeholder="Brief 1-2 sentence preview for discovery cards..." value={formData.shortDescription} onChange={handleInputChange} required />
          </div>

          {/* Detailed Description */}
          <div className="form-group">
            <label className="form-label">Detailed Agenda & Description *</label>
            <textarea name="description" className="form-input" rows={5} placeholder="Full event agenda, prerequisites, learning outcomes..." value={formData.description} onChange={handleInputChange} required />
          </div>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Event Date *</label>
              <input type="date" name="date" className="form-input" value={formData.date} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input type="time" name="startTime" className="form-input" value={formData.startTime} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input type="time" name="endTime" className="form-input" value={formData.endTime} onChange={handleInputChange} required />
            </div>
          </div>

          {/* Mode & Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Event Mode</label>
              <select name="mode" className="filter-select" value={formData.mode} onChange={handleInputChange}>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Max Participants Capacity</label>
              <input type="number" name="maxParticipants" className="form-input" min={1} value={formData.maxParticipants} onChange={handleInputChange} />
            </div>
          </div>

          {/* Meeting Link for Online/Hybrid */}
          {(formData.mode === 'Online' || formData.mode === 'Hybrid') && (
            <div className="form-group">
              <label className="form-label">Online Meeting Link (Zoom, Google Meet, Jitsi, etc.)</label>
              <input type="url" name="meetingLink" className="form-input" placeholder="https://meet.google.com/abc-defg-hij" value={formData.meetingLink} onChange={handleInputChange} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                🔒 Note: Meeting link is protected and revealed ONLY to registered attendees.
              </span>
            </div>
          )}

          {/* Physical Location for Offline/Hybrid */}
          {(formData.mode === 'Offline' || formData.mode === 'Hybrid') && (
            <div className="form-group">
              <label className="form-label">Physical Location / Address</label>
              <input type="text" name="location" className="form-input" placeholder="e.g. Tech Space Auditorium, Room 402, Bangalore" value={formData.location} onChange={handleInputChange} />
            </div>
          )}

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input type="text" name="tags" className="form-input" placeholder="React, Node.js, System Design, Live Coding" value={formData.tags} onChange={handleInputChange} />
          </div>

          {/* Banner Upload */}
          <div className="form-group">
            <label className="form-label">Event Banner Image</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ height: '100px', width: '200px', border: '2px dashed var(--border-color)', borderRadius: '8px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FiUpload style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }} />
                )}
                <input type="file" accept="image/*" onChange={handleBannerChange} style={{ position: 'absolute', opacity: 0, cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0 }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload an optional banner image (Max 5MB)</span>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.85rem', fontSize: '0.95rem', marginTop: '1rem' }}>
            {loading ? 'Publishing Event...' : 'Publish Workshop / Event'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default CreateWorkshop;
