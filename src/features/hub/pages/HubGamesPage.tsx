/**
 * Hub Games Page
 * Full-screen page with standard Hub light theme styling
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GamesTab } from '@/features/nearby/GamesTab';
import { useHub } from '@/features/hub/useHub';
import { HubHeader } from '../components/HubHeader';
import { HubCreateGameSheet } from '../components/HubCreateGameSheet';
import '../home/hubThemeLight.css';

export function HubGamesPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { navigateFromHub } = useHub();
  const [isCreateGameSheetOpen, setIsCreateGameSheetOpen] = useState(false);

  const goBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      nav(-1);
    } else {
      nav('/hub', { replace: true });
    }
  };

  const handleOpenCreate = () => {
    setIsCreateGameSheetOpen(true);
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: 'var(--hub-backdrop)',
          backdropFilter: `blur(var(--hub-backdrop-blur))`,
          WebkitBackdropFilter: `blur(var(--hub-backdrop-blur))`,
        }} 
      />
      
      {/* Glass Sheet */}
      <div
        className="hub-glass-page fixed inset-0"
        style={{
          background: 'var(--hub-bg-start)',
          border: '1px solid var(--hub-stroke-subtle)',
          boxShadow: 'var(--hub-shadow-main)',
        }}
      >
        <HubHeader title="Games" onBack={goBack} />

        {/* Content area - GamesTab content */}
        <div className="overflow-y-auto h-screen pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
          <GamesTab onOpenCreate={handleOpenCreate} />
        </div>
      </div>
      
      <HubCreateGameSheet 
        isOpen={isCreateGameSheetOpen} 
        onClose={() => setIsCreateGameSheetOpen(false)} 
      />
    </div>
  );
}
