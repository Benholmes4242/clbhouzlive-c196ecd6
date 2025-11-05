import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useOpenSheet } from '../../sheets/useOpenSheet';

function QA({ label, onClick, icon }: { label: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button 
      className="qa" 
      onClick={(e) => { e.stopPropagation(); onClick(); }} 
      aria-label={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '14px 10px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
    >
      <div className="qa-icon" style={{ fontSize: '22px', lineHeight: 1 }}>{icon}</div>
      <div className="qa-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hub-text-body)' }}>{label}</div>
    </button>
  );
}

export function QuickActionsTile() {
  const openSheet = useOpenSheet();
  const navigate = useNavigate();

  const openCreateGame = () => openSheet('create-game');
  const openEcho = () => openSheet('echo');
  const openSwing = () => openSheet('swing-coach');
  const openProfile = () => navigate('/profile');

  return (
    <Tile title="Quick Actions">
      <div 
        className="quick-grid" 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        <QA label="Create Game" onClick={openCreateGame} icon="⛳" />
        <QA label="Ask Echo" onClick={openEcho} icon="💬" />
        <QA label="Upload Swing" onClick={openSwing} icon="🏌️" />
        <QA label="Profile" onClick={openProfile} icon="👤" />
      </div>
    </Tile>
  );
}
