import { Link } from 'react-router-dom';

const PlanetIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Background Container Gradient (Emerald Theme) */}
      <linearGradient id="emeraldBgGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#064E3B" />
        <stop offset="50%" stopColor="#047857" />
        <stop offset="100%" stopColor="#065F46" />
      </linearGradient>

      {/* Planet Base Sphere Radial Gradient */}
      <radialGradient id="emeraldPlanetGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="25%" stopColor="#10B981" />
        <stop offset="65%" stopColor="#059669" />
        <stop offset="90%" stopColor="#047857" />
        <stop offset="100%" stopColor="#064E3B" />
      </radialGradient>

      {/* Orbital Ring Gradient */}
      <linearGradient id="emeraldRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="35%" stopColor="#34D399" />
        <stop offset="70%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>

      {/* Ring Glow / Inner Accent Line Gradient */}
      <linearGradient id="ringHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ECFDF5" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.5" />
      </linearGradient>

      {/* Planet Specular Lighting Overlay */}
      <radialGradient id="planetHighlight" cx="30%" cy="30%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
        <stop offset="50%" stopColor="#A7F3D0" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
      </radialGradient>

      {/* Elevation Drop Shadow */}
      <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#047857" floodOpacity="0.4" />
      </filter>

      {/* Planet Clip Path for Surface Bands */}
      <clipPath id="planetClip">
        <circle cx="50" cy="50" r="22" />
      </clipPath>
    </defs>

    {/* 1. Squircle Container */}
    <rect width="100" height="100" rx="22" fill="url(#emeraldBgGrad)" filter="url(#emeraldGlow)" />

    {/* 2. Background Cosmic Accents / Stars */}
    <circle cx="26" cy="24" r="1.2" fill="#A7F3D0" opacity="0.6" />
    <circle cx="76" cy="74" r="1" fill="#A7F3D0" opacity="0.5" />
    <path d="M 76 22 L 77.5 25 L 80.5 26.5 L 77.5 28 L 76 31 L 74.5 28 L 71.5 26.5 L 74.5 25 Z" fill="#D1FAE5" opacity="0.75" />

    {/* 3. Orbital Ring - BACK ARC (behind planet) */}
    <g transform="rotate(-28 50 50)">
      <path
        d="M 10 50 A 40 12 0 0 1 90 50"
        stroke="url(#emeraldRingGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M 16 50 A 34 9 0 0 1 84 50"
        stroke="url(#ringHighlight)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </g>

    {/* 4. Planet Sphere */}
    <circle cx="50" cy="50" r="22" fill="url(#emeraldPlanetGrad)" stroke="#34D399" strokeWidth="0.75" />

    {/* 5. Surface Bands & Lighting (Clipped to Planet) */}
    <g clipPath="url(#planetClip)">
      <path
        d="M 20 44 C 32 40, 68 40, 80 44 C 68 47, 32 47, 20 44 Z"
        fill="#34D399"
        opacity="0.25"
      />
      <path
        d="M 22 58 C 34 54, 66 54, 78 58 C 66 61, 34 61, 22 58 Z"
        fill="#065F46"
        opacity="0.3"
      />
      <circle cx="50" cy="50" r="22" fill="url(#planetHighlight)" />
    </g>

    {/* 6. Orbital Ring - FRONT ARC (in front of planet) */}
    <g transform="rotate(-28 50 50)">
      <path
        d="M 90 50 A 40 12 0 0 1 10 50"
        stroke="url(#emeraldRingGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 84 50 A 34 9 0 0 1 16 50"
        stroke="url(#ringHighlight)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </g>

    {/* 7. Specular Sparkle Highlight on Ring Corner */}
    <circle cx="21" cy="62" r="1.5" fill="#FFFFFF" opacity="0.9" />
  </svg>
);

const Logo = ({ size = 'medium', showText = true, to = '/' }) => {
  const iconSizes = {
    small: { box: '28px', icon: 28, fontSize: '0.75rem', radius: '8px' },
    medium: { box: '36px', icon: 36, fontSize: '0.875rem', radius: '10px' },
    large: { box: '52px', icon: 52, fontSize: '1.1rem', radius: '14px' },
  };

  const textSizes = {
    small: '1.05rem',
    medium: '1.3rem',
    large: '1.65rem',
  };

  const config = iconSizes[size] || iconSizes.medium;

  const content = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
      <div
        style={{
          width: config.box,
          height: config.box,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <PlanetIcon size={config.icon} />
      </div>
      {showText && (
        <span
          className="logo-brand-text"
          style={{
            fontWeight: 800,
            fontSize: textSizes[size] || textSizes.medium,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          <span className="logo-word-connect">Connect</span>
          <span className="logo-word-craft">Craft</span>
        </span>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link>;
  }

  return content;
};

export default Logo;
