import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/shared/Logo';
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import '../../styles/user/auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justVerified = searchParams.get('verified') === 'true';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (unverifiedEmail) setUnverifiedEmail('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    setLoading(true);
    setError('');
    setUnverifiedEmail('');

    try {
      const loggedInUser = await login(email, password);
      const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(loggedInUser?.role);
      if (isAdminRole) {
        navigate('/admin/dashboard');
      } else if (loggedInUser?.onboardingCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      // Special case: account exists but email not verified
      if (err.data?.status === 'unverified' && err.data?.email) {
        setUnverifiedEmail(err.data.email);
      } else {
        setError(err.message || 'Invalid credentials. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        
        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-brand-logo">
            <Logo size="medium" to="/" />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to access your collaborative workspace.</p>
        </div>

        {/* Email Just Verified Banner */}
        {justVerified && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }} role="status">
            <span>✅</span>
            <span>Email verified successfully! You can now log in.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }} role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Unverified Account Banner */}
        {unverifiedEmail && (
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '10px',
              padding: '0.875rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: '#92400E',
              lineHeight: 1.6,
            }}
            role="alert"
          >
            <strong>⚠️ Email not verified.</strong> Please verify your email before logging in.{' '}
            <Link
              to={`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}&mode=verification`}
              style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'underline' }}
            >
              Verify now →
            </Link>
          </div>
        )}

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">
                <FiMail />
              </span>
              <input
                type="email"
                id="login-email"
                name="email"
                className="form-input no-toggle"
                placeholder="name@example.com"
                value={email}
                onChange={handleChange}
                autoFocus
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password Field with Eye Toggle */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <Link to="/forgot-password" className="forgot-pwd-link">
                Forgot password?
              </Link>
            </div>

            <div className="form-input-wrapper">
              <span className="form-input-icon">
                <FiLock />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="form-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #FFF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }}
                ></span>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                Sign In <FiLogIn />
              </>
            )}
          </button>

        </form>

        {/* Footer Link */}
        <div className="auth-footer">
          Don't have an account? 
          <Link to="/register" className="auth-link">
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
