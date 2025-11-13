import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useHub } from '@/features/hub/useHub';

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
        gap: '4px',
        padding: '6px 8px',
        minWidth: 0,
        minHeight: 0,
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
      <div 
        className="qa-icon" 
        style={{ 
          fontSize: 'clamp(20px, 5vw, 28px)',
          width: 'clamp(26px, 5vw, 32px)',
          height: 'clamp(26px, 5vw, 32px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1 
        }} 
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="qa-label" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        fontWeight: 600, 
        lineHeight: 1.2 
      }}>
        <span style={{ fontSize: 'clamp(11px, 2.7vw, 13px)', textAlign: 'center', color: 'var(--hub-text-body)' }}>{labelTop}</span>
        <span style={{ fontSize: 'clamp(11px, 2.7vw, 13px)', textAlign: 'center', color: 'var(--hub-text-body)' }}>{labelBottom}</span>
      </div>
    </button>
  );
}

export function QuickActionsTile() {
  const navigate = useNavigate();
  const { navigateFromHub } = useHub();

  const comingSoon = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    alert('Coming soon');
  };

  const openProfile = () => navigate('/profile');
  const openCreateGame = () => navigateFromHub('/hub/create-game');
  const openSwing = () => navigateFromHub('/hub/swing');

  return (
    <Tile title="Quick Actions" align="center">
      <div 
        className="hub-quick-actions" 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '8px',
          height: '100%',
          padding: '0',
        }}
      >
        <QA labelTop="Create" labelBottom="Game" onClick={openCreateGame} icon="⛳" />
        <QA labelTop="Ask" labelBottom="Echo" onClick={() => navigateFromHub('/hub/echo')} icon="💬" />
        <QA labelTop="Upload" labelBottom="Swing" onClick={openSwing} icon="🏌️" />
        <QA labelTop="Your" labelBottom="Profile" onClick={openProfile} icon="👤" />
      </div>
    </Tile>
  );
}
