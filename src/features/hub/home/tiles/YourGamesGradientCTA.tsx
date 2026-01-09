/**
 * YourGamesGradientCTA - Full-width gradient "Your Games" button
 * Expands to fill remaining vertical space in Hub
 */

import React, { useState } from 'react';
import { Calendar, MapPin, Plane } from 'lucide-react';
import { HubGamesHubSheet } from '@/features/hub/components/HubGamesHubSheet';
import { haptic } from '@/utils/haptics';
import { HUB_DEMO_MODE, MOCK_YOUR_GAMES_SUMMARY, MOCK_NEXT_GAME, MOCK_NEXT_TRIP } from '../hubDemoConfig';

interface YourGamesGradientCTAProps {
  className?: string;
}

export function YourGamesGradientCTA({ className }: YourGamesGradientCTAProps) {
  const [gamesHubOpen, setGamesHubOpen] = useState(false);

  const openYourGames = () => {
    haptic('light');
    setGamesHubOpen(true);
  };

  // Demo diary items
  const diaryItems = HUB_DEMO_MODE ? [
    {
      type: 'game' as const,
      title: MOCK_NEXT_GAME.courseName,
      subtitle: 'Sun · 1:00 PM',
      icon: MapPin,
    },
    {
      type: 'trip' as const,
      title: MOCK_NEXT_TRIP.tripName,
      subtitle: 'May 12–16',
      icon: Plane,
    },
  ] : [];

  return (
    <>
      <button
        onClick={openYourGames}
        className={`w-full rounded-[22px] overflow-hidden relative flex flex-col transition-all active:scale-[0.98] ${className || ''}`}
        style={{
          background: `
            radial-gradient(1200px 300px at 10% 0%, rgba(255, 140, 60, 0.20), transparent 60%),
            linear-gradient(135deg, rgba(255, 160, 90, 0.14), rgba(255, 200, 150, 0.06))
          `,
          border: '1px solid rgba(255, 255, 255, 0.55)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
          minHeight: '80px',
        }}
      >
        {/* Header row */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div 
            className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ 
              background: 'rgba(255, 140, 60, 0.15)',
              border: '1px solid rgba(255, 140, 60, 0.25)',
            }}
          >
            <Calendar className="h-4 w-4" style={{ color: 'rgba(180, 90, 30, 0.8)' }} />
          </div>
          
          <div className="flex-1 text-left min-w-0">
            <div 
              className="text-[15px] font-extrabold"
              style={{ color: 'var(--hub-text)' }}
            >
              Your Games
            </div>
          </div>
        </div>

        {/* Diary preview area - fills remaining space */}
        <div className="flex-1 px-4 pb-3 flex flex-col justify-start gap-1.5">
          {HUB_DEMO_MODE && diaryItems.length > 0 ? (
            <>
              {diaryItems.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--hub-text-dim)' }} />
                  <span 
                    className="text-[12px] font-medium line-clamp-1"
                    style={{ color: 'var(--hub-text)' }}
                  >
                    {item.title}
                  </span>
                  <span 
                    className="text-[11px] ml-auto flex-shrink-0"
                    style={{ color: 'var(--hub-text-muted)' }}
                  >
                    {item.subtitle}
                  </span>
                </div>
              ))}
              {MOCK_YOUR_GAMES_SUMMARY.upcomingCount > 0 && (
                <div 
                  className="text-[11px] mt-1 px-2.5"
                  style={{ color: 'var(--hub-text-muted)' }}
                >
                  +{MOCK_YOUR_GAMES_SUMMARY.upcomingCount} more upcoming
                </div>
              )}
            </>
          ) : (
            <div 
              className="text-[12px]"
              style={{ color: 'var(--hub-text-muted)' }}
            >
              Trips, matches, games – your golf diary.
            </div>
          )}
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
