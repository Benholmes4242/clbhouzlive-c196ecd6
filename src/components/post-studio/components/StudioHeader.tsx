// StudioHeader — Glass dark nav bar, consistent across every screen
// Safe-area aware, 44px tap targets, amber accent for primary actions

import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { MIN_TAP_TARGET } from '../constants';
import { BG_GLASS, AMBER, AMBER_DEEP, AMBER_GRADIENT, TEXT_PRIMARY } from '../tokens';
import type { StudioStep } from '../types';

interface HeaderAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
  icon?: 'close' | 'back';
}

interface StudioHeaderProps {
  title: string;
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
  step?: StudioStep;
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
  darkMode = true,
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
        borderBottom: '1px solid rgba(255,255,255,0.04)',
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
              style={{ minWidth: MIN_TAP_TARGET, minHeight: MIN_TAP_TARGET, color: 'rgba(255,255,255,0.65)' }}
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-sm font-medium">{leftAction.label}</span>
            </button>
          ) : <div />}
        </div>

        {/* Centre title */}
        <h1
          className="text-[15px] font-semibold flex-1 text-center"
          style={{ color: TEXT_PRIMARY, letterSpacing: '-0.02em' }}
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
                className="font-bold px-4 disabled:opacity-30 transition-opacity"
                style={{
                  minHeight: '36px',
                  borderRadius: 20,
                  fontSize: 14,
                  letterSpacing: '-0.01em',
                  background: rightAction.disabled
                    ? 'rgba(245,158,11,0.3)'
                    : AMBER_GRADIENT,
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
                style={{ minHeight: MIN_TAP_TARGET, color: 'rgba(255,255,255,0.65)' }}
              >
                {rightAction.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Amber progress bar */}
      {showProgress && (
        <div style={{ height: '1.5px', background: 'transparent' }}>
          <motion.div
            className="h-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: `linear-gradient(90deg, ${AMBER}, ${AMBER_DEEP})` }}
          />
        </div>
      )}
    </header>
  );
}
