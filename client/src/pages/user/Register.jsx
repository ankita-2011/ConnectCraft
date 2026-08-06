import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/shared/Logo';
import { FiUser, FiMail, FiLock, FiUserPlus, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import '../../styles/user/auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { name, email, password, confirmPassword } = formData;

  // Real-time password validation status
  const pwdValidation = {
    hasLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!pwdValidation.hasLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!pwdValidation.hasUpper) {
      setError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }
    if (!pwdValidation.hasLower) {
      setError('Password must contain at least one lowercase letter (a-z).');
      return;
    }
    if (!pwdValidation.hasNumber) {
      setError('Password must contain at least one number (0-9).');
      return;
    }
    if (!pwdValidation.hasSpecial) {
      setError('Password must contain at least one special character (e.g., !@#$%^&*).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await register(name, email, password, confirmPassword);
      setSuccess(data?.message || 'OTP sent! Redirecting to verification...');
      const wasDeletedParam = data?.wasDeletedAccount ? '&wasDeleted=true' : '';
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}&mode=verification${wasDeletedParam}`);
      }, 1600);
    } catch (err) {
      setError(err.message || 'An error occurred during registration. Please try again.');
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join ConnectCraft to connect, collaborate, and ship real projects.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }} role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }} role="status">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Registration Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              Full Name
            </label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">
                <FiUser />
              </span>
              <input
                type="text"
                id="register-name"
                name="name"
                className="form-input no-toggle"
                placeholder="John Doe"
                value={name}
                onChange={handleChange}
                autoFocus
                autoComplete="name"
                disabled={loading || !!success}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email Address
            </label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">
                <FiMail />
              </span>
              <input
                type="email"
                id="register-email"
                name="email"
                className="form-input no-toggle"
                placeholder="john@example.com"
                value={email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading || !!success}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">
                <FiLock />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="register-password"
                name="password"
                className="form-input"
                placeholder="Min. 8 chars, A-Z, 0-9, !@#..."
                value={password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading || !!success}
                required
              />
              <button
                type="button"
                className="form-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading || !!success}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* Live Password Requirements Checklist */}
            {password.length > 0 && (
              <div className="pwd-requirements-box">
                <div className={`pwd-req-item ${pwdValidation.hasLength ? 'valid' : ''}`}>
                  {pwdValidation.hasLength ? <FiCheck /> : <span style={{ opacity: 0.5 }}>•</span>}
                  8+ characters
                </div>
                <div className={`pwd-req-item ${pwdValidation.hasUpper ? 'valid' : ''}`}>
                  {pwdValidation.hasUpper ? <FiCheck /> : <span style={{ opacity: 0.5 }}>•</span>}
                  Uppercase (A-Z)
                </div>
                <div className={`pwd-req-item ${pwdValidation.hasNumber ? 'valid' : ''}`}>
                  {pwdValidation.hasNumber ? <FiCheck /> : <span style={{ opacity: 0.5 }}>•</span>}
                  Number (0-9)
                </div>
                <div className={`pwd-req-item ${pwdValidation.hasSpecial ? 'valid' : ''}`}>
                  {pwdValidation.hasSpecial ? <FiCheck /> : <span style={{ opacity: 0.5 }}>•</span>}
                  Special (!@#...)
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="register-confirm-password">
                Confirm Password
              </label>
              {confirmPassword.length > 0 && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isPasswordMatch ? '#059669' : '#DC2626' }}>
                  {isPasswordMatch ? '✓ Passwords match' : 'Passwords do not match'}
                </span>
              )}
            </div>

            <div className="form-input-wrapper">
              <span className="form-input-icon">
                <FiLock />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="register-confirm-password"
                name="confirmPassword"
                className="form-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading || !!success}
                required
              />
              <button
                type="button"
                className="form-input-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                disabled={loading || !!success}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="auth-btn" disabled={loading || !!success}>
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                Create Account <FiUserPlus />
              </>
            )}
          </button>

        </form>

        {/* Footer Link */}
        <div className="auth-footer">
          Already have an account?
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
