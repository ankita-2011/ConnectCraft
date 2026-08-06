import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiShield } from 'react-icons/fi';
import '../../styles/user/auth.css';

const AdminBootstrap = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    superAdminKey: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/admin/bootstrap', formData);
      if (response.data?.status === 'success') {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        authLogin(response.data.user);
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || err.data?.message || 'Bootstrap initialization failed. Super Admin may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto 0', padding: '0 1rem' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', borderTop: '4px solid var(--color-primary)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <FiShield style={{ fontSize: '3rem', color: 'var(--color-primary)' }} />
          <h1 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>Super Admin Setup</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            One-time platform initialization setup. Requires system secret key.
          </p>
        </div>

        {error && <div className="alert-message error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-input" placeholder="Super Administrator" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input type="email" name="email" className="form-input" placeholder="admin@connectcraft.dev" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" placeholder="••••••••••••" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">SUPER_ADMIN_KEY Secret</label>
            <input type="password" name="superAdminKey" className="form-input" placeholder="Enter system key..." value={formData.superAdminKey} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.85rem', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            {loading ? 'Initializing Super Admin...' : 'Initialize Super Admin Account'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminBootstrap;
