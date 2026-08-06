import useNetworkStatus from '../../hooks/useNetworkStatus';

const NetworkStatusBanner = () => {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        ...bannerBase,
        ...(isOnline ? bannerOnline : bannerOffline),
      }}
    >
      <span style={styles.dot}>{isOnline ? '✅' : '📡'}</span>
      <span style={styles.text}>
        {isOnline
          ? 'You\'re back online!'
          : 'No internet connection. Some features may be unavailable.'}
      </span>
    </div>
  );
};

const bannerBase = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.6rem 1.25rem',
  fontSize: '0.875rem',
  fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
  fontWeight: 600,
  transition: 'background 0.3s ease',
};

const bannerOffline = {
  background: '#DC2626',
  color: '#FFFFFF',
};

const bannerOnline = {
  background: '#16A34A',
  color: '#FFFFFF',
};

const styles = {
  dot: {
    fontSize: '1rem',
  },
  text: {
    letterSpacing: '0.01em',
  },
};

export default NetworkStatusBanner;
