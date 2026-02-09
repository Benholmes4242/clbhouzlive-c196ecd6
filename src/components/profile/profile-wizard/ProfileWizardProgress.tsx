/**
 * ProfileWizardProgress - Progress bar for profile wizards
 * Premium full-width progress indicator using brand amber
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
        className="h-full rounded-full bg-[#C1A84C]"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}

export default ProfileWizardProgress;
