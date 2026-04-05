// StudioHeader — Unified with Review Wizard design language
// Amber progress bar, rounded pill buttons, transparent header

import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { MIN_TAP_TARGET } from '../constants';
import { TEXT_PRIMARY } from '../tokens';
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

const STEP_LABELS = ['COMPOSE', 'REVIEW'] as const;
const TOTAL_STEPS = 2;

const STEP_PROGRESS: Partial<Record<StudioStep, number>> = {
  COMPOSE:  1,
  TRIM:     1,
  POSTER:   1,
  PUBLISH:  2,
  SUCCESS:  3,
};

export function StudioHeader({
  title,
  centerContent,
  leftAction,
  rightAction,
  step,
  darkMode = false,
}: StudioHeaderProps) {
  const currentStepNum = step ? STEP_PROGRESS[step] ?? 0 : 0;
  const showProgress = step && currentStepNum > 0 && step !== 'SUCCESS';

  return (
    <header
      className="flex flex-col shrink-0"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        background: 'transparent',
      }}
    >
      <div className="flex items-center justify-between px-3" style={{ minHeight: '48px' }}>
        {/* Left action — round pill like Wizard */}
        <div className="flex items-center gap-1 min-w-[72px]">
          {leftAction ? (
            leftAction.icon === 'close' ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={leftAction.onClick}
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-all duration-100"
                style={{ background: '#F5F5F7' }}
                aria-label="Close"
              >
                <X className="h-[18px] w-[18px]" style={{ color: '#8E8E93' }} />
              </motion.button>
            ) : (
              <button
                onClick={leftAction.onClick}
                disabled={leftAction.disabled}
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-all duration-100 disabled:opacity-50"
                style={{ background: '#F5F5F7' }}
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            )
          ) : <div />}
        </div>

        {/* Centre — labelled progress dots (matching Wizard) */}
        <div className="flex-1 flex items-center justify-center">
          {showProgress ? (
            <div className="flex items-center gap-4">
              {STEP_LABELS.map((label, i) => {
                const dotStep = i + 1;
                const isCompleted = currentStepNum > dotStep;
                const isActive = currentStepNum === dotStep;

                return (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div
                      className="flex items-center justify-center transition-all duration-200"
                      style={{
                        width: isActive ? 20 : 10,
                        height: 10,
                        borderRadius: 99,
                        background: isCompleted
                          ? '#F7931E'
                          : isActive
                            ? 'transparent'
                            : '#D1D5DB',
                        border: isActive ? '2px solid #F7931E' : 'none',
                      }}
                    >
                      {isCompleted && (
                        <span style={{ fontSize: 7, color: '#fff', fontWeight: 700 }}>✓</span>
                      )}
                    </div>
                    <span
                      className="text-[9px] font-semibold tracking-wider"
                      style={{
                        color: isCompleted || isActive ? '#F7931E' : '#9CA3AF',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : centerContent ? (
            centerContent
          ) : title ? (
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
          ) : null}
        </div>

        {/* Right action — amber for primary, matching Wizard */}
        <div className="flex items-center min-w-[72px] justify-end">
          {rightAction && (
            rightAction.variant === 'primary' ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={rightAction.onClick}
                disabled={rightAction.disabled}
                className="text-[13px] font-semibold px-[14px] min-h-[36px] flex items-center rounded-full transition-all duration-200 active:scale-[0.96]"
                style={{
                  background: rightAction.disabled ? '#F5F5F7' : '#1C1C1E',
                  color: rightAction.disabled ? '#AEAEB2' : '#FFFFFF',
                  pointerEvents: rightAction.disabled ? 'none' : 'auto',
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

      {/* Amber progress bar — matching Wizard */}
      {showProgress && (
        <div className="px-4 pt-1 pb-2">
          <div className="h-[3px] rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #F7931E, #FBBC2E)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStepNum / TOTAL_STEPS) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
          <div className="flex justify-between mt-1.5 px-1">
            {STEP_LABELS.map((label, i) => {
              const dotStep = i + 1;
              const isCompleted = currentStepNum > dotStep;
              const isActive = currentStepNum === dotStep;
              return (
                <span
                  key={label}
                  className="text-[9px] font-semibold tracking-wider"
                  style={{
                    color: isCompleted || isActive ? '#F7931E' : '#9CA3AF',
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
