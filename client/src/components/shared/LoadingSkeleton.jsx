import React from 'react';
import '../../styles/user/discover.css';

const LoadingSkeleton = ({ count = 6 }) => {
  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-shimmer"></div>
          {/* Avatar loading circle */}
          <div className="skeleton-avatar"></div>
          
          {/* Text loading lines */}
          <div className="skeleton-line" style={{ width: '60%' }}></div>
          <div className="skeleton-line" style={{ width: '40%', height: '10px' }}></div>
          <div className="skeleton-line" style={{ width: '80%', height: '10px', marginTop: '1rem' }}></div>
          
          {/* Tags loading block */}
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            <div className="skeleton-line" style={{ width: '25%', height: '24px', borderRadius: '12px' }}></div>
            <div className="skeleton-line" style={{ width: '25%', height: '24px', borderRadius: '12px' }}></div>
          </div>

          {/* Button loading block */}
          <div className="skeleton-line" style={{ width: '100%', height: '36px', borderRadius: '8px', marginTop: 'auto' }}></div>
        </div>
      ))}
    </>
  );
};

export default LoadingSkeleton;
