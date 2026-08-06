import '../../styles/user/impact.css';

const LEVEL_ICONS = {
  Explorer: '🧭',
  Collaborator: '🤝',
  Creator: '💡',
  Mentor: '🎓',
  Leader: '👑',
  Visionary: '🚀',
};

const LevelBadge = ({ level = 'Explorer', showIcon = true }) => {
  const icon = LEVEL_ICONS[level] || '🧭';

  return (
    <span className={`level-badge ${level}`}>
      {showIcon && <span>{icon}</span>}
      <span>{level}</span>
    </span>
  );
};

export default LevelBadge;
