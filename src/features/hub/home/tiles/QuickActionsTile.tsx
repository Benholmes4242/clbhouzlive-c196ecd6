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
        width: '100%',
        aspectRatio: '1',
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
          fontSize: 'clamp(18px, 5vw, 26px)',
          width: 'clamp(24px, 5vw, 30px)',
          height: 'clamp(24px, 5vw, 30px)',
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
        <span style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', textAlign: 'center', color: 'var(--hub-text-body)' }}>{labelTop}</span>
        <span style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', textAlign: 'center', color: 'var(--hub-text-body)' }}>{labelBottom}</span>
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
      <div className="flex h-full flex-col">
        {/* 2×2 grid */}
        <div className="grid flex-1 grid-cols-2 gap-2 pt-1 pb-1">
          <button
            type="button"
            onClick={openCreateGame}
            className="hub-quick-squircle flex flex-col items-center justify-center gap-1"
            aria-label="Create Game"
          >
            <span className="text-[22px] leading-none">⛳</span>
            <span className="text-[11px] leading-tight text-center" style={{ color: 'var(--hub-text-muted)' }}>
              Create Game
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateFromHub('/hub/echo')}
            className="hub-quick-squircle flex flex-col items-center justify-center gap-1"
            aria-label="Ask Echo"
          >
            <span className="text-[22px] leading-none">💬</span>
            <span className="text-[11px] leading-tight text-center" style={{ color: 'var(--hub-text-muted)' }}>
              Ask Echo
            </span>
          </button>

          <button
            type="button"
            onClick={openSwing}
            className="hub-quick-squircle flex flex-col items-center justify-center gap-1"
            aria-label="Upload Swing"
          >
            <span className="text-[22px] leading-none">🏌️</span>
            <span className="text-[11px] leading-tight text-center" style={{ color: 'var(--hub-text-muted)' }}>
              Upload Swing
            </span>
          </button>

          <button
            type="button"
            onClick={openProfile}
            className="hub-quick-squircle flex flex-col items-center justify-center gap-1"
            aria-label="Your Profile"
          >
            <span className="text-[22px] leading-none">👤</span>
            <span className="text-[11px] leading-tight text-center" style={{ color: 'var(--hub-text-muted)' }}>
              Your Profile
            </span>
          </button>
        </div>
      </div>
    </Tile>
  );
}
