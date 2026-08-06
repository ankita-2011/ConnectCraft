import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart, DonutChart } from '../../components/user/AnalyticsCharts';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDownload, 
  FiPrinter, 
  FiBookOpen, 
  FiUsers, 
  FiLayers 
} from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/analytics.css';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [perRes, monthRes] = await Promise.all([
        api.get('/analytics/personal', { params: { timeRange } }),
        api.get('/analytics/monthly-summary'),
      ]);

      if (perRes.data?.status === 'success') {
        setAnalytics(perRes.data.data);
      }
      if (monthRes.data?.status === 'success') {
        setMonthlySummary(monthRes.data.data);
      }
    } catch  {
      setError('Failed to retrieve analytics and insights data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const handleExportCSV = () => {
    window.open(`${api.defaults.baseURL}/analytics/export/csv?timeRange=${timeRange}`, '_blank');
  };

  const handleExportPDF = () => {
    window.open(`${api.defaults.baseURL}/analytics/export/pdf?timeRange=${timeRange}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const totals = analytics?.totals || {};
  const metrics = monthlySummary?.metrics || {};

  // Formatted data for charts
  const monthlyBarData = (analytics?.monthlyHistory || []).map((m) => ({
    label: `${m._id.month}/${m._id.year}`,
    value: m.impactEarned,
  }));

  const categoryDonutData = (analytics?.resourceCategories || []).map((c) => ({
    label: c._id || 'General',
    value: c.count,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Banner & Controls */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', borderLeft: '4px solid var(--color-primary)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Analytics & Insights Space</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Comprehensive performance metrics, contribution trends, and growth indicators.
          </p>
        </div>

        {/* Action Controls (Time Filter & Export Buttons) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
          
          <div className="analytics-filter-bar">
            <button className={`analytics-filter-btn ${timeRange === '7d' ? 'active' : ''}`} onClick={() => setTimeRange('7d')}>7 Days</button>
            <button className={`analytics-filter-btn ${timeRange === '30d' ? 'active' : ''}`} onClick={() => setTimeRange('30d')}>30 Days</button>
            <button className={`analytics-filter-btn ${timeRange === '90d' ? 'active' : ''}`} onClick={() => setTimeRange('90d')}>90 Days</button>
            <button className={`analytics-filter-btn ${timeRange === '365d' ? 'active' : ''}`} onClick={() => setTimeRange('365d')}>1 Year</button>
          </div>

          <div className="export-toolbar">
            <button onClick={handleExportCSV} className="export-btn" title="Download CSV File">
              <FiDownload /> CSV
            </button>
            <button onClick={handleExportPDF} className="export-btn" title="Print PDF Report">
              <FiPrinter /> PDF
            </button>
          </div>

        </div>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      {/* Monthly Growth Highlights */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Monthly Growth Comparison ({monthlySummary?.monthName || 'Current Month'})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
          
          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Projects Completed</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics.projectsCompleted?.current || 0}</span>
              <span className={`growth-badge ${(metrics.projectsCompleted?.growthPercent || 0) >= 0 ? 'positive' : 'negative'}`}>
                {(metrics.projectsCompleted?.growthPercent || 0) >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                {Math.abs(metrics.projectsCompleted?.growthPercent || 0)}%
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vs {metrics.projectsCompleted?.previous || 0} last month</span>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Resources Shared</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics.resourcesShared?.current || 0}</span>
              <span className={`growth-badge ${(metrics.resourcesShared?.growthPercent || 0) >= 0 ? 'positive' : 'negative'}`}>
                {(metrics.resourcesShared?.growthPercent || 0) >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                {Math.abs(metrics.resourcesShared?.growthPercent || 0)}%
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vs {metrics.resourcesShared?.previous || 0} last month</span>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Workshops Attended</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics.workshopsAttended?.current || 0}</span>
              <span className={`growth-badge ${(metrics.workshopsAttended?.growthPercent || 0) >= 0 ? 'positive' : 'negative'}`}>
                {(metrics.workshopsAttended?.growthPercent || 0) >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                {Math.abs(metrics.workshopsAttended?.growthPercent || 0)}%
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vs {metrics.workshopsAttended?.previous || 0} last month</span>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>New Connections</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics.newConnections?.current || 0}</span>
              <span className={`growth-badge ${(metrics.newConnections?.growthPercent || 0) >= 0 ? 'positive' : 'negative'}`}>
                {(metrics.newConnections?.growthPercent || 0) >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                {Math.abs(metrics.newConnections?.growthPercent || 0)}%
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vs {metrics.newConnections?.previous || 0} last month</span>
          </div>

        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
        
        {/* Bar Chart: Impact Points Earned Over Time */}
        <div className="chart-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Impact Points Earned Trajectory</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monthly contribution activity score history.</p>
          <BarChart data={monthlyBarData} height={180} />
        </div>

        {/* Donut Chart: Resource Categories Breakdown */}
        <div className="chart-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Knowledge Resource Category Breakdown</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Distribution of topics shared with the community.</p>
          <DonutChart data={categoryDonutData} size={150} />
        </div>

      </div>

      {/* Lifetime Contribution Summary */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Lifetime Platform Contributions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          
          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Projects Created</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>{totals.projectsCreated || 0}</div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Projects Joined</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>{totals.projectsJoined || 0}</div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Communities</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>{totals.communitiesJoined || 0}</div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Workshops Hosted</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>{totals.workshopsHosted || 0}</div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Messages Sent</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>{totals.messagesSent || 0}</div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Analytics;
