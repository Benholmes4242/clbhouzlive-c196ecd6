/**
 * Wizard Progress Indicator
 * Solid orange style matching Creator badge (#F7931E)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEP_CONFIG, type WizardStep } from './types';

interface WizardProgressProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS: WizardStep[] = ['rate', 'write', 'media', 'confirm'];

// Creator badge orange - solid, not glassy
const CREATOR_ORANGE = '#F7931E';

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div 
      className="flex items-center justify-center gap-1.5 shrink-0"
      style={{ height: 'var(--wizard-progress-height)', padding: 'var(--wizard-spacing-xs) 0' }}
    >
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        const config = STEP_CONFIG[step];
        
        return (
          <React.Fragment key={step}>
            {index > 0 && (
              <div 
                className={cn(
                  "h-0.5 w-5 transition-colors duration-300",
                  isCompleted ? "bg-[#F7931E]" : "bg-muted"
                )}
              />
            )}
            <motion.div
              className={cn(
                "relative flex items-center justify-center rounded-full font-medium transition-all duration-300",
                // 40% smaller: was h-8 w-8 (32px), now ~19px
                "h-[19px] w-[19px] text-[9px]",
                // Solid orange style for active/completed states
                (isActive || isCompleted) && "bg-[#F7931E] text-white",
                // Inactive state
                !isActive && !isCompleted && "bg-muted text-[#64748b]"
              )}
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {isCompleted ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : (
                <span>{stepNum}</span>
              )}
            </motion.div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
