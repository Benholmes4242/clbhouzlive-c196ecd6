/**
 * Wizard Progress Indicator
 * Glassy orange style matching MapMarker design
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
    <div className="flex items-center justify-center gap-2 py-2">
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
                  isCompleted ? "bg-gradient-to-r from-[#F7931E] to-[#FFB347]" : "bg-muted"
                )}
              />
            )}
            <motion.div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                // Glassy orange style for active/completed states
                (isActive || isCompleted) && "glassy-step-circle",
                // Inactive state
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={
                (isActive || isCompleted)
                  ? {
                      background: 'linear-gradient(135deg, rgba(255, 179, 71, 0.85) 0%, rgba(247, 147, 30, 0.9) 50%, rgba(230, 126, 0, 0.95) 100%)',
                      boxShadow: '0 2px 8px rgba(247, 147, 30, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      color: 'white',
                    }
                  : undefined
              }
            >
              {/* Glass highlight */}
              {(isActive || isCompleted) && (
                <div 
                  className="absolute top-0.5 left-1 w-4 h-2 rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%)',
                  }}
                />
              )}
              
              {isCompleted ? (
                <Check className="h-4 w-4 relative z-10" strokeWidth={2.5} />
              ) : (
                <span className="relative z-10">{stepNum}</span>
              )}
            </motion.div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
