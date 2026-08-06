import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../../components/shared/Logo';
import api from '../../services/api';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiCheckCircle } from 'react-icons/fi';
import '../../styles/user/auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const resetToken = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { newPassword, confirmPassword } = formData;

  // Live password validation
  const pwdValidation = {
    hasLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
  };
  const allValid = Object.values(pwdValidation).every(Boolean);
  const isPasswordMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!resetToken) {
      setError('Invalid or missing reset token. Please restart the password reset flow.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (!allValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
        confirmPassword,
      });
      if (res.data?.status === 'success') {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. The session may have expired. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-brand-logo">
              <Logo size="medium" to="/" />
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <FiCheckCircle style={{ fontSize: '2.25rem', color: '#16A34A' }} />
            </div>
            <h2 style={{ color: '#1C1917', fontWeight: 700, marginBottom: '0.75rem' }}>
              Password Reset!
            </h2>
            <p style={{ color: '#57534E', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your password has been updated successfully. Redirecting you to the login page...
            </p>
            <Link to="/login" className="auth-btn" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Reset Form ─────────────────────────────────────────────────
  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-brand-logo">
            <Logo size="medium" to="/" />
          </div>
          <h1 className="auth-title">Set New Password</h1>
          <p className="auth-subtitle">
            Create a strong new password for{' '}
            {email && <strong style={{ color: '#0F766E' }}>{email}</strong>}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }} role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!resetToken && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }} role="alert">
            <span>⚠️</span>
            <span>
              Invalid reset link.{' '}
              <Link to="/forgot-password" style={{ color: 'inherit', textDecoration: 'underline' }}>
                Start over
              </Link>
            </span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* New Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reset-new-password">
              New Password
            </label>
            <div className="form-input-wrapper">
              <span className="form-input-icon"><FiLock /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="reset-new-password"
                name="newPassword"
                className="form-input"
                placeholder="Min. 8 chars with A-Z, 0-9, !@#..."
                value={newPassword}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading || !resetToken}
                required
                autoFocus
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

            {/* Live Password Checklist */}
            {newPassword.length > 0 && (
              <div className="pwd-requirements-box">
                {[
                  { key: 'hasLength', label: '8+ characters' },
                  { key: 'hasUpper', label: 'Uppercase (A-Z)' },
                  { key: 'hasLower', label: 'Lowercase (a-z)' },
                  { key: 'hasNumber', label: 'Number (0-9)' },
                  { key: 'hasSpecial', label: 'Special (!@#...)' },
                ].map(({ key, label }) => (
                  <div key={key} className={`pwd-req-item ${pwdValidation[key] ? 'valid' : ''}`}>
                    {pwdValidation[key] ? <FiCheck /> : <span style={{ opacity: 0.5 }}>•</span>}
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="reset-confirm-password">
                Confirm Password
              </label>
              {confirmPassword.length > 0 && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: isPasswordMatch ? '#059669' : '#DC2626',
                  }}
                >
                  {isPasswordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </span>
              )}
            </div>
            <div className="form-input-wrapper">
              <span className="form-input-icon"><FiLock /></span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="reset-confirm-password"
                name="confirmPassword"
                className="form-input"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading || !resetToken}
                required
              />
              <button
                type="button"
                className="form-input-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-btn"
            disabled={loading || !resetToken || !allValid || !isPasswordMatch}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #FFF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }}
                />
                <span>Resetting Password...</span>
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">Back to Sign In</Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;
