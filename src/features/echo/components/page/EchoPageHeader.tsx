/**
 * EchoPageHeader - Clean static header with three zones (dark theme)
 */

import React from 'react';
import { ChevronLeft, Plus, Clock } from 'lucide-react';
import { AnimatedEchoWave } from '@/features/echo/components/ui/AnimatedEchoWave';

interface EchoPageHeaderProps {
  onBack: () => void;
  onNew: () => void;
  onHistory: () => void;
  hasMessages: boolean;
}

export function EchoPageHeader({ onBack, onNew, onHistory, hasMessages }: EchoPageHeaderProps) {
  return (
    <header 
      className="flex-none h-[52px] px-2 flex items-center justify-between"
      style={{
        background: '#0c0c0e',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Left: Back */}
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
        style={{ background: 'rgba(255,255,255,0.07)' }}
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={2.5} />
      </button>

      {/* Centre: Title always visible */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <AnimatedEchoWave size={16} active={true} />
        <span className="text-[17px] font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
          Echo
        </span>
      </div>

      {/* Right: History + New */}
      <div className="flex items-center">
        <button
          onClick={onHistory}
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
          aria-label="View conversation history"
        >
          <Clock className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.45)' }} />
        </button>
        <button
          onClick={onNew}
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
          aria-label="Start new conversation"
        >
          <Plus className="w-[22px] h-[22px]" style={{ color: 'rgba(255,255,255,0.45)' }} />
        </button>
      </div>
    </header>
  );
}