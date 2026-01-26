/**
 * Wizard Progress Indicator
 * Horizontal progress bar matching Post Wizard design
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

  // Thin neutral progress bar - 2px height
  return (
    <div className="h-0.5 bg-muted/40 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-foreground/60 rounded-full"
        initial={{ width: '0%' }}
        animate={{ width: `${progressPercent}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}
