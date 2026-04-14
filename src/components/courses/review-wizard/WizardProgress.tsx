/**
 * Wizard Progress Indicator
 * Slim amber bar only — labels are in the header dots
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { WizardStepExtended } from './types';

interface WizardProgressProps {
  currentStep: WizardStepExtended;
  totalSteps?: number;
}

export function WizardProgress({ currentStep, totalSteps = 3 }: WizardProgressProps) {
  if (currentStep === 'success' || currentStep === 'share-success') return null;
  const stepNumber = typeof currentStep === 'number' ? currentStep : 0;
  const progressPercent = (stepNumber / totalSteps) * 100;

  return (
    <div style={{ padding: '4px 16px 8px' }}>
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(15,23,42,0.06)', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 2, background: '#F7931E' }}
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
}
