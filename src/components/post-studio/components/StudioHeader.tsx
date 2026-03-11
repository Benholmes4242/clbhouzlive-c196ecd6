// StudioHeader — Consistent top bar for every screen
// Safe-area aware, min 44px tap targets, backdrop blur

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { MIN_TAP_TARGET } from '../constants';

interface HeaderAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
}

interface StudioHeaderProps {
  title: string;
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
}

export function StudioHeader({ title, leftAction, rightAction }: StudioHeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 border-b border-border/50 bg-background/95 backdrop-blur-xl shrink-0"
      style={{
        paddingTop: `max(env(safe-area-inset-top, 0px), 12px)`,
        minHeight: '56px',
      }}
    >
      {/* Left */}
      <div className="w-20 flex justify-start">
        {leftAction && (
          <button
            onClick={leftAction.onClick}
            disabled={leftAction.disabled}
            className="flex items-center gap-1 text-muted-foreground disabled:opacity-40"
            style={{ minWidth: MIN_TAP_TARGET, minHeight: MIN_TAP_TARGET }}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">{leftAction.label}</span>
          </button>
        )}
      </div>

      {/* Centre */}
      <h1 className="text-[16px] font-semibold text-foreground text-center flex-1">
        {title}
      </h1>

      {/* Right */}
      <div className="w-20 flex justify-end">
        {rightAction && (
          <button
            onClick={rightAction.onClick}
            disabled={rightAction.disabled}
            className={`text-sm font-semibold rounded-lg px-4 disabled:opacity-40 ${
              rightAction.variant === 'primary'
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
            style={{ minHeight: MIN_TAP_TARGET }}
          >
            {rightAction.label}
          </button>
        )}
      </div>
    </header>
  );
}
