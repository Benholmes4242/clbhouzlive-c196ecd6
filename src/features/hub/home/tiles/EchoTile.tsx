/**
 * EchoTile V2 - Premium tile for 2-up grid
 * Matching style with ActiveGamesNearYouTile, subtle gradient behind icon
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { HubEchoSheet } from '@/features/hub/components/HubEchoSheet';
import { haptic } from '@/utils/haptics';

export function EchoTile() {
  const [echoSheetOpen, setEchoSheetOpen] = useState(false);

  const openEcho = () => {
    haptic('light');
    setEchoSheetOpen(true);
  };

  return (
    <>
      <button
        onClick={openEcho}
        className="w-full h-[140px] rounded-[18px] p-4 flex flex-col items-start transition-all duration-150 active:scale-[0.99]"
        style={{
          background: 'var(--hub-card)',
          border: '1px solid var(--hub-card-border)',
          boxShadow: 'var(--hub-shadow-tile)',
        }}
      >
        {/* V2 Icon - rounded square with subtle warm gradient */}
        <div 
          className="h-9 w-9 rounded-[10px] flex items-center justify-center mb-2"
          style={{ 
            background: 'linear-gradient(135deg, rgba(255, 142, 61, 0.12) 0%, rgba(255, 180, 100, 0.08) 100%)',
          }}
        >
          <Sparkles className="h-4 w-4" style={{ color: '#F59E0B' }} />
        </div>
        
        {/* Text content */}
        <div className="flex-1 flex flex-col">
          <div 
            className="text-[14px] font-semibold leading-tight"
            style={{ color: 'var(--hub-text)' }}
          >
            Echo
          </div>
          <div 
            className="text-[11px] mt-1.5 leading-snug line-clamp-2"
            style={{ color: 'var(--hub-text-muted)' }}
          >
            Ask Echo anything – plan trips, courses, rules, gear.
          </div>
        </div>
      </button>

      <HubEchoSheet
        isOpen={echoSheetOpen}
        onClose={() => setEchoSheetOpen(false)}
      />
    </>
  );
}
