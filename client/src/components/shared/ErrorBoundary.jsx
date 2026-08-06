import { Component } from 'react';

/**
 * Global Error Boundary
 * Catches unhandled React rendering errors and displays a recovery UI
 * instead of letting the entire app go blank.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log error details to the console for debugging
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <div style={styles.iconWrap}>
              <span style={styles.icon}>⚠️</span>
            </div>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.subtitle}>
              An unexpected error occurred. Your data is safe — this is just a
              display issue.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre style={styles.errorBox}>
                {this.state.error.toString()}
              </pre>
            )}
            <div style={styles.btnRow}>
              <button style={styles.btnPrimary} onClick={this.handleReload}>
                Reload Page
              </button>
              <button style={styles.btnSecondary} onClick={this.handleGoHome}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FAFAF9',
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    padding: '2rem',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 18px 40px rgba(28, 25, 23, 0.10)',
    padding: '3rem 2.5rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
  },
  iconWrap: {
    marginBottom: '1.25rem',
  },
  icon: {
    fontSize: '3rem',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#1C1917',
    margin: '0 0 0.75rem',
  },
  subtitle: {
    fontSize: '0.975rem',
    color: '#57534E',
    lineHeight: 1.6,
    margin: '0 0 1.75rem',
  },
  errorBox: {
    background: '#F5F5F4',
    border: '1px solid #E7E5E4',
    borderRadius: '10px',
    padding: '1rem',
    fontSize: '0.8rem',
    color: '#DC2626',
    textAlign: 'left',
    overflowX: 'auto',
    marginBottom: '1.75rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  btnRow: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    background: '#0F766E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '0.65rem 1.5rem',
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  btnSecondary: {
    background: '#F5F5F4',
    color: '#1C1917',
    border: '1px solid #E7E5E4',
    borderRadius: '12px',
    padding: '0.65rem 1.5rem',
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
};

export default ErrorBoundary;
