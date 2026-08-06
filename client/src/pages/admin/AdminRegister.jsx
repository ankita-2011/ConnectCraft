import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Lock, Mail, User, Key, ArrowRight } from 'lucide-react';
import '../../styles/admin/admin.css';

const AdminRegister = () => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecretKey: '',
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

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.adminSecretKey) {
      setError('All fields including the Admin Secret Key are required.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/admin/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        adminSecretKey: formData.adminSecretKey,
      });

      if (response.data?.status === 'success') {
        const adminUser = response.data.user;
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        setAuthUser(adminUser);
        toast.success('Admin account created successfully! Welcome to the Admin Portal.');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('[ADMIN REGISTER ERROR]:', err);
      const errMsg = err.message || err.data?.message || 'Failed to create admin account. Check your secret key.';
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
            Admin Registration
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
            Create an authorized administrator account using your secret key.
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
          {/* Full Name */}
          <div className="admin-input-group">
            <label className="admin-input-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="name"
                className="admin-input-field"
                placeholder="e.g. System Administrator"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <User size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
          </div>

          {/* Email Address */}
          <div className="admin-input-group">
            <label className="admin-input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                className="admin-input-field"
                placeholder="admin@connectcraft.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Mail size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
          </div>

          {/* Password */}
          <div className="admin-input-group">
            <label className="admin-input-label">Password</label>
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

          {/* Confirm Password */}
          <div className="admin-input-group">
            <label className="admin-input-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="confirmPassword"
                className="admin-input-field"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <Lock size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
          </div>

          {/* Admin Secret Key */}
          <div className="admin-input-group">
            <label className="admin-input-label">Admin Secret Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="adminSecretKey"
                className="admin-input-field"
                placeholder="Enter ADMIN_SECRET_KEY..."
                value={formData.adminSecretKey}
                onChange={handleChange}
                required
              />
              <Key size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6366F1' }} />
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn-primary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}
          >
            {loading ? 'Creating Admin Account...' : <>Register Admin Account <ArrowRight size={18} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', borderTop: '1px solid #334155', paddingTop: '1.25rem' }}>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
            Already have an Admin account?{' '}
            <Link to="/admin/login" style={{ color: '#0F766E', fontWeight: 700, textDecoration: 'none' }}>
              Sign In to Admin Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
