import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Camera,
  User,
  FileText,
  MapPin,
  Plus,
  X,
  Clock,
  Link2,
  ArrowLeft,
  ArrowRight,
  Check
} from 'lucide-react';
import '../../styles/user/auth.css';
import '../../styles/user/profile.css';

const TEACH_SUGGESTIONS = [
  // Tech & Digital
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'UI/UX Design', 
  'CSS / Tailwind', 'System Architecture', 'Data Structures', 'PostgreSQL', 
  'Docker', 'Git', 'AI & Machine Learning', 'Mobile App Dev', 'Game Dev', 

  // Creative & Media
  'Graphic Design', 'Figma & Prototyping', 'Photography', 'Video Editing', 
  'Digital Illustration', '3D Modeling & Blender', 'Audio Production', 

  // Music, Dance & Arts
  'Guitar', 'Piano & Keyboard', 'Vocal Training', 'Music Production', 
  'Hip-Hop Dance', 'Salsa & Contemporary Dance', 'Drawing & Sketching', 

  // Languages & Academics
  'English Conversation', 'Spanish', 'French', 'German', 'Mandarin', 
  'Japanese', 'Hindi', 'Mathematics', 'Physics', 'History & Philosophy', 

  // Business & Career
  'Public Speaking', 'Creative Writing', 'Content Creation & YouTube', 
  'Social Media Marketing', 'SEO & Growth Hacking', 'Entrepreneurship', 
  'Financial Literacy', 'Project Management', 

  // Sports, Fitness & Lifestyle
  'Yoga & Mindfulness', 'Calisthenics & Fitness', 'Personal Nutrition', 
  'Chess & Strategy', 'Cooking & Baking', 'Basketball', 'Swimming'
];

const LEARN_SUGGESTIONS = [
  // Tech & Digital
  'Next.js', 'GraphQL', 'AI / Machine Learning', 'Rust', 'Web3 / Solidity', 
  'Cloud Infrastructure', 'Cyber Security', 'Mobile App Dev', 'DevOps', 

  // Creative & Design
  'Figma & UI/UX', 'Digital Painting', 'Photography & Composition', 
  'Video Editing & Motion Graphics', '3D Animation', 

  // Music & Performing Arts
  'Acoustic Guitar', 'Piano & Music Theory', 'Music Production', 'Dance Choreography', 

  // Business & Personal Development
  'Public Speaking', 'Creative Writing', 'Content Creation & Storytelling', 
  'Digital Marketing', 'Startup Growth', 'Personal Finance', 

  // Languages & Lifestyle
  'Spanish', 'French', 'Japanese', 'German', 'Mandarin', 'Hindi', 
  'Yoga & Meditation', 'Culinary Arts & Baking', 'Chess & Tactics'
];

const INTEREST_SUGGESTIONS = [
  'Full-Stack Dev', 'AI & Machine Learning', 'UI/UX & Design', 'Open Source', 
  'Mobile App Dev', 'Data Science', 'Cyber Security', 'Cloud & DevOps', 
  'Game Dev & 3D', 'Web3 & Blockchain', 'Music & Songwriting', 
  'Fitness & Bodybuilding', 'Photography & Filmmaking', 'Cooking & Gastronomy', 
  'Reading & Literature', 'Travel & Cultures', 'Business & Startups', 
  'Digital Art & Illustration', 'Sports & Athletics', 'Languages & Linguistics', 
  'Public Speaking & Podcasting', 'Gaming & Esports', 'Philosophy & Psychology', 
  'Yoga & Mindfulness'
];

const LANGUAGE_SUGGESTIONS = [
  'English', 'Spanish', 'French', 'German', 'Hindi', 
  'Mandarin', 'Japanese', 'Arabic', 'Portuguese', 'Russian', 'Italian', 'Korean'
];

const AVAILABILITY_OPTIONS = [
  'Weekdays', 'Weekends', 'Mornings', 'Afternoons', 'Evenings', 'Flexible'
];

