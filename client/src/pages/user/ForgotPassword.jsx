import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/shared/Logo';
import api from '../../services/api';
import { FiMail, FiSend, FiArrowLeft } from 'react-icons/fi';
import '../../styles/user/auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.status === 'success') {
        setSuccess(res.data.message || 'Password reset OTP sent! Redirecting...');
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(email)}&mode=reset`);
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-brand-logo">
            <Logo size="medium" to="/" />
          </div>
          <h1 className="auth-title">Forgot Password?</h1>
          <p className="auth-subtitle">
            Enter your account's email address and we'll send you a password reset OTP.
          </p>
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

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="forgot-email">
              Email Address
            </label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">
                <FiMail />
              </span>
              <input
                type="email"
                id="forgot-email"
                name="email"
                className="form-input no-toggle"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                autoComplete="email"
                disabled={loading || !!success}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading || !!success}>
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
                <span>Sending OTP...</span>
              </>
            ) : (
              <>
                Send Reset OTP <FiSend />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <Link
            to="/login"
            className="auth-link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginLeft: 0 }}
          >
            <FiArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
