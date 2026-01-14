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
        className="w-full h-[148px] rounded-[20px] p-4 flex flex-col items-start transition-all duration-150 active:scale-[0.98] relative overflow-hidden"
        style={{
          background: 'var(--hub-card)',
          border: '1px solid var(--hub-card-border)',
          boxShadow: '0 6px 18px rgba(2, 6, 23, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Subtle warm gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(400px 100px at 20% 0%, rgba(255, 142, 61, 0.08), transparent 60%)',
          }}
        />
        
        {/* V3 Icon - rounded square with warmer gradient and subtle sparkle effect */}
        <div 
          className="h-10 w-10 rounded-[12px] flex items-center justify-center mb-2.5 relative z-10"
          style={{ 
            background: 'linear-gradient(135deg, rgba(255, 142, 61, 0.18) 0%, rgba(255, 142, 61, 0.08) 100%)',
            border: '1px solid rgba(255, 142, 61, 0.12)',
          }}
        >
          <Sparkles className="h-[18px] w-[18px]" style={{ color: '#F59E0B' }} />
        </div>
        
        {/* Text content - improved hierarchy */}
        <div className="flex-1 flex flex-col relative z-10">
          <div 
            className="text-[16px] font-bold leading-tight"
            style={{ color: 'var(--hub-text)', letterSpacing: '-0.2px' }}
          >
            Echo
          </div>
          <div 
            className="text-[11.5px] mt-2 leading-snug line-clamp-2"
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
