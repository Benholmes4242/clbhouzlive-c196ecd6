/**
 * Wizard Progress Indicator
 * 3px amber gradient bar with step labels
 * Hidden on post-submit screens (success, share-success)
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { WizardStepExtended } from './types';

const STEP_LABELS = ['RATE', 'WRITE', 'POST'] as const;

interface WizardProgressProps {
  currentStep: WizardStepExtended;
  totalSteps?: number;
}

export function WizardProgress({ currentStep, totalSteps = 3 }: WizardProgressProps) {
  if (currentStep === 'success' || currentStep === 'share-success') {
    return null;
  }

  const stepNumber = typeof currentStep === 'number' ? currentStep : 0;
  const progressPercent = (stepNumber / totalSteps) * 100;

  return (
    <div className="px-4 pt-1 pb-2">
      {/* Progress bar */}
      <div className="h-[3px] rounded-full overflow-hidden bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Step labels row */}
      <div className="flex justify-between mt-1.5 px-1">
        {STEP_LABELS.map((label, i) => {
          const dotStep = i + 1;
          const isCompleted = stepNumber > dotStep;
          const isActive = stepNumber === dotStep;

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
  );
}
