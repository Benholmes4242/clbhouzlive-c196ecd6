/**
 * HubFloatingDock - Bottom-anchored dock with center camera button
 * Links to create moment modal
 * Supports time-of-day theming for glass effect
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Search, User, Plus, Sparkles, Home } from 'lucide-react';
import { useHub } from '@/features/hub/useHub';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { HubEchoSheet } from '../../components/HubEchoSheet';
import { HubGamesTripsSheet } from '../../components/HubGamesTripsSheet';
import { CreateGameTripSheetV2 } from '../../components/create-game-trip-v2';
import EnhancedCreateMomentModalCinematic from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { useHubTimeOfDay } from '../hooks/useHubTimeOfDay';

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
        "transition-all duration-[120ms] ease-out",
        "active:scale-[0.92]", // V2 micro press
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
            : "text-slate-400" // Reduced visual weight - hub is the destination
        )}
      />
      <span 
        className={cn(
          "text-[10px] leading-none transition-colors duration-300",
          isActive 
            ? "text-slate-800" 
            : "text-[rgba(15,23,42,0.55)]" // V2 muted label
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
  const theme = useHubTimeOfDay();
  const [isEchoSheetOpen, setIsEchoSheetOpen] = useState(false);
  const [isGamesTripsHubOpen, setIsGamesTripsHubOpen] = useState(false);
  const [isCreateGameTripOpen, setIsCreateGameTripOpen] = useState(false);
  const [isCreateMomentOpen, setIsCreateMomentOpen] = useState(false);

  // Only apply themed dock on /hub route
  const isHubRoute = location.pathname === '/hub';

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

  const handleOpenGamesTripsHub = () => {
    haptic('medium');
    setIsGamesTripsHubOpen(true);
  };

  const handleOpenCreateGameTrip = () => {
    setIsCreateGameTripOpen(true);
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
      {/* Anchored dock - full width at bottom, time-of-day glass effect */}
      <nav 
        className="sticky bottom-0 left-0 right-0 z-[10000] w-full"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div 
          className="relative w-full h-[55px] flex items-center justify-around"
          style={{
            background: isHubRoute ? theme.dockBg : 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderTop: `1px solid ${isHubRoute ? theme.dockBorder : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: isHubRoute ? theme.dockShadow : '0 -8px 24px rgba(0,0,0,0.10)',
          }}
        >
          {/* Premium top glow hairline */}
          <div 
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.35)' }}
          />

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

          {/* Center camera icon - same style as other dock items */}
          <DockItem 
            icon={Camera} 
            label="Moment" 
            onClick={handleCreateMoment}
          />

          {/* Right items: Create Game, Profile */}
          <DockItem 
            icon={Plus} 
            label="Create" 
            onClick={handleOpenGamesTripsHub}
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
      
      <HubGamesTripsSheet 
        isOpen={isGamesTripsHubOpen} 
        onClose={() => setIsGamesTripsHubOpen(false)}
        onOpenCreate={handleOpenCreateGameTrip}
      />

      <CreateGameTripSheetV2
        isOpen={isCreateGameTripOpen}
        onClose={() => setIsCreateGameTripOpen(false)}
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
