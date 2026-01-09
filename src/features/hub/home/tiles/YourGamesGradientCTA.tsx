/**
 * YourGamesGradientCTA - Full-width gradient "Your Games" button
 * Subtle orange gradient, premium CTA
 */

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { HubGamesHubSheet } from '@/features/hub/components/HubGamesHubSheet';
import { haptic } from '@/utils/haptics';
import { HUB_DEMO_MODE, MOCK_YOUR_GAMES_SUMMARY } from '../hubDemoConfig';

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
        className={`w-full rounded-[22px] overflow-hidden relative flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] ${className || ''}`}
        style={{
          background: `
            radial-gradient(1200px 300px at 10% 0%, rgba(255, 140, 60, 0.20), transparent 60%),
            linear-gradient(135deg, rgba(255, 160, 90, 0.14), rgba(255, 200, 150, 0.06))
          `,
          border: '1px solid rgba(255, 255, 255, 0.55)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
          minHeight: '64px',
        }}
      >
        {/* Icon circle */}
        <div 
          className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ 
            background: 'rgba(255, 140, 60, 0.15)',
            border: '1px solid rgba(255, 140, 60, 0.25)',
          }}
        >
          <Calendar className="h-4 w-4" style={{ color: 'rgba(180, 90, 30, 0.8)' }} />
        </div>
        
        {/* Text content */}
        <div className="flex-1 text-left min-w-0">
          <div 
            className="text-[15px] font-extrabold"
            style={{ color: 'var(--hub-text)' }}
          >
            Your Games
          </div>
          <div 
            className="text-[12px] mt-0.5 line-clamp-1"
            style={{ color: 'var(--hub-text-muted)' }}
          >
            {HUB_DEMO_MODE 
              ? `${MOCK_YOUR_GAMES_SUMMARY.nextGameSummary} · ${MOCK_YOUR_GAMES_SUMMARY.nextTripSummary} · +${MOCK_YOUR_GAMES_SUMMARY.upcomingCount}`
              : 'Trips, matches, games – your golf diary.'}
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
