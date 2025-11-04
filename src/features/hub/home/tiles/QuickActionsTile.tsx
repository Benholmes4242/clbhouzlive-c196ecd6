/**
 * Quick Actions Tile
 * iOS Control Center style action grid
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useOpenSheet } from '@/features/hub/sheets/useOpenSheet';

type Action = {
  label: string;
  icon: string;
  onClick: () => void;
};

export function QuickActionsTile() {
  const nav = useNavigate();
  const openSheet = useOpenSheet();

  const actions: Action[] = [
    { label: 'Create Game', icon: '⛳', onClick: () => openSheet('create-game') },
    { label: 'Ask Echo', icon: '💬', onClick: () => openSheet('echo') },
    { label: 'Upload Swing', icon: '🏌️', onClick: () => openSheet('swing') },
    { label: 'Profile', icon: '👤', onClick: () => nav('/profile') },
  ];

  return (
    <Tile
      title="Quick Actions"
      onViewAll={() => openSheet('recent-echo')}
    >
      <div className="grid grid-cols-2 gap-2 flex-1">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="rounded-2xl p-3 flex flex-col items-center justify-center gap-2 transition"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="text-[11px] font-medium leading-tight text-center" style={{ color: 'var(--hub-text-body)' }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </Tile>
  );
}
