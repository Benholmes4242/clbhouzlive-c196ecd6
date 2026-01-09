/**
 * YourGamesGradientCTA - Full-width gradient "Your Games and Trips" diary card
 * Shows 2 items max (1 game + 1 trip preferred) with summary pill
 */

import React, { useState } from 'react';
import { Calendar, MapPin, Plane, ChevronRight } from 'lucide-react';
import { HubGamesHubSheet } from '@/features/hub/components/HubGamesHubSheet';
import { haptic } from '@/utils/haptics';
import { HUB_DEMO_MODE, MOCK_DIARY_ITEMS } from '../hubDemoConfig';

interface YourGamesGradientCTAProps {
  className?: string;
}

export function YourGamesGradientCTA({ className }: YourGamesGradientCTAProps) {
  const [gamesHubOpen, setGamesHubOpen] = useState(false);

  const openYourGames = () => {
    haptic('light');
    setGamesHubOpen(true);
  };

  // Get diary items from demo config or empty array
  const allItems = HUB_DEMO_MODE ? MOCK_DIARY_ITEMS : [];
  
  // Separate games and trips
  const games = allItems.filter(item => item.type === 'game');
  const trips = allItems.filter(item => item.type === 'trip');
  
  // Pick 2 items: prefer 1 game + 1 trip if both exist
  const displayItems: typeof allItems = [];
  if (games.length > 0 && trips.length > 0) {
    displayItems.push(games[0], trips[0]);
  } else if (games.length >= 2) {
    displayItems.push(games[0], games[1]);
  } else if (trips.length >= 2) {
    displayItems.push(trips[0], trips[1]);
  } else {
    // Less than 2 total items
    displayItems.push(...games.slice(0, 1), ...trips.slice(0, 1));
  }
  
  // Calculate remaining counts
  const shownGames = displayItems.filter(i => i.type === 'game').length;
  const shownTrips = displayItems.filter(i => i.type === 'trip').length;
  const moreGames = games.length - shownGames;
  const moreTrips = trips.length - shownTrips;
  
  // Build summary text
  let summaryText = '';
  if (moreGames > 0 && moreTrips > 0) {
    summaryText = `+${moreGames} game${moreGames > 1 ? 's' : ''} and ${moreTrips} trip${moreTrips > 1 ? 's' : ''} to come`;
  } else if (moreGames > 0) {
    summaryText = `+${moreGames} more game${moreGames > 1 ? 's' : ''} to come`;
  } else if (moreTrips > 0) {
    summaryText = `+${moreTrips} more trip${moreTrips > 1 ? 's' : ''} to come`;
  }

  return (
    <>
      <button
        onClick={openYourGames}
        className={`w-full rounded-[22px] overflow-hidden relative flex flex-col transition-all active:scale-[0.98] mb-3 ${className || ''}`}
        style={{
          background: `
            radial-gradient(800px 200px at 10% 0%, rgba(255, 140, 60, 0.18), transparent 50%),
            linear-gradient(135deg, rgba(255, 160, 90, 0.12), rgba(255, 200, 150, 0.04))
          `,
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          minHeight: '90px',
        }}
      >
        {/* Fixed header row */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2 flex-shrink-0">
          <div 
            className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ 
              background: 'rgba(255, 140, 60, 0.12)',
              border: '1px solid rgba(255, 140, 60, 0.2)',
            }}
          >
            <Calendar className="h-3.5 w-3.5" style={{ color: 'rgba(180, 90, 30, 0.75)' }} />
          </div>
          
          <div className="flex-1 text-left min-w-0">
            <div 
              className="text-[15px] font-extrabold"
              style={{ color: 'var(--hub-text)' }}
            >
              Your Games and Trips
            </div>
          </div>

          {/* View all affordance */}
          <div className="flex items-center gap-0.5" style={{ color: 'var(--hub-text-muted)' }}>
            <span className="text-[11px]">View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Diary entries - 2 items max */}
        <div className="px-4 pb-2 flex flex-col gap-2">
          {displayItems.length > 0 ? (
            displayItems.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2.5 py-2 px-3 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                }}
              >
                {/* Icon in circular background */}
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ 
                    background: item.type === 'game' 
                      ? 'rgba(16, 185, 129, 0.12)' 
                      : 'rgba(59, 130, 246, 0.12)',
                  }}
                >
                  {item.type === 'game' ? (
                    <MapPin 
                      className="w-3 h-3" 
                      style={{ color: '#10B981' }} 
                    />
                  ) : (
                    <Plane 
                      className="w-3 h-3" 
                      style={{ color: '#3B82F6' }} 
                    />
                  )}
                </div>
                
                {/* Primary text - bold */}
                <span 
                  className="text-[13px] font-semibold line-clamp-1 flex-1"
                  style={{ color: 'var(--hub-text)' }}
                >
                  {item.title}
                </span>
                
                {/* Subtitle - lighter and smaller */}
                <span 
                  className="text-[11px] flex-shrink-0 whitespace-nowrap"
                  style={{ color: 'var(--hub-text-muted)' }}
                >
                  {item.subtitle}
                </span>
              </div>
            ))
          ) : (
            <div 
              className="text-[12px] py-2"
              style={{ color: 'var(--hub-text-muted)' }}
            >
              Trips, matches, games – your golf diary.
            </div>
          )}
        </div>
        
        {/* Summary pill - only show if there are more items */}
        {summaryText && (
          <div className="px-4 pb-3 flex justify-center">
            <div 
              className="text-[11px] px-3 py-1 rounded-full line-clamp-1"
              style={{
                background: 'rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                color: 'var(--hub-text-muted)',
              }}
            >
              {summaryText}
            </div>
          </div>
        )}
      </button>

      <HubGamesHubSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
        initialTab="yours"
      />
    </>
  );
}
