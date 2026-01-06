/**
 * HubActionDock - Persistent bottom action dock
 * 4 primary actions: Create Game, Ask Echo, Capture Moment, Profile
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bot, Camera, User } from 'lucide-react';
import { useHub } from '@/features/hub/useHub';
import { haptic } from '@/utils/haptics';

interface DockButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function DockButton({ icon, label, onClick }: DockButtonProps) {
  const handleClick = () => {
    haptic('light');
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all active:scale-[0.95]"
      style={{ background: 'transparent' }}
    >
      <div 
        className="w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ 
          background: 'var(--hub-glass-bg)',
          border: '1px solid var(--hub-stroke)',
        }}
      >
        {icon}
      </div>
      <span 
        className="text-[11px] font-medium"
        style={{ color: 'var(--hub-text-sub)' }}
      >
        {label}
      </span>
    </button>
  );
}

export function HubActionDock() {
  const navigate = useNavigate();
  const { navigateFromHub, close } = useHub();

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[10000]"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
      }}
    >
      <div 
        className="mx-3 rounded-3xl px-4 py-2"
        style={{ 
          background: 'rgba(250, 250, 251, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--hub-stroke)',
          boxShadow: '0 -4px 24px rgba(31, 36, 40, 0.08)',
        }}
      >
        <div className="flex justify-around items-center">
          <DockButton
            icon={<Plus className="w-5 h-5" style={{ color: 'var(--hub-text)' }} />}
            label="Game"
            onClick={() => navigateFromHub('/hub/create-game')}
          />
          
          <DockButton
            icon={<Bot className="w-5 h-5" style={{ color: 'var(--hub-text)' }} />}
            label="Echo"
            onClick={() => navigateFromHub('/hub/echo')}
          />
          
          <DockButton
            icon={<Camera className="w-5 h-5" style={{ color: 'var(--hub-text)' }} />}
            label="Moment"
            onClick={() => navigateFromHub('/create-moment')}
          />
          
          <DockButton
            icon={<User className="w-5 h-5" style={{ color: 'var(--hub-text)' }} />}
            label="Profile"
            onClick={() => { close(); navigate('/profile'); }}
          />
        </div>
      </div>
    </div>
  );
}
