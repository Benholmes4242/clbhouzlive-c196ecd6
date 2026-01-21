/**
 * Wizard Progress Indicator
 * Horizontal progress bar matching Post Wizard design
 */

import React from 'react';
import { motion } from 'framer-motion';

interface WizardProgressProps {
  currentStep: 1 | 2 | 3 | 4;
  totalSteps?: number;
}

export function WizardProgress({ currentStep, totalSteps = 4 }: WizardProgressProps) {
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="h-1.5 mx-4 bg-muted/50 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary rounded-full shadow-sm"
        initial={{ width: '0%' }}
        animate={{ width: `${progressPercent}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}
