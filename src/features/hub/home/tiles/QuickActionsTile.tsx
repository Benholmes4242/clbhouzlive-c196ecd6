import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useHub } from '@/features/hub/useHub';

function QA({ label, onClick, icon }: { 
  label: string; 
  onClick: () => void; 
  icon: React.ReactNode;
}) {
  return (
    <button 
      className="hub-quick-squircle" 
      onClick={(e) => { e.stopPropagation(); onClick(); }} 
      aria-label={label}
    >
      <span className="hub-quick-squircle-icon">
        {icon}
      </span>
      <span className="hub-quick-squircle-label">
        {label}
      </span>
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
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginTop: '8px',
        }}
      >
        <QA label="Create Game" onClick={openCreateGame} icon="⛳" />
        <QA label="Ask Echo" onClick={() => navigateFromHub('/hub/echo')} icon="💬" />
        <QA label="Upload Swing" onClick={openSwing} icon="🏌️" />
        <QA label="Your Profile" onClick={openProfile} icon="👤" />
      </div>
    </Tile>
  );
}
