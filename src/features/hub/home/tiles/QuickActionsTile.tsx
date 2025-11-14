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
      type="button"
      className="hub-quick-squircle" 
      onClick={(e) => { e.stopPropagation(); onClick(); }} 
      aria-label={label}
    >
      <span className="text-[22px] leading-none" aria-hidden="true">
        {icon}
      </span>
      <span className="text-[11px] leading-tight text-center" style={{ color: 'var(--hub-text-muted)' }}>
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

  const actions = [
    { id: 'create-game', label: 'Create Game', icon: '⛳', onPress: openCreateGame },
    { id: 'ask-echo', label: 'Ask Echo', icon: '💬', onPress: () => navigateFromHub('/hub/echo') },
    { id: 'upload-swing', label: 'Upload Swing', icon: '🏌️', onPress: openSwing },
    { id: 'profile', label: 'Your Profile', icon: '👤', onPress: openProfile },
  ];

  return (
    <Tile title="" align="center">
      <div className="flex h-full flex-col">
        {/* Header */}
        <h3 className="text-[15px] font-semibold mb-2" style={{ color: 'var(--hub-text-bright)' }}>
          Quick Actions
        </h3>

        {/* 2×2 grid */}
        <div className="grid flex-1 grid-cols-2 gap-8 pt-1 pb-1">
          {actions.map((action) => (
            <QA
              key={action.id}
              label={action.label}
              icon={action.icon}
              onClick={action.onPress}
            />
          ))}
        </div>
      </div>
    </Tile>
  );
}
