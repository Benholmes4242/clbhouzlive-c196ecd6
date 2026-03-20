/**
 * EchoPageHeader - Clean static header with three zones
 */

import React from 'react';
import { ChevronLeft, Plus, Clock } from 'lucide-react';

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
        background: 'hsl(var(--background) / 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      {/* Left: Back */}
      <button
        onClick={onBack}
        className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      {/* Centre: Title when in conversation */}
      <div className="flex-1 flex items-center justify-center">
        {hasMessages && (
          <span className="text-[15px] font-semibold text-foreground">
            Echo
          </span>
        )}
      </div>

      {/* Right: History + New */}
      <div className="flex items-center">
        <button
          onClick={onHistory}
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
          aria-label="View conversation history"
        >
          <Clock className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={onNew}
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
          aria-label="Start new conversation"
        >
          <Plus className="w-[22px] h-[22px] text-foreground" />
        </button>
      </div>
    </header>
  );
}
