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
    <div className="h-1 w-full bg-muted/30">
      <motion.div
        className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
        initial={{ width: '0%' }}
        animate={{ width: `${progressPercent}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}