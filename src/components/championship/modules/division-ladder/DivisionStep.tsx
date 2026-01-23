import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DivisionConfig, DivisionSlug } from '@/types/championship';

interface DivisionStepProps {
  division: DivisionConfig;
  currentDivision: DivisionSlug;
  coursesPlayed: number;
  isActive: boolean;
  isUnlocked: boolean;
  isNext: boolean;
  index: number;
}

/**
 * DivisionStep - Individual step in the division ladder.
 * Shows locked, unlocked, active, or next-up state.
 */
export function DivisionStep({ 
  division, 
  currentDivision,
  coursesPlayed,
  isActive, 
  isUnlocked,
  isNext,
  index 
}: DivisionStepProps) {
  const coursesToUnlock = division.min_courses - coursesPlayed;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative flex items-center gap-3 p-3 rounded-xl transition-all',
        isActive && 'bg-primary/10 ring-2 ring-primary/30',
        isNext && 'bg-muted/50',
        !isActive && !isNext && 'bg-muted/20'
      )}
    >
      {/* Division color indicator */}
      <div 
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
          isUnlocked ? 'ring-2' : 'opacity-50'
        )}
        style={{ 
          backgroundColor: isUnlocked ? `${division.color_hex}20` : 'transparent',
          borderColor: division.color_hex,
          boxShadow: isActive ? `0 0 12px ${division.color_hex}50` : undefined
        }}
      >
        {isUnlocked ? (
          <Check 
            className="w-5 h-5" 
            style={{ color: division.color_hex }} 
          />
        ) : (
          <Lock className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Division info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className={cn(
              'font-semibold text-sm',
              isUnlocked ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {division.name}
          </span>
          {isActive && (
            <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
              Current
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {division.min_courses}+ courses
        </div>
      </div>

      {/* Progress indicator for next division */}
      {isNext && coursesToUnlock > 0 && (
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <span>{coursesToUnlock} to go</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      )}

      {/* Glow effect for next division */}
      {isNext && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              `0 0 0 0 ${division.color_hex}00`,
              `0 0 20px 4px ${division.color_hex}30`,
              `0 0 0 0 ${division.color_hex}00`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
}
