import React from 'react';
import { FiSearch } from 'react-icons/fi';
import '../../styles/user/auth.css';

const EmptyState = ({ 
  title = "No Matches Found", 
  message = "Try adjusting your query strings or filters to expand your search.", 
  onReset 
}) => {
  return (
    <div 
      className="glass" 
      style={{ 
        padding: '4rem 2rem', 
        borderRadius: 'var(--border-radius-lg)', 
        textAlign: 'center',
        margin: '2rem auto',
        maxWidth: '500px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        animation: 'cardFadeIn 0.3s ease-out'
      }}
    >
      <div 
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--text-muted)',
          fontSize: '1.75rem',
          marginBottom: '0.5rem'
        }}
      >
        <FiSearch />
      </div>
      
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
        {message}
      </p>

      {onReset && (
        <button 
          onClick={onReset} 
          className="btn-primary" 
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', marginTop: '1rem' }}
        >
          Reset Filters
        </button>
      )}
    </div>
  );
};

export default EmptyState;
