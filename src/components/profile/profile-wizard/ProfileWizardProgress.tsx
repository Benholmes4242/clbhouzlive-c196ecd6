/**
 * ProfileWizardProgress - Progress bar for profile wizards
 * Premium full-width progress indicator
 */
import { motion } from 'framer-motion';
import { ProfileWizardProgressProps } from './types';

export function ProfileWizardProgress({
  currentStep,
  totalSteps,
}: ProfileWizardProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="h-1 bg-muted/50 flex-shrink-0 overflow-hidden rounded-full">
      <motion.div
        className="h-full rounded-full"
        style={{
          background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}

export default ProfileWizardProgress;
