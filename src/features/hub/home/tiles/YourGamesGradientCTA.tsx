/**
 * YourGamesGradientCTA V2 - Premium "Your Games and Trips" diary card
 * V2 itinerary list style, View all pill button, dashed footer
 */

import React, { useState } from 'react';
import { Calendar, MapPin, Plane, ChevronRight, Plus } from 'lucide-react';
import { HubGamesTripsSheet } from '@/features/hub/components/HubGamesTripsSheet';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';
import { haptic } from '@/utils/haptics';
import { HUB_DEMO_MODE, MOCK_DIARY_ITEMS } from '../hubDemoConfig';

interface YourGamesGradientCTAProps {
  className?: string;
}

export function YourGamesGradientCTA({ className }: YourGamesGradientCTAProps) {
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const openYourGames = () => {
    haptic('light');
    setGamesHubOpen(true);
  };

  const allItems = HUB_DEMO_MODE ? MOCK_DIARY_ITEMS : [];
  
  const games = allItems.filter(item => item.type === 'game');
  const trips = allItems.filter(item => item.type === 'trip');
  
  const displayItems: typeof allItems = [];
  if (games.length > 0 && trips.length > 0) {
    displayItems.push(games[0], trips[0]);
  } else if (games.length >= 2) {
    displayItems.push(games[0], games[1]);
  } else if (trips.length >= 2) {
    displayItems.push(trips[0], trips[1]);
  } else {
    displayItems.push(...games.slice(0, 1), ...trips.slice(0, 1));
  }
  
  const shownGames = displayItems.filter(i => i.type === 'game').length;
  const shownTrips = displayItems.filter(i => i.type === 'trip').length;
  const moreGames = games.length - shownGames;
  const moreTrips = trips.length - shownTrips;
  
  let summaryText = '';
  if (moreGames > 0 && moreTrips > 0) {
    summaryText = `+${moreGames} game${moreGames > 1 ? 's' : ''} and ${moreTrips} trip${moreTrips > 1 ? 's' : ''} to come`;
  } else if (moreGames > 0) {
    summaryText = `+${moreGames} more game${moreGames > 1 ? 's' : ''} to come`;
  } else if (moreTrips > 0) {
    summaryText = `+${moreTrips} more trip${moreTrips > 1 ? 's' : ''} to come`;
  }

  const hasItems = displayItems.length > 0;

  return (
    <>
      <button
        onClick={openYourGames}
        className={`w-full rounded-[18px] overflow-hidden relative flex flex-col transition-all duration-150 active:scale-[0.99] ${className || ''}`}
        style={{
          background: 'var(--hub-card)',
          border: '1px solid var(--hub-card-border)',
          boxShadow: 'var(--hub-shadow-tile)',
          minHeight: '90px',
        }}
      >
        {/* Subtle warm gradient overlay at top */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(600px 150px at 10% 0%, rgba(255, 140, 60, 0.06), transparent 50%)',
          }}
        />

        {/* Header row - stronger hierarchy */}
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-2 flex-shrink-0 relative z-10">
          {/* V2 Icon - rounded square */}
          <div 
            className="h-8 w-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 140, 60, 0.12) 0%, rgba(255, 160, 90, 0.08) 100%)',
            }}
          >
            <Calendar className="h-3.5 w-3.5" style={{ color: '#D97706' }} />
          </div>
          
          <div className="flex-1 text-left min-w-0">
            <div 
              className="font-semibold leading-tight"
              style={{ 
                color: 'var(--hub-text)',
                fontSize: 'clamp(13px, 3.5vw, 15px)', // Responsive: 13px min, 15px max
              }}
            >
              Your Games and Trips
            </div>
          </div>

          {/* V2 View all pill button - slightly smaller */}
          <div 
            className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ 
              background: 'var(--hub-surface)',
              border: '1px solid var(--hub-stroke)',
              color: 'var(--hub-text-dim)',
            }}
          >
            View all
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Diary entries - with pressable row styling */}
        <div className="px-4 pb-2 flex flex-col gap-1.5 relative z-10">
          {hasItems ? (
            displayItems.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2.5 py-2 px-3 rounded-[12px] transition-all duration-150 active:scale-[0.99] active:translate-y-[-1px] active:shadow-[0_10px_24px_rgba(2,6,23,0.08)]"
                style={{
                  background: 'rgba(255, 255, 255, 0.92)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 2px 8px rgba(2,6,23,0.03)',
                }}
              >
                {/* V2 Icon badge */}
                <div 
                  className="w-6 h-6 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{ 
                    background: item.type === 'game' 
                      ? 'var(--hub-badge-green-bg)' 
                      : 'rgba(59, 130, 246, 0.12)',
                  }}
                >
                  {item.type === 'game' ? (
                    <MapPin 
                      className="w-3 h-3" 
                      style={{ color: 'var(--hub-badge-green-text)' }} 
                    />
                  ) : (
                    <Plane 
                      className="w-3 h-3" 
                      style={{ color: '#3B82F6' }} 
                    />
                  )}
                </div>
                
                <span 
                  className="text-[13px] font-medium line-clamp-1 flex-1"
                  style={{ color: 'var(--hub-text)' }}
                >
                  {item.title}
                </span>
                
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
        
        {/* V2 Summary - lighter + tighter dashed pill */}
        {summaryText ? (
          <div className="px-4 pb-3 flex justify-center relative z-10">
            <div 
              className="text-[12px] px-2.5 py-1 rounded-full line-clamp-1"
              style={{
                background: 'transparent',
                border: '1px dashed rgba(15, 23, 42, 0.10)',
                color: 'var(--hub-text-dim)',
              }}
            >
              {summaryText}
            </div>
          </div>
        ) : !hasItems && (
          <div className="px-4 pb-3 flex justify-center relative z-10">
            <div 
              className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full"
              style={{
                background: 'transparent',
                border: '1px dashed rgba(15, 23, 42, 0.10)',
                color: 'var(--hub-text-dim)',
              }}
            >
              <Plus className="w-3 h-3" />
              Add a game or trip
            </div>
          </div>
        )}
      </button>

      <HubGamesTripsSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
        onOpenCreate={() => setCreateOpen(true)}
      />

      <CreateGameTripSheetV2
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
