import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import ProjectInviteModal from '../../components/user/ProjectInviteModal';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiTrash2, 
  FiUserPlus, 
  FiLogOut, 
  FiCode, 
  FiUserMinus,
  FiExternalLink,
  FiCalendar,
  FiVideo
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/projects.css';
import '../../styles/user/impact.css';
import LevelBadge from '../../components/shared/LevelBadge';
import { getInitials } from '../../utils/avatar';


const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [projectResources, setProjectResources] = useState([]);
  const [projectMeetings, setProjectMeetings] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal control states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    agenda: '',
    meetingDate: '',
    durationMinutes: 60,
    platform: 'Google Meet',
    meetingLink: '',
  });
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/projects/${id}`);
      if (response.data?.status === 'success') {
        setProject(response.data.project);
        setMembers(response.data.members || []);
        setPendingInvite(response.data.pendingInvite);

        // Fetch project scoped resources
        try {
          const resResponse = await api.get('/resources', { params: { projectId: id } });
          if (resResponse.data?.status === 'success') {
            setProjectResources(resResponse.data.resources || []);
          }
        } catch (resErr) {
          console.error('Error fetching project resources:', resErr);
        }

        // Fetch project scoped team meetings
        try {
          const meetingsResponse = await api.get(`/projects/${id}/meetings`);
          if (meetingsResponse.data?.status === 'success') {
            setProjectMeetings(meetingsResponse.data.meetings || []);
          }
        } catch (mErr) {
          console.error('Error fetching project meetings:', mErr);
        }
      }
    } catch (err) {
      setError(err.message || 'Could not load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const handleOpenMeetingModal = () => {
    setMeetingForm({
      title: `Team Sync — ${project?.title || ''}`,
      agenda: '',
      meetingDate: '',
      durationMinutes: 60,
      platform: 'Google Meet',
      meetingLink: '',
    });
    setMeetingModalOpen(true);
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.meetingDate || !meetingForm.meetingLink) {
      toast.error('Meeting title, date/time, and meeting link are required.');
      return;
    }
    setSubmittingMeeting(true);
    try {
      const res = await api.post(`/projects/${id}/meetings`, meetingForm);
      if (res.data?.status === 'success') {
        toast.info('Project team meeting scheduled successfully!');
        setMeetingModalOpen(false);
        const meetingsRes = await api.get(`/projects/${id}/meetings`).catch(() => null);
        if (meetingsRes?.data?.status === 'success') {
          setProjectMeetings(meetingsRes.data.meetings || []);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to schedule project meeting.');
    } finally {
      setSubmittingMeeting(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Cancel this project meeting?')) return;
    try {
      const res = await api.delete(`/projects/${id}/meetings/${meetingId}`);
      if (res.data?.status === 'success') {
        toast.info('Meeting cancelled successfully.');
        setProjectMeetings((prev) => prev.filter((m) => m._id !== meetingId));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel meeting.');
    }
  };

  const handleDeleteProject = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this project? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const response = await api.delete(`/projects/${id}`);
      if (response.data?.status === 'success') {
        toast.info('Project deleted successfully.');
        navigate('/projects');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete project.');
    }
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    const confirmRemove = window.confirm(`Remove ${memberName} from this project team?`);
    if (!confirmRemove) return;

    try {
      const response = await api.delete(`/projects/${id}/members/${memberUserId}`);
      if (response.data?.status === 'success') {
        toast.info(`${memberName} removed from project team.`);
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove team member.');
    }
  };

  const confirmLeaveProject = async () => {
    setLeaving(true);
    try {
      const response = await api.post(`/projects/${id}/leave`);
      if (response.data?.status === 'success') {
        toast.info('You have left the project team.');
        setLeaveModalOpen(false);
        navigate('/projects');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to leave project.');
    } finally {
      setLeaving(false);
    }
  };

  const handleAcceptInvite = async (invId) => {
    try {
      const res = await api.post(`/project-invitations/${invId}/accept`);
      if (res.data?.status === 'success') {
        toast.success('Project invitation accepted!');
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Error accepting project invitation.');
    }
  };

  const handleRejectInvite = async (invId) => {
    try {
      const res = await api.post(`/project-invitations/${invId}/reject`);
      if (res.data?.status === 'success') {
        toast.info('Project invitation declined.');
        fetchProjectDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Error rejecting invitation.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="glass" style={{ padding: '3rem 2rem', borderRadius: 'var(--border-radius-lg)' }}>
          <h2 style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>Project Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error || 'Project not found or accessible.'}</p>
          <Link to="/projects" className="btn-primary">Back to Projects</Link>
        </div>
      </div>
    );
  }

  const ownerName = project.owner?.name || 'Project Owner';
  const statusClass = (project.status || 'recruiting').toLowerCase().replace(' ', '-');
  const difficultyClass = (project.difficulty || 'intermediate').toLowerCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Back button */}
      <div>
        <Link to="/projects" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
          <FiArrowLeft /> Back to Workspace
        </Link>
      </div>

      {/* Hero Header Section */}
      <div className="project-details-hero glass">
        <div className="project-hero-cover">
          {project.bannerImage ? (
            <img src={project.bannerImage} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="project-banner-placeholder" style={{ fontSize: '4rem' }}>
              <FiCode />
            </div>
          )}
          <span className={`project-status-badge ${statusClass}`} style={{ top: '1.25rem', right: '1.25rem', fontSize: '0.8rem' }}>
            {project.status}
          </span>
        </div>

        <div className="project-hero-content">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge-pill" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{project.category}</span>
                <span className={`project-difficulty-tag ${difficultyClass}`}>{project.difficulty}</span>
                <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>⏱ {project.estimatedDuration}</span>
                <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>• {project.visibility}</span>
              </div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, margin: '0.3rem 0' }}>{project.title}</h1>
              <p style={{ fontSize: '1.05rem', color: '#334155', marginTop: '0.5rem', lineHeight: 1.5 }}>{project.shortDescription}</p>
            </div>

            {/* Owner Actions / Member Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {project.isOwner ? (
                <>
                  {members.length < project.teamSize ? (
                    <button onClick={() => setInviteModalOpen(true)} className="btn-primary" style={{ padding: '0.65rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                      <FiUserPlus /> Invite Connections
                    </button>
                  ) : (
                    <span className="badge-pill" style={{ padding: '0.65rem 1rem', fontSize: '0.825rem', color: '#D97706', borderColor: 'rgba(217, 119, 6, 0.4)', backgroundColor: 'rgba(217, 119, 6, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                      Team Capacity Full ({members.length}/{project.teamSize})
                    </span>
                  )}
                  <Link to={`/projects/${id}/edit`} className="btn-secondary" style={{ padding: '0.65rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <FiEdit /> Edit
                  </Link>
                  <button onClick={handleDeleteProject} className="btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.65rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <FiTrash2 /> Delete
                  </button>
                </>
              ) : project.isMember ? (
                <button onClick={() => setLeaveModalOpen(true)} className="btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.65rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <FiLogOut /> Leave Project
                </button>
              ) : pendingInvite ? (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-warning)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-warning)', fontWeight: 600 }}>Invited to Team!</span>
                  <button onClick={() => handleAcceptInvite(pendingInvite._id)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Accept</button>
                  <button onClick={() => handleRejectInvite(pendingInvite._id)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}>Reject</button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Grid Layout */}
      <div className="profile-meta-grid">
        
        {/* LEFT COLUMN: Overview, Skills, Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Detailed Overview */}
          <div className="profile-details-card glass">
            <h3 className="info-section-title" style={{ marginTop: 0 }}>Detailed Project Overview</h3>
            <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {project.description}
            </p>

            {/* Required Skills */}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
              <h3 className="info-section-title">Required Tech & Creative Skills</h3>
              <div className="badge-flex">
                {project.requiredSkills?.map((skill) => (
                  <span key={skill} className="badge-pill teach" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
                    {skill}
                  </span>
                )) || <span style={{ color: 'var(--text-muted)' }}>No specific skills specified</span>}
              </div>
            </div>

            {/* Tags */}
            {project.tags?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                <h3 className="info-section-title">Project Tags</h3>
                <div className="badge-flex">
                  {project.tags.map((tag) => (
                    <span key={tag} className="badge-pill" style={{ fontSize: '0.8rem' }}>#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Members Roster Panel */}
          <div className="profile-details-card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="info-section-title" style={{ margin: 0 }}>Project Team Roster ({members.length} / {project.teamSize})</h3>
              <span className="open-positions-pill">
                👥 {project.openPositions} Open Positions
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {members.map((m) => {
                const memUser = m.user || {};
                const memProf = m.userProfile || {};
                const name = memUser.name || 'Team Member';
                const initials = getInitials(name);
                const isOwnerMember = m.role === 'Owner';

                return (
                  <div key={m._id} className="member-roster-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                        {memProf.profilePhoto ? (
                          <img src={memProf.profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{name}</h4>
                          <span className={`badge-pill ${isOwnerMember ? 'teach' : ''}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                            {m.role}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {memProf.headline || 'ConnectCraft member'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {memProf.username && (
                        <Link to={`/profile/${memProf.username}`} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                          View Profile
                        </Link>
                      )}

                      {/* Remove member button for Owner */}
                      {project.isOwner && !isOwnerMember && (
                        <button
                          onClick={() => handleRemoveMember(memUser._id, name)}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.6rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title="Remove collaborator from project"
                        >
                          <FiUserMinus />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Project Scoped Resources Section */}
          <div className="profile-details-card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="info-section-title" style={{ margin: 0 }}>Project Resources & Documentation ({projectResources.length})</h3>
              {(project.isOwner || project.isMember) && (
                <Link to={`/resources/create?projectId=${project._id}`} className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
                  + Attach Resource
                </Link>
              )}
            </div>

            {projectResources.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No documentation or repos attached to this project yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {projectResources.map((res) => (
                  <div key={res._id} className="glass" style={{ padding: '1rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span className="badge-pill" style={{ fontSize: '0.65rem', width: 'max-content' }}>{res.resourceType}</span>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{res.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{res.shortDescription}</p>
                    <Link to={`/resources/${res._id}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', marginTop: 'auto', width: 'max-content' }}>
                      Inspect Resource
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Team Meetings Section */}
          <div className="profile-details-card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="info-section-title" style={{ margin: 0 }}>Project Team Meetings ({projectMeetings.length})</h3>
              {(project.isOwner || project.isMember) && (
                <button onClick={handleOpenMeetingModal} className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  + Schedule Project Meeting
                </button>
              )}
            </div>

            {projectMeetings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No team sync meetings scheduled for this project yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {projectMeetings.map((mtg) => (
                  <div key={mtg._id} className="glass" style={{ padding: '1.15rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge-pill" style={{ fontSize: '0.68rem', fontWeight: 600 }}>{mtg.platform || 'Online Sync'}</span>
                      <span style={{ fontSize: '0.72rem', color: '#0F766E', fontWeight: 600 }}>
                        {new Date(mtg.meetingDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(mtg.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#1C1917' }}>{mtg.title}</h4>
                    {mtg.agenda && <p style={{ fontSize: '0.78rem', color: '#57534E', margin: 0, lineHeight: 1.4 }}>{mtg.agenda}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                      <a href={mtg.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}>
                        <FiExternalLink size={13} /> Join Meeting
                      </a>
                      {(project.isOwner || mtg.createdBy?._id === currentUser?._id) && (
                        <button onClick={() => handleDeleteMeeting(mtg._id)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Metadata Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Owner Card Widget */}
          <div className="profile-side-card glass" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>Project Lead</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {getInitials(ownerName)}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{ownerName}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{project.owner?.email}</p>
                <div style={{ marginTop: '0.35rem' }}>
                  <LevelBadge level={project.ownerProfile?.level || 'Explorer'} showIcon={true} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="profile-side-card glass">
            <h3 className="info-section-title">Project Specifications</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Category:</span>
                <span style={{ fontWeight: 600 }}>{project.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Difficulty:</span>
                <span className={`project-difficulty-tag ${difficultyClass}`}>{project.difficulty}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Est. Duration:</span>
                <span style={{ fontWeight: 600 }}>{project.estimatedDuration}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Team Capacity:</span>
                <span style={{ fontWeight: 600 }}>{members.length} / {project.teamSize}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Visibility:</span>
                <span style={{ fontWeight: 600 }}>{project.visibility}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Launched:</span>
                <span style={{ fontWeight: 600 }}>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Project Invite Modal */}
      <ProjectInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        projectId={id}
        projectTitle={project.title}
        isTeamFull={members.length >= project.teamSize}
        onSuccess={fetchProjectDetails}
      />

      {/* Schedule Project Meeting Modal */}
      {meetingModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem', color: '#1C1917' }}>Schedule Project Team Meeting</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Schedule a private sync meeting with your project team collaborators.
            </p>

            <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Meeting Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sprint Demo & Code Review"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={meetingForm.meetingDate}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Platform</label>
                  <select
                    className="form-input"
                    value={meetingForm.platform}
                    onChange={(e) => setMeetingForm({ ...meetingForm, platform: e.target.value })}
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Jitsi">Jitsi</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Online Meeting Link (URL) *</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingForm.meetingLink}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingLink: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Agenda / Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Share key topics, discussion points, or preparation notes..."
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setMeetingModalOpen(false)} disabled={submittingMeeting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submittingMeeting}>
                  {submittingMeeting ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Project Confirmation Modal */}
      {leaveModalOpen && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center', padding: '2.25rem 1.75rem', borderRadius: '16px' }}>
            <div style={{ width: '58px', height: '58px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1.15rem auto' }}>
              <FiLogOut />
            </div>
            
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.5rem' }}>
              Leave Project Team?
            </h3>
            
            <p style={{ fontSize: '0.875rem', color: '#57534E', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Are you sure you want to leave <strong>"{project?.title}"</strong>? You will lose access to team sync meetings, private project resources, and collaborator access.
            </p>

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setLeaveModalOpen(false)}
                disabled={leaving}
                style={{ padding: '0.65rem 1.35rem', minWidth: '115px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmLeaveProject}
                disabled={leaving}
                style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF', padding: '0.65rem 1.35rem', minWidth: '130px', fontWeight: 600 }}
              >
                {leaving ? 'Leaving...' : 'Yes, Leave Team'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetails;
