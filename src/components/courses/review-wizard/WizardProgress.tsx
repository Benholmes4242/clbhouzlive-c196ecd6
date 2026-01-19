/**
 * Wizard Progress Indicator
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

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
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
                  "h-0.5 w-8 transition-colors duration-300",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
            <motion.div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors duration-300",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-primary text-primary-foreground",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                stepNum
              )}
            </motion.div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
