// StudioHeader — Apple-minimal nav bar, consistent across every screen
// Heavy title weight. Thicker progress bar. Clean tap targets.

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
        {/* Left action */}
        <div className="w-20 flex justify-start">
          {leftAction ? (
            leftAction.icon === 'close' ? (
              <motion.button
                whileTap={{ scale: 0.90 }}
                onClick={leftAction.onClick}
                className="flex items-center justify-center"
                style={{ minWidth: 44, minHeight: 44, color: 'rgba(255,255,255,0.70)' }}
              >
                {/* Thicker X — strokeWidth 2.5 */}
                <X className="w-5 h-5" strokeWidth={2.5} />
              </motion.button>
            ) : (
              <button
                onClick={leftAction.onClick}
                disabled={leftAction.disabled}
                className="flex items-center gap-0.5 disabled:opacity-30 transition-opacity"
                style={{ minWidth: 44, minHeight: 44, color: 'rgba(255,255,255,0.70)' }}
              >
                {/* Thicker chevron — strokeWidth 3 */}
                <ChevronLeft className="w-5 h-5" strokeWidth={3} />
                <span className="text-[15px] font-semibold">{leftAction.label}</span>
              </button>
            )
          ) : <div />}
        </div>

        {/* Centre title — heavier weight, tighter tracking */}
        <h1
          className="flex-1 text-center"
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            letterSpacing: '-0.03em',
          }}
        >
          {title}
        </h1>

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
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(255,255,255,0.96)',
                  color: '#0D0D0D',
                  boxShadow: rightAction.disabled ? 'none' : '0 2px 12px rgba(0,0,0,0.30)',
                }}
              >
                {rightAction.label}
              </motion.button>
            ) : (
              <button
                onClick={rightAction.onClick}
                disabled={rightAction.disabled}
                className="text-[15px] font-semibold disabled:opacity-30"
                style={{ minHeight: MIN_TAP_TARGET, color: 'rgba(255,255,255,0.70)' }}
              >
                {rightAction.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'rgba(255,255,255,0.90)',
              borderRadius: '0 2px 2px 0',
            }}
          />
        </div>
      )}
    </header>
  );
}
