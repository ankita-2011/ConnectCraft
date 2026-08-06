import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../../components/shared/Logo';
import api from '../../services/api';
import { FiShield, FiRefreshCw, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import '../../styles/user/auth.css';

const RESEND_COOLDOWN = 60; // seconds

const OtpVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') || '';
  const mode = searchParams.get('mode') || 'verification'; // 'verification' | 'reset'
  const isReset = mode === 'reset';
  const wasDeletedAccount = searchParams.get('wasDeleted') === 'true';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [verified, setVerified] = useState(false);


  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // Focus OTP input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate(isReset ? '/forgot-password' : '/register');
    }
  }, [email, navigate, isReset]);

  // Countdown timer
  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
    setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => clearInterval(timerRef.current);
  }, [startCountdown]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (error) setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      if (isReset) {
        // Verify reset OTP → get resetToken → go to reset-password
        const res = await api.post('/auth/verify-reset-otp', { email, otp });
        if (res.data?.status === 'success') {
          const resetToken = res.data.resetToken;
          setVerified(true);
          setSuccess('OTP verified! Redirecting to password reset...');
          setTimeout(() => {
            navigate(
              `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(resetToken)}`
            );
          }, 1200);
        }
      } else {
        // Verify registration OTP → go to login
        const res = await api.post('/auth/verify-otp', { email, otp });
        if (res.data?.status === 'success') {
          setVerified(true);
          setSuccess('Email verified! Redirecting to login...');
          setTimeout(() => {
            navigate('/login?verified=true');
          }, 1500);
        }
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setError('');
    setResending(true);
    try {
      const endpoint = isReset ? '/auth/forgot-password' : '/auth/resend-otp';
      await api.post(endpoint, { email });
      setOtp('');
      startCountdown();
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Mask email for display: j***@example.com
  const maskEmail = (emailStr) => {
    if (!emailStr) return '';
    const [local, domain] = emailStr.split('@');
    if (!domain) return emailStr;
    const masked = local.charAt(0) + '***';
    return `${masked}@${domain}`;
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-brand-logo">
            <Logo size="medium" to="/" />
          </div>
          <div style={styles.iconCircle}>
            <FiShield style={styles.shieldIcon} />
          </div>
          <h1 className="auth-title">
            {isReset ? 'Verify Reset OTP' : 'Verify Your Email'}
          </h1>
          <p className="auth-subtitle">
            We sent a 6-digit OTP to{' '}
            <strong style={{ color: '#0F766E' }}>{maskEmail(email)}</strong>
            <br />
            Enter it below to {isReset ? 'reset your password' : 'activate your account'}.
          </p>
        </div>

        {/* Deleted Account Re-registration Notice */}
        {wasDeletedAccount && (
          <div className="alert alert-warning alert-block" style={{ marginBottom: '1.25rem', backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E', padding: '0.9rem 1.15rem', borderRadius: '12px', fontSize: '0.85rem', lineHeight: '1.5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.9rem', color: '#B45309' }}>
              <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
              <span>Deleted Account Notice</span>
            </div>
            <p style={{ margin: 0, color: '#92400E', fontSize: '0.825rem', lineHeight: '1.45' }}>
              This email address previously belonged to a permanently deleted account. Previous data cannot be restored. Verifying this OTP will create a completely new, independent user account.
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }} role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}


        {/* Success State */}
        {success && (
          <div style={styles.successWrap}>
            <div style={styles.successIconWrap}>
              <FiCheckCircle style={styles.successIcon} />
            </div>
            <p style={styles.successText}>{success}</p>
          </div>
        )}

        {!verified && (
          <>
            {/* OTP Form */}
            <form onSubmit={handleVerify} noValidate style={{ marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="otp-input">
                  One-Time Password (OTP)
                </label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">
                    <FiShield />
                  </span>
                  <input
                    ref={inputRef}
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="form-input no-toggle"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={handleOtpChange}
                    disabled={loading}
                    required
                    style={{
                      fontSize: '1.25rem',
                      letterSpacing: '0.12em',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                    }}
                    autoComplete="one-time-code"
                  />
                </div>

                {/* Character Progress Dots */}
                <div style={styles.dotRow}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.dot,
                        background: i < otp.length ? '#0F766E' : '#E7E5E4',
                        transform: i < otp.length ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                className="auth-btn"
                disabled={loading || otp.length !== 6}
                style={{ marginBottom: '1rem' }}
              >
                {loading ? (
                  <>
                    <span style={styles.spinner} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>

            {/* Resend OTP section */}
            <div style={styles.resendSection}>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={styles.resendBtn}
                >
                  {resending ? (
                    <>
                      <span style={styles.spinnerSmall} />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FiRefreshCw size={14} />
                      <span>Resend OTP</span>
                    </>
                  )}
                </button>
              ) : (
                <p style={styles.countdownText}>
                  Resend OTP in{' '}
                  <span style={{ color: '#0F766E', fontWeight: 700, fontFamily: 'monospace' }}>
                    {formatTime(countdown)}
                  </span>
                </p>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
          <Link
            to={isReset ? '/forgot-password' : '/register'}
            className="auth-link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginLeft: 0 }}
          >
            <FiArrowLeft size={14} />
            {isReset ? 'Back to Forgot Password' : 'Back to Register'}
          </Link>
        </div>

      </div>
    </div>
  );
};

const styles = {
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #CCFBF1, #99F6E4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
    boxShadow: '0 4px 16px rgba(15,118,110,0.20)',
  },
  shieldIcon: {
    fontSize: '1.75rem',
    color: '#0F766E',
  },
  dotRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginTop: '12px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
  },
  resendSection: {
    textAlign: 'center',
    padding: '0.75rem 0',
    borderTop: '1px solid #F5F5F4',
  },
  countdownText: {
    fontSize: '0.875rem',
    color: '#78716C',
    margin: 0,
  },
  resendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: 'transparent',
    border: '1.5px solid #0F766E',
    borderRadius: '12px',
    color: '#0F766E',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    fontSize: '0.875rem',
    padding: '0.5rem 1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  successWrap: {
    textAlign: 'center',
    padding: '1.5rem 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  successIconWrap: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#ECFDF5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    fontSize: '2rem',
    color: '#16A34A',
  },
  successText: {
    color: '#16A34A',
    fontWeight: 600,
    fontSize: '0.95rem',
    margin: 0,
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #FFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  spinnerSmall: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(15,118,110,0.2)',
    borderTop: '2px solid #0F766E',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
};

export default OtpVerification;
