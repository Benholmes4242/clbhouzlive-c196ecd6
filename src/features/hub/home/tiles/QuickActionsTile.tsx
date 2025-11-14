import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useHub } from '@/features/hub/useHub';

// Quick Action Button - Apple-style compact glass button
function QA({ labelTop, labelBottom, onClick, icon }: { 
  labelTop: string; 
  labelBottom: string; 
  onClick: () => void; 
  icon: React.ReactNode;
}) {
  const lightTap = () => {
    try {
      (window.navigator as any)?.vibrate?.(5);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={() => {
        lightTap();
        onClick();
      }}
      className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 rounded-[12px] border border-[color:var(--hub-stroke-subtle)] bg-[color:var(--hub-glass-bg-subtle)] px-2 py-2.5 text-center transition-transform duration-100 active:scale-[0.97]"
      style={{
        backdropFilter: 'blur(28px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--hub-glass-bg-subtle)';
      }}
      aria-label={`${labelTop} ${labelBottom}`}
    >
      {/* Icon */}
      <span className="text-[18px] leading-none" style={{ color: 'var(--hub-text)' }}>
        {icon}
      </span>

      {/* Labels stacked */}
      <div className="flex flex-col items-center">
        <span className="text-[11px] leading-tight font-medium" style={{ color: 'var(--hub-text-body)' }}>
          {labelTop}
        </span>
        <span className="text-[11px] leading-tight text-[color:var(--hub-text-muted)]">
          {labelBottom}
        </span>
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
      <div className="mt-1 grid grid-cols-2 gap-2">
        <QA labelTop="Create" labelBottom="Game" onClick={openCreateGame} icon="⛳" />
        <QA labelTop="Ask" labelBottom="Echo" onClick={() => navigateFromHub('/hub/echo')} icon="💬" />
        <QA labelTop="Upload" labelBottom="Swing" onClick={openSwing} icon="🏌️" />
        <QA labelTop="Your" labelBottom="Profile" onClick={openProfile} icon="👤" />
      </div>
    </Tile>
  );
}
