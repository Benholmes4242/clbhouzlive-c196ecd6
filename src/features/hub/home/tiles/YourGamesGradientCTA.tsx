/**
 * YourGamesGradientCTA - Full-width gradient "Your Games" button
 * Subtle orange gradient, premium CTA
 */

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { HubGamesHubSheet } from '@/features/hub/components/HubGamesHubSheet';
import { haptic } from '@/utils/haptics';

interface YourGamesGradientCTAProps {
  className?: string;
}

export function YourGamesGradientCTA({ className }: YourGamesGradientCTAProps) {
  const [gamesHubOpen, setGamesHubOpen] = useState(false);

  const openYourGames = () => {
    haptic('light');
    setGamesHubOpen(true);
  };

  return (
    <>
      <button
        onClick={openYourGames}
        className={`w-full rounded-[22px] overflow-hidden relative flex items-center gap-4 px-5 py-[18px] transition-all active:scale-[0.98] min-h-[80px] ${className || ''}`}
        style={{
          background: `
            radial-gradient(1200px 300px at 10% 0%, rgba(255, 140, 60, 0.20), transparent 60%),
            linear-gradient(135deg, rgba(255, 160, 90, 0.14), rgba(255, 200, 150, 0.06))
          `,
          border: '1px solid rgba(255, 255, 255, 0.55)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
        }}
      >
        {/* Icon circle */}
        <div 
          className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ 
            background: 'rgba(255, 140, 60, 0.15)',
            border: '1px solid rgba(255, 140, 60, 0.25)',
          }}
        >
          <Calendar className="h-5 w-5" style={{ color: 'rgba(180, 90, 30, 0.8)' }} />
        </div>
        
        {/* Text content */}
        <div className="flex-1 text-left">
          <div 
            className="text-[17px] font-extrabold"
            style={{ color: 'var(--hub-text)' }}
          >
            Your Games
          </div>
          <div 
            className="text-[13px] mt-0.5"
            style={{ color: 'var(--hub-text-muted)' }}
          >
            Trips, matches, games, and getaways – your golf diary for everything ahead.
          </div>
        </div>
      </button>

      <HubGamesHubSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
        initialTab="yours"
      />
    </>
  );
}
