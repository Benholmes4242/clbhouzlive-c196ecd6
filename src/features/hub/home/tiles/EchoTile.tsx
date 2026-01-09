/**
 * EchoTile - Square tile for 2-up grid
 * Opens Echo assistant
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
        className="w-full h-[140px] rounded-[22px] p-4 flex flex-col items-start transition-all active:scale-[0.98]"
        style={{
          background: 'var(--hub-glass-bg)',
          border: '1px solid var(--hub-stroke)',
          boxShadow: 'var(--hub-shadow-tile)',
        }}
      >
        {/* Icon - yellow sparkles */}
        <div 
          className="h-9 w-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--hub-glass-bg-input)' }}
        >
          <Sparkles className="h-4 w-4" style={{ color: '#FBBF24' }} />
        </div>
        
        {/* Text content - centered in remaining space */}
        <div className="flex-1 flex flex-col justify-center -mt-2">
          <div 
            className="text-[15px] font-extrabold leading-tight"
            style={{ color: 'var(--hub-text)' }}
          >
            Echo
          </div>
          <div 
            className="text-[12px] mt-1 leading-snug line-clamp-2"
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
