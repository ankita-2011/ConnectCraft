import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiUpload } from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/auth.css';

const EditWorkshop = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
    date: '',
    startTime: '18:00',
    endTime: '19:00',
    maxParticipants: 50,
    status: 'Upcoming',
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categoriesList = [
    'Web Development', 'Mobile Development', 'AI / Machine Learning', 
    'Data Science', 'Cyber Security', 'Blockchain', 'UI / UX', 
    'Game Development', 'Cloud Computing', 'Research', 'Other'
  ];

  const eventTypesList = [
    'Workshop', 'Webinar', 'Study Session', 'Project Meeting', 
    'Hackathon', 'AMA', 'Community Meetup', 'Code Review Session', 'Tech Talk', 'Other'
  ];

  const fetchWorkshop = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/workshops/${id}`);
      if (response.data?.status === 'success') {
        const ws = response.data.workshop;
        setFormData({
          title: ws.title || '',
          shortDescription: ws.shortDescription || '',
          description: ws.description || '',
          eventType: ws.eventType || 'Workshop',
          category: ws.category || 'Web Development',
          tags: ws.tags ? ws.tags.join(', ') : '',
          mode: ws.mode || 'Online',
          meetingLink: ws.meetingLink || '',
          location: ws.location || '',
          date: ws.date ? new Date(ws.date).toISOString().split('T')[0] : '',
          startTime: ws.startTime || '18:00',
          endTime: ws.endTime || '19:00',
          maxParticipants: ws.maxParticipants || 50,
          status: ws.status || 'Upcoming',
        });
        if (ws.bannerImage) {
          setBannerPreview(ws.bannerImage);
        }
      }
    } catch  {
      setError('Failed to retrieve workshop details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshop();
  }, [id]);

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
    setSaving(true);
    setError('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (bannerFile) {
        data.append('banner', bannerFile);
      }

      const response = await api.put(`/workshops/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.status === 'success') {
        navigate(`/workshops/${id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update workshop.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Link to={`/workshops/${id}`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'max-content', fontSize: '0.85rem' }}>
        <FiArrowLeft /> Cancel & Return to Details
      </Link>

      <div className="glass" style={{ padding: '2rem 2.5rem', borderRadius: 'var(--border-radius-lg)', borderLeft: '4px solid var(--color-primary)' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800 }}>Edit Workshop Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          Update session details, meeting links, or event status.
        </p>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-md)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label className="form-label">Event Status</label>
            <select name="status" className="filter-select" value={formData.status} onChange={handleInputChange}>
              <option value="Upcoming">Upcoming</option>
              <option value="Live">Live</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input type="text" name="title" className="form-input" value={formData.title} onChange={handleInputChange} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Event Type</label>
              <select name="eventType" className="filter-select" value={formData.eventType} onChange={handleInputChange}>
                {eventTypesList.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="filter-select" value={formData.category} onChange={handleInputChange}>
                {categoriesList.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Short Summary</label>
            <input type="text" name="shortDescription" className="form-input" value={formData.shortDescription} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea name="description" className="form-input" rows={5} value={formData.description} onChange={handleInputChange} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Event Date</label>
              <input type="date" name="date" className="form-input" value={formData.date} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input type="time" name="startTime" className="form-input" value={formData.startTime} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">End Time</label>
              <input type="time" name="endTime" className="form-input" value={formData.endTime} onChange={handleInputChange} required />
            </div>
          </div>

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

          {(formData.mode === 'Online' || formData.mode === 'Hybrid') && (
            <div className="form-group">
              <label className="form-label">Online Meeting Link</label>
              <input type="url" name="meetingLink" className="form-input" value={formData.meetingLink} onChange={handleInputChange} />
            </div>
          )}

          {(formData.mode === 'Offline' || formData.mode === 'Hybrid') && (
            <div className="form-group">
              <label className="form-label">Physical Location</label>
              <input type="text" name="location" className="form-input" value={formData.location} onChange={handleInputChange} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input type="text" name="tags" className="form-input" value={formData.tags} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Update Banner Image</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ height: '100px', width: '200px', border: '2px dashed var(--border-color)', borderRadius: '8px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FiUpload style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }} />
                )}
                <input type="file" accept="image/*" onChange={handleBannerChange} style={{ position: 'absolute', opacity: 0, cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0 }} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '0.85rem', fontSize: '0.95rem', marginTop: '1rem' }}>
            {saving ? 'Saving Changes...' : 'Save Workshop Updates'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default EditWorkshop;
