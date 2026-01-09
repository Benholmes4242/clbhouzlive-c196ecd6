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
        className="w-full h-full rounded-[22px] p-4 flex flex-col items-start justify-between transition-all active:scale-[0.98]"
        style={{
          background: 'var(--hub-glass-bg)',
          border: '1px solid var(--hub-stroke)',
          boxShadow: 'var(--hub-shadow-tile)',
          minHeight: '120px',
        }}
      >
        {/* Icon */}
        <div 
          className="h-10 w-10 rounded-full flex items-center justify-center"
          style={{ background: 'var(--hub-glass-bg-input)' }}
        >
          <Sparkles className="h-5 w-5" style={{ color: 'var(--hub-text-dim)' }} />
        </div>
        
        {/* Text content */}
        <div className="mt-auto">
          <div 
            className="text-[16px] font-extrabold leading-tight"
            style={{ color: 'var(--hub-text)' }}
          >
            Echo
          </div>
          <div 
            className="text-[12px] mt-1 leading-snug"
            style={{ color: 'var(--hub-text-muted)' }}
          >
            Ask anything — courses, gear, rules, shots
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
