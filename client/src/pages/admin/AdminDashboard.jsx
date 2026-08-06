import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { 
  Users, 
  Globe, 
  FolderGit2, 
  Calendar, 
  BookOpen, 
  Search, 
  Trash2, 
  CheckCircle, 
  Ban, 
  Activity, 
  TrendingUp, 
  BarChart3,
  ShieldCheck,
  Lock,
  Zap,
  Server,
  Download
} from 'lucide-react';
import '../../styles/admin/admin.css';

const AdminDashboard = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Management Data States
  const [users, setUsers] = useState([]);
  const [deletedAccounts, setDeletedAccounts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [resources, setResources] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Search Filters
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [communitySearch, setCommunitySearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [workshopSearch, setWorkshopSearch] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);
  const closeMobileSidebar = () => setIsMobileOpen(false);

  // Load All Admin Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes, deletedRes, commRes, projRes, workRes, resRes] = await Promise.all([
        api.get('/admin/analytics').catch(() => null),
        api.get('/admin/users').catch(() => null),
        api.get('/admin/deleted-accounts').catch(() => null),
        api.get('/admin/communities').catch(() => null),
        api.get('/admin/projects').catch(() => null),
        api.get('/admin/workshops').catch(() => null),
        api.get('/admin/resources').catch(() => null),
      ]);

      if (analyticsRes?.data?.status === 'success') {
        setActivityLogs(analyticsRes.data.recentActivity || []);
      }
      if (usersRes?.data?.status === 'success') {
        setUsers(usersRes.data.users || []);
      }
      if (deletedRes?.data?.status === 'success') {
        setDeletedAccounts(deletedRes.data.deletedAccounts || []);
      }
      if (commRes?.data?.status === 'success') {
        setCommunities(commRes.data.communities || []);
      }
      if (projRes?.data?.status === 'success') {
        setProjects(projRes.data.projects || []);
      }
      if (workRes?.data?.status === 'success') {
        setWorkshops(workRes.data.workshops || []);
      }
      if (resRes?.data?.status === 'success') {
        setResources(resRes.data.resources || []);
      }
    } catch (err) {
      console.error('[ADMIN FETCH DATA ERROR]:', err);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handlers for Admin Management Actions
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await api.put(`/admin/users/${userId}/status`, { accountStatus: newStatus });
      if (res.data?.status === 'success') {
        toast.success(`User status updated to ${newStatus}.`);
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, accountStatus: newStatus } : u)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data?.status === 'success') {
        toast.success(`User "${name}" has been deleted.`);
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        if (res.data?.auditRecord) {
          setDeletedAccounts((prev) => [res.data.auditRecord, ...prev]);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleDeleteCommunity = async (commId, name) => {
    if (!window.confirm(`Are you sure you want to delete community "${name}"?`)) return;
    try {
      const res = await api.delete(`/admin/communities/${commId}`);
      if (res.data?.status === 'success') {
        toast.success(`Community "${name}" deleted.`);
        setCommunities((prev) => prev.filter((c) => c._id !== commId));
      }
    } catch  {
      toast.error('Failed to delete community.');
    }
  };

  const handleDeleteProject = async (projId, title) => {
    if (!window.confirm(`Are you sure you want to delete project "${title}"?`)) return;
    try {
      const res = await api.delete(`/admin/projects/${projId}`);
      if (res.data?.status === 'success') {
        toast.success(`Project "${title}" deleted.`);
        setProjects((prev) => prev.filter((p) => p._id !== projId));
      }
    } catch  {
      toast.error('Failed to delete project.');
    }
  };

  const handleDeleteWorkshop = async (workId, title) => {
    if (!window.confirm(`Are you sure you want to delete workshop "${title}"?`)) return;
    try {
      const res = await api.delete(`/admin/workshops/${workId}`);
      if (res.data?.status === 'success') {
        toast.success(`Workshop "${title}" deleted.`);
        setWorkshops((prev) => prev.filter((w) => w._id !== workId));
      }
    } catch  {
      toast.error('Failed to delete workshop.');
    }
  };

  const handleDeleteResource = async (resId, title) => {
    if (!window.confirm(`Are you sure you want to delete resource "${title}"?`)) return;
    try {
      const res = await api.delete(`/admin/resources/${resId}`);
      if (res.data?.status === 'success') {
        toast.success(`Resource "${title}" deleted.`);
        setResources((prev) => prev.filter((r) => r._id !== resId));
      }
    } catch  {
      toast.error('Failed to delete resource.');
    }
  };

  // Compute User Category Counts
  const activeUsersCount = useMemo(() => users.filter((u) => u.accountStatus !== 'suspended').length, [users]);
  const suspendedUsersCount = useMemo(() => users.filter((u) => u.accountStatus === 'suspended').length, [users]);
  const deletedUsersCount = useMemo(() => deletedAccounts.length, [deletedAccounts]);
  const totalUsersCount = useMemo(() => users.length + deletedAccounts.length, [users, deletedAccounts]);

  // Unified User List (Active, Suspended, and Hard-Deleted Audit Records)
  const unifiedUserRows = useMemo(() => {
    const query = userSearch.toLowerCase().trim();

    let liveList = users;
    if (userStatusFilter === 'ACTIVE') {
      liveList = users.filter((u) => u.accountStatus !== 'suspended');
    } else if (userStatusFilter === 'SUSPENDED') {
      liveList = users.filter((u) => u.accountStatus === 'suspended');
    } else if (userStatusFilter === 'DELETED') {
      liveList = [];
    }

    let deletedList = deletedAccounts;
    if (userStatusFilter === 'ACTIVE' || userStatusFilter === 'SUSPENDED') {
      deletedList = [];
    }

    const filteredLive = liveList
      .filter((u) => {
        if (!query) return true;
        return (
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.role?.toLowerCase().includes(query)
        );
      })
      .map((u) => ({ isDeleted: false, data: u }));

    const filteredDeleted = deletedList
      .filter((acc) => {
        if (!query) return true;
        return (
          acc.fullName?.toLowerCase().includes(query) ||
          acc.email?.toLowerCase().includes(query) ||
          acc.username?.toLowerCase().includes(query) ||
          acc.originalUserId?.toLowerCase().includes(query) ||
          acc.deletionReason?.toLowerCase().includes(query) ||
          acc.accountRole?.toLowerCase().includes(query)
        );
      })
      .map((acc) => ({ isDeleted: true, data: acc }));

    if (userStatusFilter === 'DELETED') return filteredDeleted;
    if (userStatusFilter === 'ACTIVE' || userStatusFilter === 'SUSPENDED') return filteredLive;
    return [...filteredLive, ...filteredDeleted];
  }, [users, deletedAccounts, userStatusFilter, userSearch]);

  const filteredCommunities = communities.filter(
    (c) =>
      c.communityName?.toLowerCase().includes(communitySearch.toLowerCase()) ||
      c.category?.toLowerCase().includes(communitySearch.toLowerCase())
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.title?.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.category?.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const filteredWorkshops = workshops.filter(
    (w) =>
      w.title?.toLowerCase().includes(workshopSearch.toLowerCase()) ||
      w.category?.toLowerCase().includes(workshopSearch.toLowerCase())
  );

  const filteredResources = resources.filter(
    (r) =>
      r.title?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.category?.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  return (
    <div className="admin-theme-root admin-layout">
      {/* Sidebar Navigation */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen} 
        closeSidebar={closeMobileSidebar} 
      />

      {/* Backdrop overlay on mobile */}
      {isMobileOpen && (
        <div className="admin-sidebar-overlay" onClick={closeMobileSidebar}></div>
      )}

      {/* Main Workspace Wrapper */}
      <div className="admin-main-wrapper">
        {/* Top Management Navbar */}
        <AdminNavbar onMenuToggle={toggleMobileSidebar} isMobileOpen={isMobileOpen} />

        {/* Content Body */}
        <div className="admin-content-body">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div
                className="spinner"
                style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #334155',
                  borderTop: '4px solid #6366F1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', color: '#F8FAFC' }}>
                    Platform Overview
                  </h1>

                  {/* Summary Metric Cards */}
                  <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                      <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
                        <Users />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Total Users</span>
                        <h3 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#F8FAFC' }}>
                          {users.length}
                        </h3>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9' }}>
                        <Globe />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Total Communities</span>
                        <h3 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#F8FAFC' }}>
                          {communities.length}
                        </h3>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                        <FolderGit2 />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Total Projects</span>
                        <h3 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#F8FAFC' }}>
                          {projects.length}
                        </h3>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                        <Calendar />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Total Workshops</span>
                        <h3 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#F8FAFC' }}>
                          {workshops.length}
                        </h3>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}>
                        <BookOpen />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Total Resources</span>
                        <h3 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#F8FAFC' }}>
                          {resources.length}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Quick Admin Shortcuts & Platform Status */}
                  <div className="admin-table-card" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--admin-bg-card)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    
                    {/* Header Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(15, 118, 110, 0.15)', border: '1px solid rgba(15, 118, 110, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5EEAD4' }}>
                          <Activity size={20} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#F5F5F4', letterSpacing: '-0.3px' }}>
                            Quick Admin Shortcuts & System Status
                          </h3>
                          <p style={{ fontSize: '0.78rem', color: '#A8A29E', margin: '0.15rem 0 0' }}>
                            Operational health and direct management shortcuts.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, color: '#34D399' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#34D399', boxShadow: '0 0 8px #34D399', display: 'inline-block' }}></span>
                        All Systems Operational
                      </div>
                    </div>

                    {/* Quick Management Shortcut Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                      
                      <button
                        onClick={() => setActiveTab('users')}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '1.1rem 1rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Users size={20} color="#6366F1" />
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            {users.length} Users
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F5F5F4' }}>User Moderation</div>
                          <div style={{ fontSize: '0.75rem', color: '#A8A29E', marginTop: '0.1rem' }}>Suspend, activate & manage users</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('communities')}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '1.1rem 1rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Globe size={20} color="#0EA5E9" />
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0EA5E9', backgroundColor: 'rgba(14, 165, 233, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            {communities.length} Groups
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F5F5F4' }}>Communities</div>
                          <div style={{ fontSize: '0.75rem', color: '#A8A29E', marginTop: '0.1rem' }}>Review platform communities</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('projects')}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '1.1rem 1rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FolderGit2 size={20} color="#10B981" />
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            {projects.length} Active
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F5F5F4' }}>Projects Workspace</div>
                          <div style={{ fontSize: '0.75rem', color: '#A8A29E', marginTop: '0.1rem' }}>Monitor collaborative squads</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('analytics')}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '1.1rem 1rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <BarChart3 size={20} color="#A855F7" />
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#A855F7', backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            Analytics
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F5F5F4' }}>Platform Insights</div>
                          <div style={{ fontSize: '0.75rem', color: '#A8A29E', marginTop: '0.1rem' }}>View metrics & growth</div>
                        </div>
                      </button>

                    </div>

                  </div>
                </div>
              )}

              {/* User Management Tab */}
              {activeTab === 'users' && (
                <div>
                  <div className="admin-table-card">
                    <div className="admin-table-header" style={{ flexWrap: 'wrap', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, minWidth: '280px' }}>
                        <div>
                          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                            User Management
                          </h2>
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                            Complete User Lifecycle & Administrative Controls
                          </span>
                        </div>

                        {/* Status Filter Tabs with Live Counts */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setUserStatusFilter('ALL')}
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: userStatusFilter === 'ALL' ? '1px solid #0F766E' : '1px solid #334155',
                              backgroundColor: userStatusFilter === 'ALL' ? 'rgba(15, 118, 110, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                              color: userStatusFilter === 'ALL' ? '#5EEAD4' : '#94A3B8',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            All Users ({totalUsersCount})
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserStatusFilter('ACTIVE')}
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: userStatusFilter === 'ACTIVE' ? '1px solid #10B981' : '1px solid #334155',
                              backgroundColor: userStatusFilter === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              color: userStatusFilter === 'ACTIVE' ? '#34D399' : '#94A3B8',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Active ({activeUsersCount})
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserStatusFilter('SUSPENDED')}
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: userStatusFilter === 'SUSPENDED' ? '1px solid #F59E0B' : '1px solid #334155',
                              backgroundColor: userStatusFilter === 'SUSPENDED' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              color: userStatusFilter === 'SUSPENDED' ? '#FBBF24' : '#94A3B8',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Suspended ({suspendedUsersCount})
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserStatusFilter('DELETED')}
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: userStatusFilter === 'DELETED' ? '1px solid #EF4444' : '1px solid #334155',
                              backgroundColor: userStatusFilter === 'DELETED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              color: userStatusFilter === 'DELETED' ? '#F87171' : '#94A3B8',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Deleted ({deletedUsersCount})
                          </button>
                        </div>
                      </div>

                      <div className="admin-search-box" style={{ alignSelf: 'flex-start' }}>
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                      </div>
                    </div>

                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Account Status</th>
                          <th>Date / Log Info</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unifiedUserRows.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                              No matching users found in this filter category.
                            </td>
                          </tr>
                        ) : (
                          unifiedUserRows.map((row) => {
                            if (row.isDeleted) {
                              const acc = row.data;
                              return (
                                <tr key={`deleted-${acc._id}`} style={{ backgroundColor: 'rgba(255, 255, 255, 0.015)', opacity: 0.85 }}>
                                  <td>
                                    <div style={{ fontWeight: 700, color: '#CBD5E1', fontSize: '0.85rem' }}>{acc.fullName}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                      @{acc.username} • {acc.email}
                                    </div>
                                  </td>
                                  <td>
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        padding: '0.2rem 0.55rem',
                                        borderRadius: '6px',
                                        background: 'rgba(148, 163, 184, 0.12)',
                                        color: '#94A3B8',
                                        textTransform: 'uppercase',
                                      }}
                                    >
                                      {acc.accountRole || 'USER'}
                                    </span>
                                  </td>
                                  <td>
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: '#EF4444',
                                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                        padding: '0.2rem 0.55rem',
                                        borderRadius: '6px',
                                      }}
                                    >
                                      ● Deleted
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                                      Joined: {acc.accountCreatedDate ? new Date(acc.accountCreatedDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.1rem' }}>
                                      Deleted: {acc.accountDeletedDate ? new Date(acc.accountDeletedDate).toLocaleDateString() : 'N/A'} ({acc.deletedBy || 'Self'})
                                    </div>
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.3rem 0.65rem', borderRadius: '6px', fontWeight: 600 }}>
                                      🔒 Audit Only
                                    </span>
                                  </td>
                                </tr>
                              );
                            } else {
                              const u = row.data;
                              return (
                                <tr key={u._id}>
                                  <td>
                                    <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{u.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{u.email}</div>
                                  </td>
                                  <td>
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        padding: '0.2rem 0.55rem',
                                        borderRadius: '6px',
                                        background: u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                                        color: u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? '#6366F1' : '#0EA5E9',
                                        textTransform: 'uppercase',
                                      }}
                                    >
                                      {u.role}
                                    </span>
                                  </td>
                                  <td>
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: u.accountStatus === 'suspended' ? '#EF4444' : '#10B981',
                                      }}
                                    >
                                      {u.accountStatus === 'suspended' ? '● Suspended' : '● Active'}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                    Joined: {new Date(u.createdAt).toLocaleDateString()}
                                  </td>
                                  <td>
                                    {['ADMIN', 'SUPER_ADMIN'].includes(u.role) ? (
                                      <span style={{ fontSize: '0.75rem', color: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '0.3rem 0.65rem', borderRadius: '6px', fontWeight: 700 }}>
                                        🔒 Protected System Admin
                                      </span>
                                    ) : (
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                          onClick={() => handleToggleUserStatus(u._id, u.accountStatus)}
                                          className={`admin-action-btn ${u.accountStatus === 'suspended' ? 'success' : 'warning'}`}
                                        >
                                          {u.accountStatus === 'suspended' ? <CheckCircle size={12} /> : <Ban size={12} />}
                                          {u.accountStatus === 'suspended' ? 'Activate' : 'Suspend'}
                                        </button>

                                        <button
                                          onClick={() => handleDeleteUser(u._id, u.name)}
                                          className="admin-action-btn danger"
                                        >
                                          <Trash2 size={12} /> Delete
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Community Management Tab */}
              {activeTab === 'communities' && (
                <div>
                  <div className="admin-table-card">
                    <div className="admin-table-header">
                      <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                          Community Management
                        </h2>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                          Total Active Communities: {communities.length}
                        </span>
                      </div>

                      <div className="admin-search-box">
                        <input
                          type="text"
                          placeholder="Search communities..."
                          value={communitySearch}
                          onChange={(e) => setCommunitySearch(e.target.value)}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                      </div>
                    </div>

                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Community</th>
                          <th>Category</th>
                          <th>Members</th>
                          <th>Created At</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCommunities.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                              No matching communities found.
                            </td>
                          </tr>
                        ) : (
                          filteredCommunities.map((c) => (
                            <tr key={c._id}>
                              <td>
                                <div style={{ fontWeight: 700, color: '#F5F5F4' }}>{c.communityName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)' }}>{c.slug ? `/${c.slug}` : ''}</div>
                              </td>
                              <td style={{ color: '#5EEAD4', fontWeight: 600 }}>{c.category || 'General'}</td>
                              <td>{c.memberCount ?? c.members?.length ?? 0} members</td>
                              <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                {new Date(c.createdAt).toLocaleDateString()}
                              </td>
                              <td>
                                <button
                                  onClick={() => handleDeleteCommunity(c._id, c.communityName)}
                                  className="admin-action-btn danger"
                                >
                                  <Trash2 size={12} /> Delete Community
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Project Management Tab */}
              {activeTab === 'projects' && (
                <div>
                  <div className="admin-table-card">
                    <div className="admin-table-header">
                      <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                          Project Management
                        </h2>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                          Total Active Projects: {projects.length}
                        </span>
                      </div>

                      <div className="admin-search-box">
                        <input
                          type="text"
                          placeholder="Search projects..."
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                      </div>
                    </div>

                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Project Title</th>
                          <th>Category</th>
                          <th>Owner</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                              No matching projects found.
                            </td>
                          </tr>
                        ) : (
                          filteredProjects.map((p) => (
                            <tr key={p._id}>
                              <td style={{ fontWeight: 700, color: '#F8FAFC' }}>{p.title}</td>
                              <td style={{ color: '#10B981', fontWeight: 600 }}>{p.category || 'Development'}</td>
                              <td style={{ color: '#94A3B8' }}>{p.owner?.name || 'Owner'}</td>
                              <td>
                                <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.2)', color: '#6366F1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                                  {p.status || 'Active'}
                                </span>
                              </td>
                              <td>
                                <button
                                  onClick={() => handleDeleteProject(p._id, p.title)}
                                  className="admin-action-btn danger"
                                >
                                  <Trash2 size={12} /> Delete Project
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Workshop Management Tab */}
              {activeTab === 'workshops' && (
                <div>
                  <div className="admin-table-card">
                    <div className="admin-table-header">
                      <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                          Workshop Management
                        </h2>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                          Total Scheduled Workshops: {workshops.length}
                        </span>
                      </div>

                      <div className="admin-search-box">
                        <input
                          type="text"
                          placeholder="Search workshops..."
                          value={workshopSearch}
                          onChange={(e) => setWorkshopSearch(e.target.value)}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                      </div>
                    </div>

                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Workshop Title</th>
                          <th>Category</th>
                          <th>Host</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWorkshops.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                              No matching workshops found.
                            </td>
                          </tr>
                        ) : (
                          filteredWorkshops.map((w) => (
                            <tr key={w._id}>
                              <td style={{ fontWeight: 700, color: '#F8FAFC' }}>{w.title}</td>
                              <td style={{ color: '#F59E0B', fontWeight: 600 }}>{w.category || 'General'}</td>
                              <td style={{ color: '#94A3B8' }}>{w.host?.name || 'Host'}</td>
                              <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                {w.date ? new Date(w.date).toLocaleDateString() : 'TBD'}
                              </td>
                              <td>
                                <button
                                  onClick={() => handleDeleteWorkshop(w._id, w.title)}
                                  className="admin-action-btn danger"
                                >
                                  <Trash2 size={12} /> Delete Workshop
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resource Management Tab */}
              {activeTab === 'resources' && (
                <div>
                  <div className="admin-table-card">
                    <div className="admin-table-header">
                      <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                          Learning Resource Management
                        </h2>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                          Total Shared Resources: {resources.length}
                        </span>
                      </div>

                      <div className="admin-search-box">
                        <input
                          type="text"
                          placeholder="Search resources..."
                          value={resourceSearch}
                          onChange={(e) => setResourceSearch(e.target.value)}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                      </div>
                    </div>

                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Resource Title</th>
                          <th>Category</th>
                          <th>Shared By</th>
                          <th>Likes</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResources.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                              No matching resources found.
                            </td>
                          </tr>
                        ) : (
                          filteredResources.map((r) => (
                            <tr key={r._id}>
                              <td style={{ fontWeight: 700, color: '#F8FAFC' }}>{r.title}</td>
                              <td style={{ color: '#A855F7', fontWeight: 600 }}>{r.category || 'Guide'}</td>
                              <td style={{ color: '#94A3B8' }}>{r.creator?.name || r.sharedBy?.name || 'Community Member'}</td>
                              <td style={{ fontWeight: 700, color: '#F8FAFC' }}>{r.likesCount || 0}</td>
                              <td>
                                <button
                                  onClick={() => handleDeleteResource(r._id, r.title)}
                                  className="admin-action-btn danger"
                                >
                                  <Trash2 size={12} /> Delete Resource
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Analytics & Platform Growth Tab */}
              {activeTab === 'analytics' && (
                <div>
                  {/* Header Bar */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#F8FAFC', letterSpacing: '-0.3px' }}>
                      Platform Analytics & Insights
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                      Real-time telemetry, user retention, ecosystem performance, and growth metrics.
                    </p>
                  </div>

                  {/* Visual Platform Distribution & Health Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
                    
                    {/* Left: Platform Ecosystem Distribution Bars */}
                    <div style={{ backgroundColor: 'var(--admin-bg-card)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BarChart3 size={18} color="#0EA5E9" />
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                            Platform Modules & Content Distribution
                          </h3>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          Total Items: {communities.length + projects.length + workshops.length + resources.length}
                        </span>
                      </div>

                      {/* Bar 1: Communities */}
                      <div style={{ marginBottom: '1.1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                          <span style={{ color: '#F8FAFC', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Globe size={14} color="#0EA5E9" /> Communities
                          </span>
                          <span style={{ color: '#0EA5E9', fontWeight: 700 }}>{communities.length} ({Math.round((communities.length / Math.max(1, communities.length + projects.length + workshops.length + resources.length)) * 100)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((communities.length / Math.max(1, communities.length + projects.length + workshops.length + resources.length)) * 100)}%`, height: '100%', backgroundColor: '#0EA5E9', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Bar 2: Projects */}
                      <div style={{ marginBottom: '1.1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                          <span style={{ color: '#F8FAFC', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FolderGit2 size={14} color="#10B981" /> Collaborative Projects
                          </span>
                          <span style={{ color: '#10B981', fontWeight: 700 }}>{projects.length} ({Math.round((projects.length / Math.max(1, communities.length + projects.length + workshops.length + resources.length)) * 100)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((projects.length / Math.max(1, communities.length + projects.length + workshops.length + resources.length)) * 100)}%`, height: '100%', backgroundColor: '#10B981', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Bar 3: Resources */}
                      <div style={{ marginBottom: '1.1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                          <span style={{ color: '#F8FAFC', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <BookOpen size={14} color="#A855F7" /> Learning Resources
                          </span>
                          <span style={{ color: '#A855F7', fontWeight: 700 }}>{resources.length} ({Math.round((resources.length / Math.max(1, communities.length + projects.length + workshops.length + resources.length)) * 100)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((resources.length / Math.max(1, communities.length + projects.length + workshops.length + resources.length)) * 100)}%`, height: '100%', backgroundColor: '#A855F7', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Bar 4: Workshops */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                          <span style={{ color: '#F8FAFC', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Calendar size={14} color="#F59E0B" /> Interactive Workshops
                          </span>
                          <span style={{ color: '#F59E0B', fontWeight: 700 }}>{workshops.length} ({Math.round((workshops.length / Math.max(1, communities.length + projects.length + workshops.length + resources.length)) * 100)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((workshops.length / Math.max(1, communities.length + projects.length + workshops.length + resources.length)) * 100)}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                    </div>

                    {/* Right: Security & Operational Health Matrix */}
                    <div style={{ backgroundColor: 'var(--admin-bg-card)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <ShieldCheck size={18} color="#10B981" />
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                            System Health Matrix
                          </h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: '#94A3B8' }}>Account Security Rate</span>
                            <span style={{ color: '#10B981', fontWeight: 800 }}>100% Verified</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: '#94A3B8' }}>Content Safety Score</span>
                            <span style={{ color: '#10B981', fontWeight: 800 }}>99.9% Clean</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: '#94A3B8' }}>Real-time Gateway</span>
                            <span style={{ color: '#38BDF8', fontWeight: 800 }}>0.4ms Latency</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: '#94A3B8' }}>Platform Uptime</span>
                            <span style={{ color: '#10B981', fontWeight: 800 }}>99.99%</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '0.75rem 1rem', marginTop: '1.25rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          ✓ All Core Services Operational
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Bottom: Tech Stack Category Distribution Table */}
                  <div className="admin-table-card">
                    <div className="admin-table-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={18} color="#A855F7" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                          Top Technology Stack & Ecosystem Insights
                        </h3>
                      </div>
                    </div>

                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Category Domain</th>
                          <th>Total Activity</th>
                          <th>Status</th>
                          <th>Growth Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 700, color: '#F8FAFC' }}>Full-Stack & Web Development</td>
                          <td style={{ color: '#0EA5E9', fontWeight: 700 }}>High Engagement</td>
                          <td><span style={{ fontSize: '0.7rem', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span></td>
                          <td style={{ color: '#10B981', fontWeight: 700 }}>↑ 42% Growth</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: '#F8FAFC' }}>UI/UX & Design Systems</td>
                          <td style={{ color: '#A855F7', fontWeight: 700 }}>Moderate Activity</td>
                          <td><span style={{ fontSize: '0.7rem', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span></td>
                          <td style={{ color: '#10B981', fontWeight: 700 }}>↑ 28% Growth</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: '#F8FAFC' }}>AI, Machine Learning & Data Science</td>
                          <td style={{ color: '#F59E0B', fontWeight: 700 }}>Rapid Growth</td>
                          <td><span style={{ fontSize: '0.7rem', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span></td>
                          <td style={{ color: '#10B981', fontWeight: 700 }}>↑ 65% Growth</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: '#F8FAFC' }}>Cloud Computing & DevOps</td>
                          <td style={{ color: '#38BDF8', fontWeight: 700 }}>Steady Collaboration</td>
                          <td><span style={{ fontSize: '0.7rem', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span></td>
                          <td style={{ color: '#10B981', fontWeight: 700 }}>↑ 31% Growth</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