const Onboarding = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Local profile states
  const [profile, setProfile] = useState({
    username: '',
    profilePhoto: '',
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
    profileCompletion: 0,
  });

  // Tag inputs helper states
  const [skillTeachInput, setSkillTeachInput] = useState('');
  const [skillLearnInput, setSkillLearnInput] = useState('');
  const [langInput, setLangInput] = useState('');

  // Fetch or create profile draft on mount
  useEffect(() => {
    const fetchDraftProfile = async () => {
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
        setError('Failed to fetch profile settings. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchDraftProfile();
  }, []);

  // Handle local state text input updates
  const handleTextChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  // Handle social links updates
  const handleSocialChange = (e) => {
    setProfile({
      ...profile,
      socialLinks: {
        ...profile.socialLinks,
        [e.target.name]: e.target.value,
      },
    });
    if (error) setError('');
  };

  // Save current step data (save draft) to the backend on Next
  const saveStepDraft = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.put('/profile', profile);
      if (response.data?.status === 'success') {
        setProfile(response.data.profile);
        return true;
      }
    } catch (err) {
      setError(err.message || 'Failed to save progress. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step movement handlers
  const handleNext = async () => {
    // Step 2 validations
    if (step === 2) {
      if (!profile.username || profile.username.trim().length < 3) {
        setError('Username must be at least 3 characters long.');
        return;
      }
      if (profile.headline && profile.headline.length > 100) {
        setError('Headline cannot exceed 100 characters.');
        return;
      }
      if (profile.bio && profile.bio.length > 500) {
        setError('Bio cannot exceed 500 characters.');
        return;
      }
    }

    // Step 3 validations (must define at least one skill to teach)
    if (step === 3 && profile.skillsToTeach.length === 0) {
      setError('Please add at least one skill you can teach.');
      return;
    }

    // Step 4 validations (must define at least one skill to learn)
    if (step === 4 && profile.skillsToLearn.length === 0) {
      setError('Please add at least one skill you want to learn.');
      return;
    }

    // Save state draft to backend database
    const saved = await saveStepDraft();
    if (saved) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  // Complete onboarding final submit
  const handleComplete = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.put('/profile', {
        ...profile,
        onboardingCompleted: true,
      });

      if (response.data?.status === 'success') {
        // Sync context state
        updateUser({
          onboardingCompleted: true,
          username: response.data.profile.username,
        });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  // Profile image upload handler (Step 1)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.status === 'success') {
        setProfile((prev) => ({
          ...prev,
          profilePhoto: response.data.profilePhoto,
          profileCompletion: response.data.profile.profileCompletion,
        }));
      }
    } catch (err) {
      setError(err.message || 'Image upload failed. Ensure it is an image and under 5MB.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic tags handlers (Skills & Languages)
  const addTag = (type, input, setInput) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    if (profile[type].includes(trimmed)) {
      setError(`"${trimmed}" has already been added.`);
      return;
    }

    setProfile({
      ...profile,
      [type]: [...profile[type], trimmed],
    });
    setInput('');
    setError('');
  };

  const removeTag = (type, tagToRemove) => {
    setProfile({
      ...profile,
      [type]: profile[type].filter((tag) => tag !== tagToRemove),
    });
  };

  // Toggles for card chips (Interests & Availability)
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
  };

  // Loader state check
  if (fetchLoading) {
    return (
      <div className="auth-wrapper">
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      {/* Onboarding Wizard Card */}
      <div className="onboarding-card glass">
        
        {/* Progress Bar Header */}
        <div className="progress-container">
          <div className="progress-header">
            <span>Step {step} of 9</span>
            <span>Completion: {profile.profileCompletion}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${(step / 9) * 100}%` }}></div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="step-content">
          {step === 1 && (
            <div>
              <h2 className="step-title text-gradient">Set Up Profile Photo</h2>
              <p className="step-subtitle">Upload a clear photo to help others recognize you.</p>
              
              <div className="photo-upload-container">
                <label className="avatar-preview-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt="Avatar Preview"
                      className="avatar-img"
                    />
                  ) : (
                    <div className="avatar-placeholder">👤</div>
                  )}
                  <div className="upload-overlay">
                    <Camera size={16} style={{ marginRight: '4px' }} /> Upload
                  </div>
                </label>
                
                {loading && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Uploading photo...
                  </span>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="step-title text-gradient">Personal Details</h2>
              <p className="step-subtitle">Establish your identity, headline, and bio introduction.</p>
              
              <div className="auth-form" style={{ gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="username">
                    Unique Username *
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="form-input"
                      placeholder="username"
                      value={profile.username}
                      onChange={handleTextChange}
                      required
                    />
                    <User className="form-input-icon" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="headline">
                    Headline
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      type="text"
                      id="headline"
                      name="headline"
                      className="form-input"
                      placeholder="e.g. Design Student | Full Stack Enthusiast"
                      value={profile.headline}
                      onChange={handleTextChange}
                    />
                    <FileText className="form-input-icon" />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {profile.headline?.length || 0}/100 characters
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="location">
                    Location
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      type="text"
                      id="location"
                      name="location"
                      className="form-input"
                      placeholder="e.g. Mumbai, India"
                      value={profile.location}
                      onChange={handleTextChange}
                    />
                    <MapPin className="form-input-icon" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bio">
                    Short Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    className="form-input"
                    style={{ paddingLeft: '1rem', minHeight: '100px', resize: 'vertical' }}
                    placeholder="Tell us about yourself, your learning goals, or what you like to work on..."
                    value={profile.bio}
                    onChange={handleTextChange}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {profile.bio?.length || 0}/500 characters
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="step-title text-gradient">Skills I Can Teach *</h2>
              <p className="step-subtitle">List subjects or technologies you can help others learn.</p>
              
              {/* Active Removable Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', minHeight: '38px' }}>
                {profile.skillsToTeach.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>No skills added yet. Type below or select from suggestions.</span>
                ) : (
                  profile.skillsToTeach.map((tag) => (
                    <div key={tag} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => removeTag('skillsToTeach', tag)} 
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0 }}
                        title="Remove skill"
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Custom Input Field & Add Button */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Add Custom Skill</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. React, Python..."
                    value={skillTeachInput}
                    onChange={(e) => setSkillTeachInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('skillsToTeach', skillTeachInput, setSkillTeachInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => addTag('skillsToTeach', skillTeachInput, setSkillTeachInput)}
                    style={{ shrink: 0 }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} /> Add
                  </button>
                </div>
              </div>

              {/* Clickable Suggestions */}
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>Suggested Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {TEACH_SUGGESTIONS.map((sug) => {
                    const isAdded = profile.skillsToTeach.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        className={`btn ${isAdded ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => {
                          if (isAdded) {
                            removeTag('skillsToTeach', sug);
                          } else {
                            setProfile((prev) => ({ ...prev, skillsToTeach: [...prev.skillsToTeach, sug] }));
                          }
                        }}
                        style={{ borderRadius: 'var(--radius-pill, 20px)', fontSize: '0.875rem' }}
                      >
                        {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="step-title text-gradient">Skills I Want to Learn *</h2>
              <p className="step-subtitle">List topics, tools, or subjects you wish to learn.</p>
              
              {/* Active Removable Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', minHeight: '38px' }}>
                {profile.skillsToLearn.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>No skills added yet. Type below or select from suggestions.</span>
                ) : (
                  profile.skillsToLearn.map((tag) => (
                    <div key={tag} className="badge-pill" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => removeTag('skillsToLearn', tag)} 
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0 }}
                        title="Remove skill"
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Custom Input Field & Add Button */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Add Custom Skill to Learn</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Next.js, AI..."
                    value={skillLearnInput}
                    onChange={(e) => setSkillLearnInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('skillsToLearn', skillLearnInput, setSkillLearnInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => addTag('skillsToLearn', skillLearnInput, setSkillLearnInput)}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} /> Add
                  </button>
                </div>
              </div>

              {/* Clickable Suggestions */}
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>Suggested Topics</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {LEARN_SUGGESTIONS.map((sug) => {
                    const isAdded = profile.skillsToLearn.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        className={`btn ${isAdded ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => {
                          if (isAdded) {
                            removeTag('skillsToLearn', sug);
                          } else {
                            setProfile((prev) => ({ ...prev, skillsToLearn: [...prev.skillsToLearn, sug] }));
                          }
                        }}
                        style={{ borderRadius: 'var(--radius-pill, 20px)', fontSize: '0.875rem' }}
                      >
                        {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="step-title text-gradient">Choose Interests</h2>
              <p className="step-subtitle">Select categories you are passionate about.</p>
              
              {/* Active Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', minHeight: '38px' }}>
                {profile.interests.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>No interests selected yet.</span>
                ) : (
                  profile.interests.map((interest) => (
                    <div key={interest} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      <span>{interest}</span>
                      <button 
                        type="button" 
                        onClick={() => toggleSelection('interests', interest)} 
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0 }}
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Suggestions Grid */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {INTEREST_SUGGESTIONS.map((interest) => {
                  const isSelected = profile.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => toggleSelection('interests', interest)}
                      style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.875rem' }}
                    >
                      {isSelected ? `✓ ${interest}` : `+ ${interest}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="step-title text-gradient">Languages</h2>
              <p className="step-subtitle">Add languages you speak to connect with peer partners.</p>
              
              {/* Active Removable Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', minHeight: '38px' }}>
                {profile.languages.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>No languages added yet.</span>
                ) : (
                  profile.languages.map((tag) => (
                    <div key={tag} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => removeTag('languages', tag)} 
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0 }}
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Custom Input Field */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Add Custom Language</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. French, Japanese..."
                    value={langInput}
                    onChange={(e) => setLangInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('languages', langInput, setLangInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => addTag('languages', langInput, setLangInput)}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} /> Add
                  </button>
                </div>
              </div>

              {/* Language Suggestions */}
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>Suggested Languages</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {LANGUAGE_SUGGESTIONS.map((sug) => {
                    const isAdded = profile.languages.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        className={`btn ${isAdded ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => {
                          if (isAdded) {
                            removeTag('languages', sug);
                          } else {
                            setProfile((prev) => ({ ...prev, languages: [...prev.languages, sug] }));
                          }
                        }}
                        style={{ borderRadius: 'var(--radius-pill, 20px)', fontSize: '0.875rem' }}
                      >
                        {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <h2 className="step-title text-gradient">Select Availability</h2>
              <p className="step-subtitle">Toggle your general schedule to coordinate peer syncs.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
                {AVAILABILITY_OPTIONS.map((time) => {
                  const isSelected = profile.availability.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => toggleSelection('availability', time)}
                      style={{
                        padding: '1rem',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        borderRadius: 'var(--radius-input)',
                        fontWeight: 600
                      }}
                    >
                      <Clock style={{ width: '18px', height: '18px' }} />
                      <span>{time}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 8 && (
            <div>
              <h2 className="step-title text-gradient">Connect Social Links</h2>
              <p className="step-subtitle">Connect your portfolios to demonstrate your expertise.</p>
              
              <div className="auth-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <div className="form-input-wrapper">
                    <input
                      type="url"
                      name="github"
                      className="form-input"
                      placeholder="https://github.com/..."
                      value={profile.socialLinks.github}
                      onChange={handleSocialChange}
                    />
                    <Link2 className="form-input-icon" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">LinkedIn URL</label>
                  <div className="form-input-wrapper">
                    <input
                      type="url"
                      name="linkedin"
                      className="form-input"
                      placeholder="https://linkedin.com/in/..."
                      value={profile.socialLinks.linkedin}
                      onChange={handleSocialChange}
                    />
                    <Link2 className="form-input-icon" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Portfolio Website</label>
                  <div className="form-input-wrapper">
                    <input
                      type="url"
                      name="portfolio"
                      className="form-input"
                      placeholder="https://mywebsite.com"
                      value={profile.socialLinks.portfolio}
                      onChange={handleSocialChange}
                    />
                    <Link2 className="form-input-icon" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 9 && (
            <div>
              <h2 className="step-title text-gradient">Review Profile Details</h2>
              <p className="step-subtitle">Review details before finalizing registration setup.</p>
              
              <div 
                className="glass" 
                style={{ 
                  padding: '2rem', 
                  borderRadius: 'var(--border-radius-md)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.25rem',
                  border: '1px solid var(--border-color)',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  {profile.profilePhoto ? (
                    <img src={profile.profilePhoto} alt="Review Avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem' }}>👤</div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.2rem' }}>@{profile.username}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{profile.headline || 'No headline set'}</p>
                  </div>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bio</span>
                  <p style={{ fontSize: '0.95rem' }}>{profile.bio || 'No bio written yet.'}</p>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</span>
                  <p style={{ fontSize: '0.95rem' }}>{profile.location || 'Not specified'}</p>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>Skills I Can Teach</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {profile.skillsToTeach.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None specified</span>
                    ) : (
                      profile.skillsToTeach.map((tag) => (
                        <span key={tag} style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.825rem', fontWeight: 600 }}>{tag}</span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>Skills I Want to Learn</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {profile.skillsToLearn.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None specified</span>
                    ) : (
                      profile.skillsToLearn.map((tag) => (
                        <span key={tag} style={{ background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.825rem', fontWeight: 600 }}>{tag}</span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>Interests</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {profile.interests.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None specified</span>
                    ) : (
                      profile.interests.map((tag) => (
                        <span key={tag} style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.825rem', fontWeight: 600 }}>{tag}</span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>Languages</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {profile.languages.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None specified</span>
                    ) : (
                      profile.languages.map((tag) => (
                        <span key={tag} style={{ background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.825rem', fontWeight: 600 }}>{tag}</span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>Availability</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {profile.availability.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None specified</span>
                    ) : (
                      profile.availability.map((tag) => (
                        <span key={tag} style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.825rem', fontWeight: 600 }}>{tag}</span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Controls */}
        <div className="step-actions">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} /> Back
            </button>
          )}

          <div style={{ marginLeft: 'auto' }}>
            {step < 9 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                disabled={loading}
              >
                {loading ? 'Saving...' : <>Next <ArrowRight style={{ width: '16px', height: '16px' }} /></>}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="btn btn-primary"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: '#0F766E', 
                  color: '#FFFFFF',
                  border: '1.5px solid #0F766E',
                  boxShadow: '0 4px 14px rgba(15, 118, 110, 0.28)',
                  fontWeight: 700
                }}
                disabled={loading}
              >
                {loading ? 'Completing...' : <>Complete Profile <Check style={{ width: '16px', height: '16px' }} /></>}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
