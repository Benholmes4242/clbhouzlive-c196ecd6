/**
 * EchoPageHeader - Light dispatch header with three zones
 */

import React from 'react';
import { ChevronLeft, Plus, History } from 'lucide-react';
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
        background: '#F8FAFC',
        borderBottom: '0.5px solid rgba(15,23,42,0.07)',
      }}
    >
      {/* Left: Back */}
      <button
        onClick={onBack}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(15,23,42,0.05)',
          border: '0.5px solid rgba(15,23,42,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
        className="active:scale-[0.95] transition-transform"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" style={{ color: '#64748B' }} strokeWidth={2.5} />
      </button>

      {/* Centre: Echo title */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <AnimatedEchoWave size={22} active={true} />
        <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em' }}>
          Echo
        </span>
      </div>

      {/* Right: History + New (unified circular treatment, New gets amber tint) */}
      <div className="flex items-center gap-1">
        <button
          onClick={onHistory}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(15,23,42,0.05)',
            border: '0.5px solid rgba(15,23,42,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
          className="active:scale-[0.95] transition-transform"
          aria-label="View conversation history"
        >
          <History className="w-[18px] h-[18px]" style={{ color: '#64748B' }} strokeWidth={2} />
        </button>
        <button
          onClick={onNew}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(247,147,30,0.10)',
            border: '0.5px solid rgba(247,147,30,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
          className="active:scale-[0.95] transition-transform"
          aria-label="Start new conversation"
        >
          <Plus className="w-[18px] h-[18px]" style={{ color: '#F7931E' }} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
