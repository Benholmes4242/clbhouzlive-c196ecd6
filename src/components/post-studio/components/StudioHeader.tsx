// StudioHeader — Apple-minimal nav bar, consistent across every screen
// Light mode. Heavy title weight. Thicker progress bar. Clean tap targets.

import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { MIN_TAP_TARGET } from '../constants';
import { BG_GLASS, TEXT_PRIMARY } from '../tokens';
import type { StudioStep } from '../types';

interface HeaderAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
  icon?: 'close' | 'back';
}

interface StudioHeaderProps {
  title?: string;
  centerContent?: React.ReactNode;
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
  step?: StudioStep;
  darkMode?: boolean;
}

const STEP_PROGRESS: Partial<Record<StudioStep, number>> = {
  COMPOSE:  40,
  TRIM:     62,
  POSTER:   68,
  PUBLISH:  85,
  SUCCESS:  100,
};

export function StudioHeader({
  title,
  centerContent,
  leftAction,
  rightAction,
  step,
  darkMode = false,
}: StudioHeaderProps) {
  const progress = step ? STEP_PROGRESS[step] ?? 0 : 0;
  const showProgress = step && progress > 0 && step !== 'SUCCESS';

  return (
    <header
      className="flex flex-col shrink-0"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        background: BG_GLASS,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center justify-between px-4" style={{ minHeight: '52px' }}>
        {/* Left action */}
        <div className="w-20 flex justify-start">
          {leftAction ? (
            leftAction.icon === 'close' ? (
              <motion.button
                whileTap={{ scale: 0.90 }}
                onClick={leftAction.onClick}
                className="flex items-center justify-center"
                style={{ minWidth: 44, minHeight: 44, color: 'rgba(15,23,42,0.55)' }}
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </motion.button>
            ) : (
              <button
                onClick={leftAction.onClick}
                disabled={leftAction.disabled}
                className="flex items-center gap-0.5 disabled:opacity-30 transition-opacity"
                style={{ minWidth: 44, minHeight: 44, color: 'rgba(15,23,42,0.55)' }}
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={3} />
                <span className="text-[15px] font-semibold">{leftAction.label}</span>
              </button>
            )
          ) : <div />}
        </div>

        {/* Centre — title or custom content */}
        <div className="flex-1 flex items-center justify-center">
          {centerContent ?? (
            <h1
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: TEXT_PRIMARY,
                letterSpacing: '-0.03em',
              }}
            >
              {title}
            </h1>
          )}
        </div>

        {/* Right action */}
        <div className="w-20 flex justify-end">
          {rightAction && (
            rightAction.variant === 'primary' ? (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={rightAction.onClick}
                disabled={rightAction.disabled}
                className="disabled:opacity-30 transition-opacity"
                style={{
                  minHeight: '36px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  paddingLeft: 16,
                  paddingRight: 16,
                  background: rightAction.disabled
                    ? 'rgba(15,23,42,0.10)'
                    : 'rgba(15,23,42,0.90)',
                  color: '#FFFFFF',
                  boxShadow: rightAction.disabled ? 'none' : '0 2px 12px rgba(0,0,0,0.12)',
                }}
              >
                {rightAction.label}
              </motion.button>
            ) : (
              <button
                onClick={rightAction.onClick}
                disabled={rightAction.disabled}
                className="text-[15px] font-semibold disabled:opacity-30"
                style={{ minHeight: MIN_TAP_TARGET, color: 'rgba(15,23,42,0.55)' }}
              >
                {rightAction.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div style={{ height: '2.5px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <motion.div
            className="h-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'rgba(15,23,42,0.85)',
              borderRadius: '0 2px 2px 0',
              boxShadow: '0 0 6px rgba(15,23,42,0.15)',
            }}
          />
        </div>
      )}
    </header>
  );
}
