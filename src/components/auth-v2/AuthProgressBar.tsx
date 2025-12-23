import React from 'react';
import { motion } from 'framer-motion';

interface AuthProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Thin progress bar for onboarding steps
 * Animates fill on step change
 */
const AuthProgressBar: React.FC<AuthProgressBarProps> = ({
  currentStep,
  totalSteps,
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
    </div>
  );
};

export default AuthProgressBar;
