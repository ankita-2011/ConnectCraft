import { useState, useEffect } from 'react';
import api from '../../services/api';
import LevelBadge from '../../components/shared/LevelBadge';
import { FiBookOpen, FiBriefcase, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/impact.css';

const ImpactProfile = () => {
  const [impactData, setImpactData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchImpactData = async () => {
    setLoading(true);
    try {
      const [impRes, achRes, milRes, actRes] = await Promise.all([
        api.get('/impact/me'),
        api.get('/impact/achievements'),
        api.get('/impact/milestones'),
        api.get('/impact/activity'),
      ]);

      if (impRes.data?.status === 'success') {
        setImpactData(impRes.data.impact);
      }
      if (achRes.data?.status === 'success') {
        setAchievements(achRes.data.achievements || []);
      }
      if (milRes.data?.status === 'success') {
        setMilestones(milRes.data.milestones || []);
      }
      if (actRes.data?.status === 'success') {
        setActivity(actRes.data.activity || []);
      }
    } catch  {
      setError('Failed to retrieve impact and recognition data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpactData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const levelInfo = impactData?.levelInfo || { currentLevel: 'Explorer', progressPercent: 0, nextLevel: 'Collaborator', minPoints: 0, nextPoints: 100 };
  const stats = impactData?.stats || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Banner */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', borderLeft: '4px solid var(--color-primary)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Impact & Recognition Space</h1>
            <LevelBadge level={levelInfo.currentLevel} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            ConnectCraft recognizes your meaningful contributions to projects, learning communities, and peer collaboration.
          </p>
        </div>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      {/* Level Progression Progress Card */}
      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Current Recognition Level</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{levelInfo.currentLevel}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>→ Next Level: <strong>{levelInfo.nextLevel}</strong></span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{levelInfo.progressPercent}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Progress to Next Level</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="level-progress-bg">
          <div className="level-progress-fill" style={{ width: `${levelInfo.progressPercent}%` }}></div>
        </div>
      </div>

      {/* Contribution Statistics Summary Grid */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Contribution Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          
          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-primary)', fontSize: '1.25rem' }}>
              <FiBriefcase />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.projCreatedCount || 0}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Projects Created</span>
            </div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-success)', fontSize: '1.25rem' }}>
              <FiCheckCircle />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.projCompletedCount || 0}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Projects Completed</span>
            </div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-warning)', fontSize: '1.25rem' }}>
              <FiBookOpen />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.resourcesCount || 0}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Resources Shared</span>
            </div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(236,72,153,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-accent)', fontSize: '1.25rem' }}>
              <FiCalendar />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.workshopsHostedCount || 0}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Workshops Hosted</span>
            </div>
          </div>

        </div>
      </div>

      {/* Achievements Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Achievements & Badges ({achievements.filter((a) => a.isUnlocked).length} / {achievements.length})</h3>
        </div>

        <div className="achievement-grid">
          {achievements.map((ach) => (
            <div key={ach._id} className={`achievement-card ${ach.isUnlocked ? '' : 'locked'}`}>
              <div className="achievement-icon-circle">
                {ach.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{ach.title}</h4>
                  {ach.isUnlocked && <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600 }}>Unlocked</span>}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3, marginTop: '0.2rem' }}>
                  {ach.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Long-Term Milestones */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Milestones Tracker</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {milestones.map((ms, idx) => (
            <div key={idx} className="milestone-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{ms.title}</h4>
                <span style={{ fontSize: '0.75rem', color: ms.completed ? 'var(--color-success)' : 'var(--color-primary)', fontWeight: 700 }}>
                  {ms.current} / {ms.target}
                </span>
              </div>
              <div className="level-progress-bg" style={{ height: '6px' }}>
                <div className="level-progress-fill" style={{ width: `${ms.progressPercent}%`, backgroundColor: ms.completed ? 'var(--color-success)' : 'var(--color-primary)' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Activity Recognition Timeline</h3>
        {activity.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No activity history logged yet.</p>
        ) : (
          <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)' }}>
            <div className="timeline">
              {activity.map((act) => (
                <div key={act._id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.description}</p>
                    <span className="timeline-time" style={{ fontSize: '0.7rem' }}>{new Date(act.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ImpactProfile;
