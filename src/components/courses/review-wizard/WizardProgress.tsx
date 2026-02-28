/**
 * Wizard Progress Indicator
 * Amber gradient bar with spring animation
 * Hidden on post-submit screens (preview, success, share-success)
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { WizardStepExtended } from './types';

interface WizardProgressProps {
  currentStep: WizardStepExtended;
  totalSteps?: number;
}

export function WizardProgress({ currentStep, totalSteps = 4 }: WizardProgressProps) {
  if (currentStep === 'preview' || currentStep === 'success' || currentStep === 'share-success') {
    return null;
  }

  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="h-1 mx-4 rounded-full overflow-hidden bg-muted">
      <motion.div
        className="h-full rounded-full"
        style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
        initial={{ width: '0%' }}
        animate={{ width: `${progressPercent}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </div>
  );
}
