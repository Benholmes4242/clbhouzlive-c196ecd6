/**
 * EmptyState - Premium empty states for each tab
 */

import React from 'react';
import { CalendarPlus, History, Plane, Plus } from 'lucide-react';
import type { SheetTab } from './types';

interface EmptyStateProps {
  tab: SheetTab;
  onCreateGame?: () => void;
  onCreateTrip?: () => void;
}

const CONFIG: Record<SheetTab, { 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string; 
  cta?: { label: string; action: 'game' | 'trip' } 
}> = {
  upcoming: {
    icon: <CalendarPlus className="w-6 h-6" style={{ color: 'rgba(30, 41, 59, 0.3)' }} />,
    title: 'No upcoming games yet',
    subtitle: 'Create one and invite your group.',
    cta: { label: 'Create Game', action: 'game' },
  },
  past: {
    icon: <History className="w-6 h-6" style={{ color: 'rgba(30, 41, 59, 0.3)' }} />,
    title: 'No past games',
    subtitle: 'Your completed games will show here.',
  },
  trips: {
    icon: <Plane className="w-6 h-6" style={{ color: 'rgba(30, 41, 59, 0.3)' }} />,
    title: 'No trips yet',
    subtitle: 'Trips keep your games and moments together.',
    cta: { label: 'Create Trip', action: 'trip' },
  },
};

export function EmptyState({ tab, onCreateGame, onCreateTrip }: EmptyStateProps) {
  const config = CONFIG[tab];
  
  const handleCtaClick = () => {
    if (config.cta?.action === 'game' && onCreateGame) {
      onCreateGame();
    } else if (config.cta?.action === 'trip' && onCreateTrip) {
      onCreateTrip();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Icon container */}
      <div 
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.02) 100%)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
        }}
      >
        {config.icon}
      </div>

      {/* Title */}
      <h3 
        className="text-[16px] font-semibold mb-1"
        style={{ color: '#1e293b' }}
      >
        {config.title}
      </h3>

      {/* Subtitle */}
      <p 
        className="text-[13px] mb-5 max-w-[240px]"
        style={{ color: 'rgba(30, 41, 59, 0.55)' }}
      >
        {config.subtitle}
      </p>

      {/* CTA Button */}
      {config.cta && (
        <button
          onClick={handleCtaClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-medium transition-all duration-150 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 140, 60, 0.12) 0%, rgba(255, 180, 100, 0.08) 100%)',
            border: '1px solid rgba(255, 140, 60, 0.15)',
            color: 'rgba(180, 90, 30, 0.9)',
          }}
        >
          <Plus className="w-4 h-4" />
          {config.cta.label}
        </button>
      )}
    </div>
  );
}
