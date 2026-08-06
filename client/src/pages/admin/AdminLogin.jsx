import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import '../../styles/admin/admin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email address and password are required.');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid admin email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/admin/login', {
        email: formData.email,
        password: formData.password,
      });

      if (response.data?.status === 'success') {
        const adminUser = response.data.user;
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        setAuthUser(adminUser);
        toast.success(`Welcome back, ${adminUser.name}! Admin Portal session active.`);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('[ADMIN LOGIN ERROR]:', err);
      const errMsg = err.message || err.data?.message || 'Admin authentication failed. Verify credentials.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-theme-root admin-auth-wrapper">
      <div className="admin-auth-card">
        <div className="admin-auth-header">
          <div className="admin-badge">
            <ShieldCheck size={14} /> ConnectCraft Management
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#F8FAFC' }}>
            Admin Portal Login
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
            Restricted access for platform administrators and moderators.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Address */}
          <div className="admin-input-group">
            <label className="admin-input-label">Admin Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                className="admin-input-field"
                placeholder="admin@connectcraft.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoFocus
              />
              <Mail size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
          </div>

          {/* Password */}
          <div className="admin-input-group">
            <label className="admin-input-label">Admin Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="password"
                className="admin-input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Lock size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn-primary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}
          >
            {loading ? 'Authenticating...' : <>Access Admin Dashboard <ArrowRight size={18} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', borderTop: '1px solid #334155', paddingTop: '1.25rem' }}>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
            Need an Admin account?{' '}
            <Link to="/admin/register" style={{ color: '#0F766E', fontWeight: 700, textDecoration: 'none' }}>
              Register as Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
