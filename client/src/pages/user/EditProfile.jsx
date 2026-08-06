import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FiUser, 
  FiFileText, 
  FiMapPin, 
  FiPlus, 
  FiX, 
  FiCamera, 
  FiLink, 
  FiSave, 
  FiEye,
  FiClock,
  FiTrash2
} from 'react-icons/fi';
import { getInitials } from '../../utils/avatar';
import '../../styles/user/profile.css';
import '../../styles/user/auth.css';

const INTEREST_OPTIONS = [
  'AI & Technology', 'Software & Web Dev', 'UI/UX & Design', 'Digital Art & Animation',
  'Music & Songwriting', 'Dance & Choreography', 'Fitness & Calisthenics', 'Yoga & Mindfulness',
  'Photography & Video', 'Cooking & Gastronomy', 'Reading & Writing', 'Business & Startups',
  'Public Speaking', 'Content Creation & YouTube', 'Languages & Cultures', 'Gaming & Esports',
  'Sports & Athletics', 'Chess & Strategy', 'Personal Finance & Investing', 'Philosophy & Psychology'
];

const AVAILABILITY_OPTIONS = [
  'Weekdays', 'Weekends', 'Morning', 'Afternoon', 'Evening', 'Flexible'
];

const EditProfile = () => {
  const { updateUser: updateAuthContextUser } = useAuth();

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local profile state
  const [profile, setProfile] = useState({
    username: '',
    profilePhoto: '',
    coverPhoto: '',
    headline: '',
    bio: '',
    location: '',
    skillsToTeach: [],
    skillsToLearn: [],
    interests: [],
    languages: [],
    availability: [],
    socialLinks: {
      github: '',
      linkedin: '',
      portfolio: '',
      dribbble: '',
      youtube: '',
      instagram: '',
      website: '',
    },
  });

  // Tag helper inputs
  const [skillTeachInput, setSkillTeachInput] = useState('');
  const [skillLearnInput, setSkillLearnInput] = useState('');
  const [langInput, setLangInput] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/me');
        if (response.data?.status === 'success' && response.data?.profile) {
          const p = response.data.profile;
          setProfile({
            ...p,
            socialLinks: {
              github: p.socialLinks?.github || '',
              linkedin: p.socialLinks?.linkedin || '',
              portfolio: p.socialLinks?.portfolio || '',
              dribbble: p.socialLinks?.dribbble || '',
              youtube: p.socialLinks?.youtube || '',
              instagram: p.socialLinks?.instagram || '',
              website: p.socialLinks?.website || '',
            }
          });
        }
      } catch  {
        setError('Failed to load profile details.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleTextChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSocialChange = (e) => {
    setProfile({
      ...profile,
      socialLinks: {
        ...profile.socialLinks,
        [e.target.name]: e.target.value,
      },
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Upload Profile Avatar Photo
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.status === 'success') {
        setProfile((prev) => ({
          ...prev,
          profilePhoto: response.data.profilePhoto,
        }));
        setSuccess('Avatar photo updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Avatar upload failed.');
    } finally {
      setLoading(false);
    }
  };

  // Remove Profile Avatar Photo
  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove profile photo and reset to initials?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete('/profile/photo');
      if (response.data?.status === 'success') {
        setProfile((prev) => ({
          ...prev,
          profilePhoto: '',
        }));
        setSuccess('Profile photo removed successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to remove profile photo.');
    } finally {
      setLoading(false);
    }
  };

  // Upload Cover Photo Banner
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('cover', file);

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/profile/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.status === 'success') {
        setProfile((prev) => ({
          ...prev,
          coverPhoto: response.data.coverPhoto,
        }));
        setSuccess('Cover photo updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Cover upload failed.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection chips
  const toggleSelection = (type, value) => {
    const exists = profile[type].includes(value);
    let updated = [];
    if (exists) {
      updated = profile[type].filter((item) => item !== value);
    } else {
      updated = [...profile[type], value];
    }
    setProfile({
      ...profile,
      [type]: updated,
    });
    if (success) setSuccess('');
  };

  // Tag list controllers
  const addTag = (type, input, setInput) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (profile[type].includes(trimmed)) return;

    setProfile({
      ...profile,
      [type]: [...profile[type], trimmed],
    });
    setInput('');
    if (success) setSuccess('');
  };

  const removeTag = (type, tagToRemove) => {
    setProfile({
      ...profile,
      [type]: profile[type].filter((tag) => tag !== tagToRemove),
    });
    if (success) setSuccess('');
  };

  // Submit save edits
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validations
    if (!profile.username || profile.username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      setLoading(false);
      return;
    }
    if (profile.headline && profile.headline.length > 100) {
      setError('Headline cannot exceed 100 characters.');
      setLoading(false);
      return;
    }
    if (profile.bio && profile.bio.length > 500) {
      setError('Bio cannot exceed 500 characters.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.put('/profile', profile);
      if (response.data?.status === 'success') {
        setProfile(response.data.profile);
        // Sync context in case username changed
        updateAuthContextUser({
          username: response.data.profile.username,
        });
        setSuccess('Profile updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="auth-wrapper">
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="profile-view-container">
      {/* Visual Header */}
      <div className="edit-profile-header-card glass" style={{ maxWidth: 'var(--max-width-content)', margin: '0 auto 2rem auto', padding: '1.5rem 2rem', borderRadius: 'var(--border-radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Edit Profile</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0' }}>
            Update your personal details, skills, availability, and social links
          </p>
        </div>
        <Link to={`/profile/${profile.username}`} className="edit-profile-view-btn">
          <FiEye style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }} /> View Public Profile
        </Link>
      </div>

      <div className="editor-container">
        {/* Editor navigation sidebar tabs */}
        <aside className="editor-tabs">
          <button
            onClick={() => setActiveTab('general')}
            className={`editor-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          >
            General Details
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`editor-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          >
            Skills & Passions
          </button>
          <button
            onClick={() => setActiveTab('additional')}
            className={`editor-tab-btn ${activeTab === 'additional' ? 'active' : ''}`}
          >
            Additional & Links
          </button>
        </aside>

        {/* Edit fields forms wrapper */}
        <div className="editor-panel glass">
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            {/* General Info */}
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Photo settings section */}
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="avatar-preview-box">
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} id="photoInput" />
                      <label htmlFor="photoInput" style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'block' }}>
                        {profile.profilePhoto ? (
                          <img src={profile.profilePhoto} alt="Preview" className="avatar-img" />
                        ) : (
                          <div className="avatar-placeholder" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                            {getInitials(profile.username || 'User')}
                          </div>
                        )}
                        <div className="upload-overlay"><FiCamera /> {profile.profilePhoto ? 'Change' : 'Upload'}</div>
                      </label>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <label htmlFor="photoInput" className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FiCamera /> {profile.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      {profile.profilePhoto && (
                        <button type="button" onClick={handleRemovePhoto} disabled={loading} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <FiTrash2 /> Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="auth-form" style={{ gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <div className="form-input-wrapper">
                      <input type="text" name="username" className="form-input" value={profile.username} onChange={handleTextChange} required />
                      <FiUser className="form-input-icon" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Headline</label>
                    <div className="form-input-wrapper">
                      <input type="text" name="headline" className="form-input" value={profile.headline} onChange={handleTextChange} placeholder="Professional summary headline" />
                      <FiFileText className="form-input-icon" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <div className="form-input-wrapper">
                      <input type="text" name="location" className="form-input" value={profile.location} onChange={handleTextChange} placeholder="e.g. London, UK" />
                      <FiMapPin className="form-input-icon" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea name="bio" className="form-input" style={{ paddingLeft: '1rem', minHeight: '100px', resize: 'vertical' }} value={profile.bio} onChange={handleTextChange} placeholder="Write a short summary about yourself..." />
                  </div>
                </div>

              </div>
            )}

            {/* Skills & Passions */}
            {activeTab === 'skills' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div className="form-group">
                  <label className="form-label">Skills I Can Teach</label>
                  <div className="tag-input-container">
                    {profile.skillsToTeach.map((tag) => (
                      <div key={tag} className="tag-pill">
                        {tag}
                        <span className="tag-delete-btn" onClick={() => removeTag('skillsToTeach', tag)}><FiX /></span>
                      </div>
                    ))}
                    <input
                      type="text"
                      className="tag-field-input"
                      placeholder="Type a skill and press Enter"
                      value={skillTeachInput}
                      onChange={(e) => setSkillTeachInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag('skillsToTeach', skillTeachInput, setSkillTeachInput);
                        }
                      }}
                    />
                    <button type="button" onClick={() => addTag('skillsToTeach', skillTeachInput, setSkillTeachInput)} style={{ color: 'var(--color-primary)' }}><FiPlus /></button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Skills I Want to Learn</label>
                  <div className="tag-input-container">
                    {profile.skillsToLearn.map((tag) => (
                      <div key={tag} className="tag-pill" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                        {tag}
                        <span className="tag-delete-btn" onClick={() => removeTag('skillsToLearn', tag)}><FiX /></span>
                      </div>
                    ))}
                    <input
                      type="text"
                      className="tag-field-input"
                      placeholder="Type a skill and press Enter"
                      value={skillLearnInput}
                      onChange={(e) => setSkillLearnInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag('skillsToLearn', skillLearnInput, setSkillLearnInput);
                        }
                      }}
                    />
                    <button type="button" onClick={() => addTag('skillsToLearn', skillLearnInput, setSkillLearnInput)} style={{ color: 'var(--color-secondary)' }}><FiPlus /></button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Interests</label>
                  <div className="chip-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                    {INTEREST_OPTIONS.map((interest) => (
                      <div
                        key={interest}
                        className={`chip-card ${profile.interests.includes(interest) ? 'active' : ''}`}
                        onClick={() => toggleSelection('interests', interest)}
                        style={{ padding: '0.85rem 0.5rem', fontSize: '0.9rem' }}
                      >
                        {interest}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Links & Social */}
            {activeTab === 'additional' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div className="form-group">
                  <label className="form-label">Languages Spoken</label>
                  <div className="tag-input-container">
                    {profile.languages.map((tag) => (
                      <div key={tag} className="tag-pill">
                        {tag}
                        <span className="tag-delete-btn" onClick={() => removeTag('languages', tag)}><FiX /></span>
                      </div>
                    ))}
                    <input
                      type="text"
                      className="tag-field-input"
                      placeholder="Type language and press Enter"
                      value={langInput}
                      onChange={(e) => setLangInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag('languages', langInput, setLangInput);
                        }
                      }}
                    />
                    <button type="button" onClick={() => addTag('languages', langInput, setLangInput)} style={{ color: 'var(--color-primary)' }}><FiPlus /></button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Availability</label>
                  <div className="chip-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                    {AVAILABILITY_OPTIONS.map((time) => (
                      <div
                        key={time}
                        className={`chip-card ${profile.availability.includes(time) ? 'active' : ''}`}
                        onClick={() => toggleSelection('availability', time)}
                        style={{ padding: '0.85rem 0.5rem', fontSize: '0.9rem', borderColor: profile.availability.includes(time) ? 'var(--color-secondary)' : '' }}
                      >
                        <FiClock style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        {time}
                      </div>
                    ))}
                  </div>
                </div>

                <h3 className="info-section-title" style={{ marginTop: '1.5rem' }}>Social Networks</h3>
                
                <div className="auth-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">GitHub</label>
                    <div className="form-input-wrapper">
                      <input type="url" name="github" className="form-input" value={profile.socialLinks.github} onChange={handleSocialChange} placeholder="https://github.com/..." />
                      <FiLink className="form-input-icon" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">LinkedIn</label>
                    <div className="form-input-wrapper">
                      <input type="url" name="linkedin" className="form-input" value={profile.socialLinks.linkedin} onChange={handleSocialChange} placeholder="https://linkedin.com/..." />
                      <FiLink className="form-input-icon" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Portfolio Website</label>
                    <div className="form-input-wrapper">
                      <input type="url" name="portfolio" className="form-input" value={profile.socialLinks.portfolio} onChange={handleSocialChange} placeholder="https://website.com" />
                      <FiLink className="form-input-icon" />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Save Buttons Panel */}
            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2rem', borderRadius: 'var(--border-radius-md)' }}
              >
                {loading ? 'Saving...' : <><FiSave /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
