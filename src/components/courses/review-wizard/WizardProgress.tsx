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

  // Thin progress bar with amber gradient - edge-to-edge, matches Post Wizard
  return (
    <div className="h-1 w-full bg-muted/30">
      <motion.div
        className="h-full"
        style={{
          background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
        }}
        initial={{ width: '0%' }}
        animate={{ width: `${progressPercent}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}
