// StudioHeader — Consistent top bar for every screen
// Safe-area aware, min 44px tap targets, backdrop blur, step progress

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { MIN_TAP_TARGET } from '../constants';
import type { StudioStep } from '../types';

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
  /** Current step for progress indicator */
  step?: StudioStep;
  /** Whether header is on a dark immersive screen */
  darkMode?: boolean;
}

const STEP_PROGRESS: Partial<Record<StudioStep, number>> = {
  MEDIA_PICKER: 25,
  COMPOSER: 50,
  TRIM: 60,
  POSTER: 65,
  PUBLISH: 85,
  SUCCESS: 100,
};

export function StudioHeader({ title, leftAction, rightAction, step, darkMode }: StudioHeaderProps) {
  const progress = step ? STEP_PROGRESS[step] ?? 0 : 0;
  const showProgress = step && progress > 0 && step !== 'SUCCESS';

  const textColor = darkMode ? 'text-white' : 'text-foreground';
  const mutedColor = darkMode ? 'text-white/70' : 'text-muted-foreground';
  const bgClass = darkMode
    ? 'bg-[#0A0A0A]/95 backdrop-blur-xl'
    : 'bg-background/95 backdrop-blur-xl';
  const borderClass = darkMode ? 'border-white/10' : 'border-border/50';

  return (
    <header
      className={`flex flex-col shrink-0 ${bgClass}`}
      style={{
        paddingTop: `max(env(safe-area-inset-top, 0px), 47px)`,
      }}
    >
      <div className={`flex items-center justify-between px-4 border-b ${borderClass}`} style={{ minHeight: '56px' }}>
        {/* Left */}
        <div className="w-20 flex justify-start">
          {leftAction && (
            <button
              onClick={leftAction.onClick}
              disabled={leftAction.disabled}
              className={`flex items-center gap-1 ${mutedColor} disabled:opacity-40`}
              style={{ minWidth: MIN_TAP_TARGET, minHeight: MIN_TAP_TARGET }}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">{leftAction.label}</span>
            </button>
          )}
        </div>

        {/* Centre */}
        <h1 className={`text-[16px] font-semibold ${textColor} text-center flex-1`}>
          {title}
        </h1>

        {/* Right */}
        <div className="w-20 flex justify-end">
          {rightAction && (
            rightAction.variant === 'primary' ? (
              <button
                onClick={rightAction.onClick}
                disabled={rightAction.disabled}
                className="bg-primary text-primary-foreground text-sm font-semibold px-4 rounded-full min-h-[36px] disabled:opacity-40"
              >
                {rightAction.label}
              </button>
            ) : (
              <button
                onClick={rightAction.onClick}
                disabled={rightAction.disabled}
                className={`text-sm font-semibold rounded-lg px-4 disabled:opacity-40 ${mutedColor}`}
                style={{ minHeight: MIN_TAP_TARGET }}
              >
                {rightAction.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Step progress bar */}
      {showProgress && (
        <div className="h-[2px] bg-border/40">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </header>
  );
}
