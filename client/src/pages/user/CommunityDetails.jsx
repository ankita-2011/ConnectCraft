import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { 
  FiEye, 
  FiLock, 
  FiMapPin, 
  FiUsers, 
  FiTrash, 
  FiUpload, 
  FiArrowLeft,
  FiUser,
  FiCpu,
  FiMessageSquare,
  FiMessageCircle,
  FiPlus,
  FiSend,
  FiTag
} from 'react-icons/fi';
import '../../styles/user/auth.css';
import '../../styles/user/impact.css';
import LevelBadge from '../../components/shared/LevelBadge';

const CommunityDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [communityResources, setCommunityResources] = useState([]);
  const [communityEvents, setCommunityEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab control state
  const [activeTab, setActiveTab] = useState('about');

  // Edit fields state
  const [editFormData, setEditFormData] = useState({
    communityName: '',
    description: '',
    category: '',
    visibility: 'public',
    location: '',
  });
  const [editTags, setEditTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [editRules, setEditRules] = useState([]);
  const [ruleInput, setRuleInput] = useState('');
  
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');

  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  const categoriesList = [
    'Technology', 'Programming', 'Artificial Intelligence', 'Design', 
    'Cybersecurity', 'Blockchain', 'Data Science', 'Business', 
    'Languages', 'Music & Arts', 'Science', 'General Learning'
  ];

  // Discussions state
  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showNewDiscussionForm, setShowNewDiscussionForm] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscContent, setNewDiscContent] = useState('');
  const [newDiscTags, setNewDiscTags] = useState([]);
  const [newDiscTagInput, setNewDiscTagInput] = useState('');
  const [postingDiscussion, setPostingDiscussion] = useState(false);
  const [postingReply, setPostingReply] = useState(false);

  const fetchDiscussions = async (commId) => {
    setDiscussionsLoading(true);
    try {
      const res = await api.get('/discussions', { params: { communityId: commId } });
      if (res.data?.status === 'success') {
        setDiscussions(res.data.discussions || []);
      }
    } catch (err) {
      console.error('Error fetching discussions:', err);
    } finally {
      setDiscussionsLoading(false);
    }
  };

  const handleSelectDiscussion = async (disc) => {
    setSelectedDiscussion(disc);
    setRepliesLoading(true);
    try {
      const res = await api.get(`/discussions/${disc._id}/replies`);
      if (res.data?.status === 'success') {
        setReplies(res.data.replies || []);
      }
    } catch (err) {
      console.error('Error fetching replies:', err);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedDiscussion) return;
    setPostingReply(true);
    try {
      const res = await api.post(`/discussions/${selectedDiscussion._id}/replies`, {
        content: replyText.trim(),
      });
      if (res.data?.status === 'success') {
        setReplies((prev) => [...prev, res.data.reply]);
        setSelectedDiscussion((prev) => ({
          ...prev,
          repliesCount: (prev.repliesCount || 0) + 1,
        }));
        setDiscussions((prev) =>
          prev.map((d) =>
            d._id === selectedDiscussion._id ? { ...d, repliesCount: (d.repliesCount || 0) + 1 } : d
          )
        );
        setReplyText('');
        if (toast?.success) toast.success('Reply posted!');
      }
    } catch (err) {
      if (toast?.error) toast.error(err.response?.data?.message || 'Failed to post reply.');
    } finally {
      setPostingReply(false);
    }
  };

  const handleAddDiscTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = newDiscTagInput.trim().replace(/,/g, '');
      if (val && !newDiscTags.includes(val)) {
        setNewDiscTags([...newDiscTags, val]);
      }
      setNewDiscTagInput('');
    }
  };

  const handleRemoveDiscTag = (tagToRemove) => {
    setNewDiscTags(newDiscTags.filter((t) => t !== tagToRemove));
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!newDiscTitle.trim() || !newDiscContent.trim()) {
      if (toast?.error) toast.error('Title and Content are required.');
      return;
    }
    setPostingDiscussion(true);
    try {
      const res = await api.post('/discussions', {
        communityId: community._id,
        title: newDiscTitle.trim(),
        content: newDiscContent.trim(),
        tags: newDiscTags,
      });
      if (res.data?.status === 'success') {
        setDiscussions([res.data.discussion, ...discussions]);
        setNewDiscTitle('');
        setNewDiscContent('');
        setNewDiscTags([]);
        setShowNewDiscussionForm(false);
        if (toast?.success) toast.success('Discussion posted successfully!');
      }
    } catch (err) {
      if (toast?.error) toast.error(err.response?.data?.message || 'Failed to create discussion.');
    } finally {
      setPostingDiscussion(false);
    }
  };

  // Fetch community details
  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/communities/${slug}`);
      if (response.data?.status === 'success') {
        const comm = response.data.community;
        setCommunity(comm);
        setMembers(response.data.members || []);
        
        // Sync edit fields
        setEditFormData({
          communityName: comm.communityName || '',
          description: comm.description || '',
          category: comm.category || '',
          visibility: comm.visibility || 'public',
          location: comm.location || '',
        });
        setEditTags(comm.tags || []);
        setEditRules(comm.rules || []);

        // Fetch community scoped resources
        try {
          const resResponse = await api.get('/resources', { params: { communityId: comm._id } });
          if (resResponse.data?.status === 'success') {
            setCommunityResources(resResponse.data.resources || []);
          }
        } catch (resErr) {
          console.error('Error fetching community resources:', resErr);
        }

        // Fetch community events
        try {
          const eventsResponse = await api.get('/workshops', { params: { communityId: comm._id } });
          if (eventsResponse.data?.status === 'success') {
            setCommunityEvents(eventsResponse.data.workshops || []);
          }
        } catch (evErr) {
          console.error('Error fetching community events:', evErr);
        }

        // Fetch community leaderboard
        try {
          const lbResponse = await api.get(`/communities/${comm._id}/leaderboard`);
          if (lbResponse.data?.status === 'success') {
            setLeaderboard(lbResponse.data.leaderboard || []);
          }
        } catch (lbErr) {
          console.error('Error fetching community leaderboard:', lbErr);
        }

        // Fetch community discussions
        fetchDiscussions(comm._id);
      }
    } catch  {
      setError('Community not found or server error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="alert-message error">{error || 'Community details loading failed.'}</div>
        <button onClick={() => navigate('/communities')} className="btn-primary" style={{ marginTop: '1.5rem' }}>Back to Communities</button>
      </div>
    );
  }

  const isOwner = community.owner?._id?.toString() === currentUser?._id?.toString();
  const isMember = community.members?.includes(currentUser?._id);
  const isRequested = community.joinRequests?.includes(currentUser?._id);

  // Join Handler
  const handleJoin = async () => {
    try {
      const response = await api.post(`/communities/${community._id}/join`);
      if (response.data?.status === 'success') {
        fetchDetails();
      }
    } catch  {
      // Quiet handle
    }
  };

  // Leave Handler
  const handleLeave = async () => {
    if (isOwner && community.members.length > 1) {
      toast.warning('As the owner, you must transfer ownership to another member before leaving.');
      return;
    }
    
    const doubleConfirm = window.confirm(
      isOwner && community.members.length === 1 
        ? 'Since you are the only member, leaving will permanently DELETE this community. Proceed?'
        : 'Are you sure you want to leave this community?'
    );

    if (!doubleConfirm) return;

    try {
      const response = await api.post(`/communities/${community._id}/leave`);
      if (response.data?.status === 'success') {
        if (response.data.deleted) {
          navigate('/communities');
        } else {
          fetchDetails();
        }
      }
    } catch  {
      // Quiet handle
    }
  };

  // Edit settings
  const handleInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !editTags.includes(val)) {
        setEditTags([...editTags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  const handleAddRule = () => {
    const val = ruleInput.trim();
    if (val && !editRules.includes(val)) {
      setEditRules([...editRules, val]);
    }
    setRuleInput('');
  };

  const handleRemoveRule = (index) => {
    setEditRules(editRules.filter((_, idx) => idx !== index));
  };

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    setError('');

    try {
      const data = new FormData();
      data.append('communityName', editFormData.communityName.trim());
      data.append('description', editFormData.description.trim());
      data.append('category', editFormData.category);
      data.append('visibility', editFormData.visibility);
      data.append('location', editFormData.location.trim());
      
      editTags.forEach(t => data.append('tags', t));
      editRules.forEach(r => data.append('rules', r));

      if (logoFile) data.append('logo', logoFile);
      if (coverFile) data.append('cover', coverFile);

      const response = await api.put(`/communities/${community._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.status === 'success') {
        setEditSuccess('Community updated successfully!');
        fetchDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating community settings.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    const check = window.confirm('CRITICAL: This will permanently delete this community, cover photos, and all memberships. This action CANNOT be undone. Proceed?');
    if (!check) return;

    try {
      const response = await api.delete(`/communities/${community._id}`);
      if (response.data?.status === 'success') {
        navigate('/communities');
      }
    } catch  {
      setError('Could not delete community.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/communities')} 
        className="btn-secondary" 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'max-content', border: 'none' }}
      >
        <FiArrowLeft /> All Communities
      </button>

      {/* Header Banner Section */}
      <div 
        className="community-cover-banner" 
        style={{ 
          backgroundImage: community.coverImage ? `url(${community.coverImage})` : 'linear-gradient(135deg, var(--color-primary-glow) 0%, var(--bg-tertiary) 100%)' 
        }}
      >
        <div className="community-cover-overlay">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', flexWrap: 'wrap' }}>
            
            {/* Logo */}
            <div className="community-logo-circle">
              {community.logo ? (
                <img src={community.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                community.communityName.slice(0, 2).toUpperCase()
              )}
            </div>

            {/* Info details */}
            <div style={{ flex: 1 }}>
              <span 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  fontSize: '0.7rem', 
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  padding: '0.15rem 0.5rem', 
                  borderRadius: '4px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem'
                }}
              >
                {community.visibility === 'private' ? <FiLock /> : <FiEye />} {community.visibility}
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)', margin: 0 }}>
                {community.communityName}
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.35rem' }}>
                Category: <strong>{community.category}</strong>
              </p>
            </div>

            {/* Join / Leave Action Buttons */}
            <div>
              {isMember ? (
                <button onClick={handleLeave} className="btn-secondary" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  Leave Space
                </button>
              ) : isRequested ? (
                <button className="btn-secondary" disabled style={{ opacity: 0.8 }}>
                  Request Sent
                </button>
              ) : (
                <button onClick={handleJoin} className="btn-primary">
                  {community.visibility === 'private' ? 'Request to Join' : 'Join Community'}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="detail-tabs-bar">
        <button className={`detail-tab-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>About</button>
        <button className={`detail-tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members ({members.length})</button>
        <button className={`detail-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>Leaderboard 🏆</button>
        <button className={`detail-tab-btn ${activeTab === 'discussions' ? 'active' : ''}`} onClick={() => { setActiveTab('discussions'); setSelectedDiscussion(null); }}>Discussions</button>
        <button className={`detail-tab-btn ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>Resources</button>
        <button className={`detail-tab-btn ${activeTab === 'workshops' ? 'active' : ''}`} onClick={() => setActiveTab('workshops')}>Workshops</button>
        {isOwner && (
          <button className={`detail-tab-btn ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>Edit Space</button>
        )}
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'about' && (
        <div className="community-details-grid">
          
          {/* Main info panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--border-radius-md)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Description</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{community.description}</p>
            </div>

            {/* Tags / associated skills list */}
            {community.tags?.length > 0 && (
              <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--border-radius-md)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Associated Skills</h3>
                <div className="badge-flex">
                  {community.tags.map(t => (
                    <span key={t} className="badge-pill" style={{ fontSize: '0.8rem' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Location & Creator info */}
            <div className="profile-side-card glass">
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {community.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiMapPin /> {community.location}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiUser /> Creator: {community.owner?.name}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiUsers /> Members: {community.memberCount}
                </span>
              </div>
            </div>

            {/* Rules list */}
            {community.rules?.length > 0 && (
              <div className="profile-side-card glass">
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Rules</h4>
                <ol style={{ paddingLeft: '1.1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {community.rules.map((rule, idx) => <li key={idx}>{rule}</li>)}
                </ol>
              </div>
            )}

          </div>

        </div>
      )}

      {activeTab === 'members' && (
        <div className="results-grid" style={{ marginTop: '1rem' }}>
          {members.map((member) => {
            const name = member.userId?.name || 'Explorer';
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
            const username = member.username;

            return (
              <div key={member._id} className="hero-feature-card glass" style={{ display: 'flex', flexDirection: 'column', padding: '1.75rem 1.25rem', textAlign: 'center', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                  {member.profilePhoto ? (
                    <img src={member.profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    initials
                  )}
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>@{username}</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minHeight: '36px', marginBottom: '1rem' }}>
                  {member.headline || 'ConnectCraft peer developer'}
                </p>
                <Link to={`/profile/${username}`} className="btn-secondary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem 0', fontWeight: 600 }}>
                  View Profile
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="glass" style={{ padding: '1.5rem 1.25rem', borderRadius: 'var(--border-radius-md)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Top Community Contributors
          </h3>
          
          {leaderboard.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No contributor ranking data available.</p>
          ) : (
            <>
              {/* Desktop & Tablet Table */}
              <div className="leaderboard-table-wrapper">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Member</th>
                      <th>Level</th>
                      <th>Contribution Points</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((item) => (
                      <tr key={item.user._id}>
                        <td>
                          <div className={`leaderboard-rank-pill rank-${item.rank}`}>
                            {item.rank}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>
                              {item.profilePhoto ? (
                                <img src={item.profilePhoto} alt={item.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                item.user.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.user.name}</h4>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{item.username}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <LevelBadge level={item.level} />
                        </td>
                        <td>
                          <strong style={{ color: 'var(--color-primary)' }}>{item.impactScore} pts</strong>
                        </td>
                        <td>
                          <Link to={`/profile/${item.username}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="leaderboard-mobile-cards">
                {leaderboard.map((item) => (
                  <div key={item.user._id} className="leaderboard-mobile-card">
                    <div className="leaderboard-mobile-card-header">
                      <div className={`leaderboard-rank-pill rank-${item.rank}`}>
                        #{item.rank}
                      </div>
                      <LevelBadge level={item.level} />
                    </div>
                    <div className="leaderboard-mobile-card-body">
                      <div className="leaderboard-user-avatar">
                        {item.profilePhoto ? (
                          <img src={item.profilePhoto} alt={item.user.name} />
                        ) : (
                          item.user.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="leaderboard-user-info">
                        <h4>{item.user.name}</h4>
                        <span>@{item.username}</span>
                        <div className="leaderboard-user-points">
                          <strong>{item.impactScore} pts</strong>
                        </div>
                      </div>
                    </div>
                    <Link to={`/profile/${item.username}`} className="btn btn-secondary btn-sm btn-mobile-full" style={{ justifyContent: 'center' }}>
                      View Profile
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Community Knowledge Library ({communityResources.length})</h3>
            <Link to={`/resources/create?communityId=${community._id}`} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              + Share Community Resource
            </Link>
          </div>

          {communityResources.length === 0 ? (
            <div className="glass" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: 'var(--border-radius-md)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No learning resources published for this community yet.</p>
              <Link to={`/resources/create?communityId=${community._id}`} className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-block', fontSize: '0.85rem' }}>
                Publish First Resource
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {communityResources.map((res) => (
                <div key={res._id} className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge-pill" style={{ fontSize: '0.65rem' }}>{res.resourceType}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(res.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{res.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{res.shortDescription}</p>
                  <Link to={`/resources/${res._id}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', marginTop: 'auto', width: 'max-content' }}>
                    View Resource
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'workshops' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Community Workshops & Events ({communityEvents.length})</h3>
            <Link to={`/workshops/create?communityId=${community._id}`} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              + Organize Community Event
            </Link>
          </div>

          {communityEvents.length === 0 ? (
            <div className="glass" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: 'var(--border-radius-md)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No workshops or events organized for this community yet.</p>
              <Link to={`/workshops/create?communityId=${community._id}`} className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-block', fontSize: '0.85rem' }}>
                Organize First Event
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {communityEvents.map((ws) => (
                <div key={ws._id} className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge-pill" style={{ fontSize: '0.65rem' }}>{ws.eventType}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>{new Date(ws.date).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{ws.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{ws.shortDescription}</p>
                  <Link to={`/workshops/${ws._id}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', marginTop: 'auto', width: 'max-content' }}>
                    View Event
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Sub Header / Thread Back / New Thread Button */}
          {selectedDiscussion ? (
            <button
              onClick={() => setSelectedDiscussion(null)}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'max-content' }}
            >
              <FiArrowLeft /> Back to Discussions
            </button>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Community Discussions ({discussions.length})
              </h3>
              {isMember && !showNewDiscussionForm && (
                <button
                  onClick={() => setShowNewDiscussionForm(true)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <FiPlus /> Start Discussion
                </button>
              )}
            </div>
          )}

          {/* Create Discussion Form */}
          {!selectedDiscussion && showNewDiscussionForm && (
            <div className="glass" style={{ padding: '1.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Start a New Discussion</h4>
                <button onClick={() => setShowNewDiscussionForm(false)} className="btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>Cancel</button>
              </div>

              <form onSubmit={handleCreateDiscussion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Discussion Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Best practices for optimizing React component re-renders"
                    value={newDiscTitle}
                    onChange={(e) => setNewDiscTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Content *</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Share your thoughts, ask questions, or start a debate..."
                    value={newDiscContent}
                    onChange={(e) => setNewDiscContent(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Tags (Press Enter or Comma)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. React, Performance, Frontend"
                    value={newDiscTagInput}
                    onChange={(e) => setNewDiscTagInput(e.target.value)}
                    onKeyDown={handleAddDiscTag}
                  />
                  {newDiscTags.length > 0 && (
                    <div className="badge-flex" style={{ marginTop: '0.5rem' }}>
                      {newDiscTags.map((t) => (
                        <span key={t} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                          {t}
                          <button type="button" onClick={() => handleRemoveDiscTag(t)} style={{ border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" disabled={postingDiscussion} style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
                    {postingDiscussion ? 'Posting...' : 'Post Discussion'}
                  </button>
                  <button type="button" onClick={() => setShowNewDiscussionForm(false)} className="btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEWING SINGLE THREAD & REPLIES */}
          {selectedDiscussion && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Thread main post card */}
              <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{selectedDiscussion.title}</h2>
                  {selectedDiscussion.isPinned && (
                    <span className="badge-pill" style={{ backgroundColor: 'var(--color-primary-glow)', color: 'var(--color-primary)', fontSize: '0.7rem' }}>
                      Pinned 📌
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Posted by {selectedDiscussion.author?.name || 'Community Member'}
                  </span>
                  <span>•</span>
                  <span>{new Date(selectedDiscussion.createdAt).toLocaleDateString()}</span>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
                  {selectedDiscussion.content}
                </p>

                {selectedDiscussion.tags?.length > 0 && (
                  <div className="badge-flex" style={{ marginTop: '0.5rem' }}>
                    {selectedDiscussion.tags.map((t) => (
                      <span key={t} className="badge-pill" style={{ fontSize: '0.75rem' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Replies Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiMessageSquare /> Replies ({replies.length})
                </h4>

                {/* Reply Form */}
                {isMember ? (
                  <form onSubmit={handlePostReply} className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Write your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={postingReply || !replyText.trim()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'max-content', padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                    >
                      <FiSend /> {postingReply ? 'Posting...' : 'Post Reply'}
                    </button>
                  </form>
                ) : (
                  <div className="alert-message error" style={{ fontSize: '0.85rem' }}>
                    You must join this community to participate in discussions.
                  </div>
                )}

                {/* Replies List */}
                {repliesLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading replies...</div>
                ) : replies.length === 0 ? (
                  <div className="glass" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--border-radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No replies yet. Be the first to join the conversation!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {replies.map((r) => (
                      <div key={r._id} className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                          <strong style={{ color: 'var(--color-primary)' }}>{r.author?.name || 'Member'}</strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                          {r.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LIST OF DISCUSSIONS */}
          {!selectedDiscussion && (
            <div>
              {discussionsLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading discussions...</div>
              ) : discussions.length === 0 ? (
                <div className="glass" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: 'var(--border-radius-md)' }}>
                  <FiMessageSquare style={{ fontSize: '2.5rem', color: 'var(--color-primary)', marginBottom: '1rem' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No discussions yet</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Be the first to start a topic or ask a question in this community!
                  </p>
                  {isMember && (
                    <button onClick={() => setShowNewDiscussionForm(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                      + Start First Discussion
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {discussions.map((disc) => (
                    <div
                      key={disc._id}
                      className="glass"
                      style={{
                        padding: '1.5rem',
                        borderRadius: 'var(--border-radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        border: disc.isPinned ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {disc.isPinned && (
                            <span className="badge-pill" style={{ backgroundColor: 'var(--color-primary-glow)', color: 'var(--color-primary)', fontSize: '0.65rem' }}>
                              Pinned 📌
                            </span>
                          )}
                          <h4
                            onClick={() => handleSelectDiscussion(disc)}
                            style={{ fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)' }}
                          >
                            {disc.title}
                          </h4>
                        </div>
                        <span className="badge-pill" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <FiMessageCircle /> {disc.repliesCount || 0} replies
                        </span>
                      </div>

                      <p
                        onClick={() => handleSelectDiscussion(disc)}
                        style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {disc.content}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {disc.tags?.map((t) => (
                            <span key={t} className="badge-pill" style={{ fontSize: '0.7rem' }}>{t}</span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>By <strong>{disc.author?.name || 'Member'}</strong></span>
                          <span>{new Date(disc.createdAt).toLocaleDateString()}</span>
                          <button
                            onClick={() => handleSelectDiscussion(disc)}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            Join Discussion →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Settings Edit tab */}
      {activeTab === 'edit' && isOwner && (
        <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', maxWidth: '720px', margin: '1rem auto 0' }}>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Edit Community Settings</h3>
          
          {editSuccess && <div className="alert-message success" style={{ marginBottom: '1.5rem' }}>{editSuccess}</div>}

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Cover / Logo update previews */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Update Logo</label>
                <div style={{ width: '70px', height: '70px', border: '2px dashed var(--border-color)', borderRadius: '8px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', marginTop: '0.25rem' }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : community.logo ? (
                    <img src={community.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FiUpload />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} style={{ position: 'absolute', opacity: 0, cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0 }} />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Update Cover Banner</label>
                <div style={{ height: '70px', border: '2px dashed var(--border-color)', borderRadius: '8px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', marginTop: '0.25rem' }}>
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : community.coverImage ? (
                    <img src={community.coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FiUpload />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} style={{ position: 'absolute', opacity: 0, cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0 }} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Community Name</label>
              <input type="text" name="communityName" className="form-input" value={editFormData.communityName} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Description</label>
              <textarea name="description" className="form-input" rows={4} value={editFormData.description} onChange={handleInputChange} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Category</label>
                <select name="category" className="filter-select" value={editFormData.category} onChange={handleInputChange}>
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Visibility</label>
                <select name="visibility" className="filter-select" value={editFormData.visibility} onChange={handleInputChange}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Location</label>
              <input type="text" name="location" className="form-input" value={editFormData.location} onChange={handleInputChange} />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Tags (Press Enter)</label>
              <input type="text" className="form-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} />
              <div className="badge-flex" style={{ marginTop: '0.5rem' }}>
                {editTags.map(t => (
                  <span key={t} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem' }}>
                    {t}
                    <button type="button" onClick={() => handleRemoveTag(t)} style={{ border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Rules</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" className="form-input" placeholder="Add rule" value={ruleInput} onChange={(e) => setRuleInput(e.target.value)} />
                <button type="button" onClick={handleAddRule} className="btn-secondary" style={{ padding: '0 1rem' }}>Add</button>
              </div>
              <ol style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {editRules.map((rule, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{rule}</span>
                      <button type="button" onClick={() => handleRemoveRule(idx)} style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>×</button>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" disabled={editLoading} style={{ flex: 1, padding: '0.75rem 0' }}>
                {editLoading ? 'Saving...' : 'Save Settings'}
              </button>
              
              <button type="button" onClick={handleDelete} className="btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiTrash /> Delete Space
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
};

export default CommunityDetails;
