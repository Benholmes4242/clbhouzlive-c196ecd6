import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';

function QA({ labelTop, labelBottom, onClick, icon }: { 
  labelTop: string; 
  labelBottom: string; 
  onClick: () => void; 
  icon: React.ReactNode;
}) {
  return (
    <button 
      className="qa" 
      onClick={(e) => { e.stopPropagation(); onClick(); }} 
      aria-label={`${labelTop} ${labelBottom}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '10px',
        aspectRatio: '1 / 1',
        width: '100%',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        transition: 'background 0.2s',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
    >
      <div className="qa-icon" style={{ fontSize: '20px', lineHeight: 1 }} aria-hidden="true">{icon}</div>
      <div className="qa-label" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        fontWeight: 600, 
        lineHeight: 1.15 
      }}>
        <span style={{ fontSize: '12.5px', textAlign: 'center', color: 'var(--hub-text-body)' }}>{labelTop}</span>
        <span style={{ fontSize: '12.5px', textAlign: 'center', color: 'var(--hub-text-body)' }}>{labelBottom}</span>
      </div>
    </button>
  );
}

export function QuickActionsTile() {
  const navigate = useNavigate();

  const comingSoon = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    alert('Coming soon');
  };

  const openProfile = () => navigate('/profile');

  return (
    <Tile title="Quick Actions" align="center">
      <div 
        className="qa-wrap" 
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div 
          className="quick-grid" 
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            width: '100%',
          }}
        >
          <QA labelTop="Create" labelBottom="Game" onClick={comingSoon} icon="⛳" />
          <QA labelTop="Ask" labelBottom="Echo" onClick={comingSoon} icon="💬" />
          <QA labelTop="Upload" labelBottom="Swing" onClick={comingSoon} icon="🏌️" />
          <QA labelTop="Your" labelBottom="Profile" onClick={openProfile} icon="👤" />
        </div>
      </div>
    </Tile>
  );
}
