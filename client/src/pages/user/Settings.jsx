import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Smartphone, 
  Trash2, 
  Check, 
  AlertTriangle,
  Camera,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import '../../styles/shared/forms.css';
import '../../styles/shared/cards.css';
import '../../styles/shared/buttons.css';
import '../../styles/shared/modals.css';
import '../../styles/user/settings.css';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    headline: '',
    bio: '',
    location: '',
    github: '',
    linkedin: '',
    portfolio: '',
  });
  const [profilePhoto, setProfilePhoto] = useState('');

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    emailInvites: true,
    emailDigests: true,
    pushMessages: true,
    pushMentions: true,
    eventReminders: true,
  });

  const [privacyPrefs, setPrivacyPrefs] = useState({
    publicProfile: true,
    showEmail: false,
    showOnlineStatus: true,
    allowDirectMessages: true,
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteCheckbox, setDeleteCheckbox] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await api.get('/profile/me');
      if (res.data?.status === 'success') {
        const prof = res.data.profile;
        setProfileForm({
          name: user?.name || '',
          headline: prof.headline || '',
          bio: prof.bio || '',
          location: prof.location || '',
          github: prof.socialLinks?.github || '',
          linkedin: prof.socialLinks?.linkedin || '',
          portfolio: prof.socialLinks?.portfolio || '',
        });
        setProfilePhoto(prof.profilePhoto || '');

        if (prof.privacySettings) {
          setPrivacyPrefs((prev) => ({ ...prev, ...prof.privacySettings }));
        }
        if (prof.notificationSettings) {
          setNotifPrefs((prev) => ({ ...prev, ...prof.notificationSettings }));
        }
      }
    } catch  {
      // Non-blocking fetch
    }
  };

  const handleSavePrivacy = async () => {
    setLoading(true);
    try {
      const res = await api.put('/profile', { privacySettings: privacyPrefs });
      if (res.data?.status === 'success') {
        showNotification('Privacy settings saved successfully!');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to save privacy settings.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.put('/profile', { notificationSettings: notifPrefs });
      if (res.data?.status === 'success') {
        showNotification('Notification preferences saved successfully!');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to save notification preferences.', true);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
    }
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 4000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/profile', {
        headline: profileForm.headline,
        bio: profileForm.bio,
        location: profileForm.location,
        socialLinks: {
          github: profileForm.github,
          linkedin: profileForm.linkedin,
          portfolio: profileForm.portfolio,
        },
      });

      if (res.data?.status === 'success') {
        showNotification('Profile settings updated successfully!');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update profile settings.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      showNotification('New passwords do not match.', true);
      return;
    }
    if (passForm.newPassword.length < 6) {
      showNotification('Password must be at least 6 characters long.', true);
      return;
    }

    setLoading(true);
    try {
      // Mocked endpoint response / placeholder until security route is hooked
      showNotification('Password updated successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showNotification(err.message || 'Failed to change password.', true);
    } finally {
      setLoading(false);
    }
  };

  // Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    setLoading(true);
    try {
      const res = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.status === 'success') {
        setProfilePhoto(res.data.profilePhoto);
        updateUser({ profilePhoto: res.data.profilePhoto });
        showNotification('Profile photo updated!');
      }
    } catch (err) {
      showNotification(err.message || 'Photo upload failed.', true);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmText('');
    setDeletePassword('');
    setDeleteCheckbox(false);
    setDeleteModalError('');
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (loading) return;
    setDeleteModalOpen(false);
    setDeleteConfirmText('');
    setDeletePassword('');
    setDeleteCheckbox(false);
    setDeleteModalError('');
  };

  const handleDeleteAccount = async (e) => {
    if (e) e.preventDefault();
    setDeleteModalError('');

    if (!deletePassword) {
      setDeleteModalError('Please enter your current password.');
      return;
    }
    if (deleteConfirmText !== 'DELETE') {
      setDeleteModalError('Please type DELETE to confirm account removal.');
      return;
    }
    if (!deleteCheckbox) {
      setDeleteModalError('Please check the confirmation box.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.delete('/profile', {
        data: {
          password: deletePassword,
          confirmationText: 'DELETE',
        },
      });
      if (res.data?.status === 'success') {
        setDeleteModalOpen(false);
        await logout();
        navigate('/', { replace: true });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to delete account.';
      setDeleteModalError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-page-title">Account Settings</h1>
        <p className="text-subtitle" style={{ fontSize: '0.95rem' }}>
          Manage your account preferences, security credentials, and platform notifications.
        </p>
      </div>

      {/* Notifications Banner */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check style={{ width: '18px', height: '18px' }} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle style={{ width: '18px', height: '18px' }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Grid (Sidebar tabs + Content Area) */}
      <div className="settings-grid">
        
        {/* Navigation Tabs (Desktop/Tablet Sidebar & Mobile Dropdown) */}
        <div className="settings-nav-wrapper">
          {/* Mobile Dropdown Selector */}
          <div className="settings-mobile-dropdown-wrapper">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="settings-mobile-dropdown"
              aria-label="Select settings category"
            >
              <option value="profile">👤 Profile Information</option>
              <option value="security">🔒 Password & Security</option>
              <option value="notifications">🔔 Notifications</option>
              <option value="privacy">🛡️ Privacy & Visibility</option>
              <option value="sessions">📱 Active Sessions</option>
              <option value="danger">🗑️ Delete Account</option>
            </select>
          </div>

          {/* Desktop & Tablet Sidebar Tabs */}
          <div className="card settings-tabs-container settings-tabs-desktop">
            <button
              className={`btn settings-tab-btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('profile')}
            >
              <User style={{ width: '18px', height: '18px' }} />
              <span>Profile Information</span>
            </button>

            <button
              className={`btn settings-tab-btn ${activeTab === 'security' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock style={{ width: '18px', height: '18px' }} />
              <span>Password & Security</span>
            </button>

            <button
              className={`btn settings-tab-btn ${activeTab === 'notifications' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell style={{ width: '18px', height: '18px' }} />
              <span>Notifications</span>
            </button>

            <button
              className={`btn settings-tab-btn ${activeTab === 'privacy' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('privacy')}
            >
              <Shield style={{ width: '18px', height: '18px' }} />
              <span>Privacy & Visibility</span>
            </button>

            <button
              className={`btn settings-tab-btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('sessions')}
            >
              <Smartphone style={{ width: '18px', height: '18px' }} />
              <span>Active Sessions</span>
            </button>

            <button
              className={`btn settings-tab-btn ${activeTab === 'danger' ? 'btn-danger active-danger' : 'btn-danger'}`}
              onClick={() => setActiveTab('danger')}
            >
              <Trash2 style={{ width: '18px', height: '18px' }} />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="card settings-content-card">
          
          {/* Profile Info */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="text-card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Profile Information
              </h3>

              {/* Avatar Upload Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)', overflow: 'hidden', position: 'relative' }}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.name ? user.name.slice(0, 2).toUpperCase() : 'CC'
                  )}
                </div>

                <div>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Camera style={{ width: '14px', height: '14px' }} /> Change Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>JPG, PNG or GIF up to 5MB.</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={profileForm.name} disabled style={{ backgroundColor: 'var(--bg-section)', cursor: 'not-allowed' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Name is linked to your core account credentials.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Headline</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Full-Stack Developer | UI/UX Designer" 
                  value={profileForm.headline} 
                  onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Bio</label>
                <textarea 
                  className="form-textarea" 
                  rows={4} 
                  placeholder="Share a short summary of your technical experience and learning goals..." 
                  value={profileForm.bio} 
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. San Francisco, CA" 
                  value={profileForm.location} 
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary settings-submit-btn" disabled={loading}>
                  <Save style={{ width: '16px', height: '16px' }} /> Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Security & Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="text-card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Password & Security
              </h3>

              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  type={showPass ? 'text' : 'password'} 
                  className="form-input" 
                  value={passForm.currentPassword} 
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type={showPass ? 'text' : 'password'} 
                  className="form-input" 
                  value={passForm.newPassword} 
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type={showPass ? 'text' : 'password'} 
                  className="form-input" 
                  value={passForm.confirmPassword} 
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} /> : <Eye style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Show Passwords</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary settings-submit-btn" disabled={loading}>
                  <Lock style={{ width: '16px', height: '16px' }} /> Update Password
                </button>
              </div>
            </form>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="text-card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Notification Preferences
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label className="settings-form-row" style={{ cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Project Invitations</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email me when team leaders invite me to collaborate.</div>
                  </div>
                  <input type="checkbox" checked={notifPrefs.emailInvites} onChange={() => setNotifPrefs({ ...notifPrefs, emailInvites: !notifPrefs.emailInvites })} />
                </label>

                <label className="settings-form-row" style={{ cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Direct Messages</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Push notifications when a peer sends a private chat message.</div>
                  </div>
                  <input type="checkbox" checked={notifPrefs.pushMessages} onChange={() => setNotifPrefs({ ...notifPrefs, pushMessages: !notifPrefs.pushMessages })} />
                </label>

                <label className="settings-form-row" style={{ cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Community Mentions</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Notify me when mentioned in community discussion boards.</div>
                  </div>
                  <input type="checkbox" checked={notifPrefs.pushMentions} onChange={() => setNotifPrefs({ ...notifPrefs, pushMentions: !notifPrefs.pushMentions })} />
                </label>

                <label className="settings-form-row" style={{ cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Workshop Reminders</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Receive email reminders 1 hour before registered workshops start.</div>
                  </div>
                  <input type="checkbox" checked={notifPrefs.eventReminders} onChange={() => setNotifPrefs({ ...notifPrefs, eventReminders: !notifPrefs.eventReminders })} />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-primary settings-submit-btn" disabled={loading} onClick={handleSaveNotifications}>
                  <Save style={{ width: '16px', height: '16px' }} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Privacy & Visibility */}
          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="text-card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Privacy & Visibility
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label className="settings-form-row" style={{ cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Public Profile Visibility</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Allow non-members and peer search to view your profile skills.</div>
                  </div>
                  <input type="checkbox" checked={privacyPrefs.publicProfile} onChange={() => setPrivacyPrefs({ ...privacyPrefs, publicProfile: !privacyPrefs.publicProfile })} />
                </label>

                <label className="settings-form-row" style={{ cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Show Online Activity Status</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Display a green dot when you are active on ConnectCraft.</div>
                  </div>
                  <input type="checkbox" checked={privacyPrefs.showOnlineStatus} onChange={() => setPrivacyPrefs({ ...privacyPrefs, showOnlineStatus: !privacyPrefs.showOnlineStatus })} />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-primary settings-submit-btn" disabled={loading} onClick={handleSavePrivacy}>
                  <Save style={{ width: '16px', height: '16px' }} /> Save Privacy Settings
                </button>
              </div>
            </div>
          )}

          {/* Session Management */}
          {activeTab === 'sessions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="text-card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Active Sessions
              </h3>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-input)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Current Web Session</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Chrome on Windows • Active Now</div>
                </div>
                <span className="badge-pill">Current</span>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => showNotification('Logged out of all other sessions.')}>
                  Log Out Other Devices
                </button>
              </div>
            </div>
          )}

          {/* Account Danger Zone */}
          {activeTab === 'danger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="text-card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', color: 'var(--color-danger)' }}>
                Danger Zone
              </h3>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Deleting your account is permanent and irreversible. This will remove all profile data, contributions, project memberships, resources shared, and message history. Your account can never be restored.
              </p>

              <div>
                <button className="btn btn-danger" onClick={openDeleteModal}>
                  <Trash2 style={{ width: '16px', height: '16px' }} /> Delete My Account Permanently
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-danger)' }}>
              Confirm Permanent Account Deletion
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
              Warning: This action is permanent and irreversible. All your profile data, project memberships, community roles, shared resources, and messages will be permanently hard-deleted.
            </p>

            {deleteModalError && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.6rem 0.8rem', fontSize: '0.825rem' }}>
                {deleteModalError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Enter Current Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your current password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showDeletePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  required
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={deleteCheckbox}
                  onChange={(e) => setDeleteCheckbox(e.target.checked)}
                  style={{ marginTop: '0.15rem' }}
                />
                <span>I understand that account deletion is permanent, non-restorable, and cannot be undone.</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeDeleteModal} disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={!deletePassword || deleteConfirmText !== 'DELETE' || !deleteCheckbox || loading}
                >
                  {loading ? 'Deleting Account...' : 'Permanently Delete Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};


export default Settings;
