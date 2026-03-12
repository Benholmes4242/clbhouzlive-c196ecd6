// StudioHeader — Glass dark nav bar, consistent across every screen
// Safe-area aware, 44px tap targets, amber accent for primary actions

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
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
  step?: StudioStep;
  /** Force dark glass even on light screens */
  darkMode?: boolean;
}

const STEP_PROGRESS: Partial<Record<StudioStep, number>> = {
  MEDIA_PICKER: 20,
  COMPOSER:     50,
  TRIM:         62,
  POSTER:       68,
  PUBLISH:      85,
  SUCCESS:      100,
};

export function StudioHeader({
  title,
  leftAction,
  rightAction,
  step,
  darkMode = true, // Studio is always dark
}: StudioHeaderProps) {
  const progress = step ? STEP_PROGRESS[step] ?? 0 : 0;
  const showProgress = step && progress > 0 && step !== 'SUCCESS';

  return (
    <header
      className="flex flex-col shrink-0"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        background: 'rgba(13,13,13,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between px-4" style={{ minHeight: '52px' }}>
        {/* Left */}
        <div className="w-20 flex justify-start">
          {leftAction ? (
            <button
              onClick={leftAction.onClick}
              disabled={leftAction.disabled}
              className="flex items-center gap-0.5 disabled:opacity-30 transition-opacity"
              style={{ minWidth: MIN_TAP_TARGET, minHeight: MIN_TAP_TARGET, color: 'rgba(255,255,255,0.55)' }}
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-sm font-medium">{leftAction.label}</span>
            </button>
          ) : <div />}
        </div>

        {/* Centre title */}
        <h1
          className="text-[15px] font-semibold tracking-tight flex-1 text-center"
          style={{ color: 'rgba(255,255,255,0.90)' }}
        >
          {title}
        </h1>

        {/* Right */}
        <div className="w-20 flex justify-end">
          {rightAction && (
            rightAction.variant === 'primary' ? (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={rightAction.onClick}
                disabled={rightAction.disabled}
                className="text-sm font-bold px-4 rounded-full disabled:opacity-30 transition-opacity"
                style={{
                  minHeight: '34px',
                  background: rightAction.disabled
                    ? 'rgba(245,158,11,0.3)'
                    : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#0D0D0D',
                  boxShadow: rightAction.disabled ? 'none' : '0 2px 12px rgba(245,158,11,0.40)',
                }}
              >
                {rightAction.label}
              </motion.button>
            ) : (
              <button
                onClick={rightAction.onClick}
                disabled={rightAction.disabled}
                className="text-sm font-medium disabled:opacity-30"
                style={{ minHeight: MIN_TAP_TARGET, color: 'rgba(255,255,255,0.55)' }}
              >
                {rightAction.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Amber progress bar */}
      {showProgress && (
        <div className="h-[2px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
          />
        </div>
      )}
    </header>
  );
}
