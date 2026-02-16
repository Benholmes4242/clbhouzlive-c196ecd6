/**
 * Wizard Progress Indicator
 * Horizontal progress bar — amber gradient for review flow
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
  // Hide progress bar on post-submit screens
  if (currentStep === 'preview' || currentStep === 'success' || currentStep === 'share-success') {
    return null;
  }

  const progressPercent = (currentStep / totalSteps) * 100;

  // Amber gradient progress bar — intentional brand differentiation from Post Wizard's emerald
  return (
    <div className="h-2 w-full bg-amber-200/50">
      <motion.div
        className="h-full"
        style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)' }}
        initial={{ width: '0%' }}
        animate={{ width: `${progressPercent}%` }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}