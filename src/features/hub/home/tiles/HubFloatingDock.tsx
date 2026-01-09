/**
 * HubFloatingDock - Floating rounded dock with center blue plus
 * Replaces standard bottom nav
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, User, Calendar, Sparkles } from 'lucide-react';
import { useHub } from '@/features/hub/useHub';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { HubEchoSheet } from '../../components/HubEchoSheet';
import { HubGamesHubSheet } from '../../components/HubGamesHubSheet';

interface DockItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

function DockItem({ icon: Icon, label, onClick, isActive }: DockItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 flex-1 py-1",
        "transition-transform duration-[120ms] ease-out",
        "active:scale-95",
        "focus:outline-none"
      )}
      aria-label={label}
    >
      <Icon 
        className={cn(
          "h-[22px] w-[22px] transition-colors duration-300",
          "[stroke-width:1.5]",
          isActive 
            ? "text-slate-800" 
            : "text-slate-500"
        )}
      />
      <span 
        className={cn(
          "text-[10px] leading-none transition-colors duration-300",
          isActive 
            ? "text-slate-800" 
            : "text-slate-500"
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function HubFloatingDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const { close } = useHub();
  const [isEchoSheetOpen, setIsEchoSheetOpen] = useState(false);
  const [isGamesHubOpen, setIsGamesHubOpen] = useState(false);

  const handleNavigate = (path: string, external = false) => {
    haptic('light');
    if (external) {
      close();
    }
    navigate(path);
  };

  const handleCreateGame = () => {
    haptic('medium');
    setIsGamesHubOpen(true);
  };

  const handleEcho = () => {
    haptic('light');
    setIsEchoSheetOpen(true);
  };

  return (
    <>
      {/* Anchored dock - sticky at bottom, not floating */}
      <nav 
        className="sticky bottom-0 left-0 right-0 z-[10000] flex justify-center"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: '16px',
          paddingRight: '16px',
          paddingTop: '8px',
          background: 'transparent',
        }}
      >
        <div 
          className="w-full max-w-[430px] h-[72px] rounded-[32px] flex items-center justify-between px-4"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Left items: Your Games, Search */}
          <DockItem 
            icon={Calendar} 
            label="Your Games" 
            onClick={handleCreateGame}
          />
          <DockItem 
            icon={Search} 
            label="Search" 
            onClick={() => handleNavigate('/discover', true)}
          />

          {/* Center orange glass plus button */}
          <button
            className="h-[64px] w-[64px] rounded-full flex items-center justify-center -mt-6 transition-transform active:scale-95"
            style={{
              background: 'radial-gradient(circle at 30% 25%, rgba(255, 170, 90, 0.85), rgba(255, 120, 40, 0.55))',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              boxShadow: '0 14px 30px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            onClick={handleCreateGame}
            aria-label="Create"
          >
            <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
          </button>

          {/* Right items: Echo, Profile */}
          <DockItem 
            icon={Sparkles} 
            label="Echo" 
            onClick={handleEcho}
          />
          <DockItem 
            icon={User} 
            label="Profile" 
            onClick={() => handleNavigate('/profile', true)}
          />
        </div>
      </nav>
      
      <HubEchoSheet 
        isOpen={isEchoSheetOpen} 
        onClose={() => setIsEchoSheetOpen(false)} 
      />
      
      <HubGamesHubSheet 
        isOpen={isGamesHubOpen} 
        onClose={() => setIsGamesHubOpen(false)}
        initialTab="yours"
      />
    </>
  );
}
