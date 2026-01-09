/**
 * HubFloatingDock - Bottom-anchored dock with center camera button
 * Links to create moment modal
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Search, User, Plus, Sparkles, Home } from 'lucide-react';
import { useHub } from '@/features/hub/useHub';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { HubEchoSheet } from '../../components/HubEchoSheet';
import { HubGamesHubSheet } from '../../components/HubGamesHubSheet';
import EnhancedCreateMomentModalCinematic from '@/components/post/EnhancedCreateMomentModal.cinematic';

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
          "h-[26px] w-[26px] transition-colors duration-300",
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
  const [isCreateMomentOpen, setIsCreateMomentOpen] = useState(false);

  const handleNavigate = (path: string, external = false) => {
    haptic('light');
    if (external) {
      close();
    }
    navigate(path);
  };

  const handleHomeToClubhouse = () => {
    haptic('light');
    close();
    navigate('/clubhouse');
  };

  const handleCreateGame = () => {
    haptic('medium');
    setIsGamesHubOpen(true);
  };

  const handleCreateMoment = () => {
    haptic('medium');
    setIsCreateMomentOpen(true);
  };

  const handleEcho = () => {
    haptic('light');
    setIsEchoSheetOpen(true);
  };

  return (
    <>
      {/* Anchored dock - full width at bottom, no background */}
      <nav 
        className="sticky bottom-0 left-0 right-0 z-[10000] w-full"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div 
          className="w-full h-[55px] flex items-center justify-between px-4 rounded-t-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            borderBottom: 'none',
          }}
        >
          {/* Left items: Home (goes to Clubhouse), Search */}
          <DockItem 
            icon={Home} 
            label="Home" 
            onClick={handleHomeToClubhouse}
          />
          <DockItem 
            icon={Search} 
            label="Search" 
            onClick={() => handleNavigate('/discover', true)}
          />

          {/* Center orange glass camera button */}
          <button
            className="h-14 w-14 rounded-full flex items-center justify-center -mt-3 transition-transform active:scale-95"
            style={{
              background: 'radial-gradient(circle at 30% 25%, rgba(255, 170, 90, 0.85), rgba(255, 120, 40, 0.55))',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              boxShadow: '0 14px 30px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            onClick={handleCreateMoment}
            aria-label="Create Moment"
          >
            <Camera className="h-5 w-5" style={{ color: 'var(--hub-primary-text)' }} strokeWidth={2} />
          </button>

          {/* Right items: Create Game, Profile */}
          <DockItem 
            icon={Plus} 
            label="Create Game" 
            onClick={handleCreateGame}
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

      <EnhancedCreateMomentModalCinematic
        isOpen={isCreateMomentOpen}
        onClose={() => setIsCreateMomentOpen(false)}
        onSubmit={() => setIsCreateMomentOpen(false)}
        isSubmitting={false}
      />
    </>
  );
}
