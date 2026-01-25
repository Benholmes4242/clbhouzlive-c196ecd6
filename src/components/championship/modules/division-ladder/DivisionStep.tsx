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

// Helper to create light tint from hex color
const getColorTint = (hexColor: string, opacity: number = 0.12): string => {
  return `${hexColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

/**
 * DivisionStep - Individual step in the division ladder.
 * Shows completed, current, next, or locked state with milestone colors.
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
  const isCompleted = isUnlocked && !isActive;
  
  // Determine status for styling
  const status = isActive ? 'current' : isCompleted ? 'completed' : isNext ? 'next' : 'locked';
  
  // Get styles based on status
  const getRowStyles = () => {
    const color = division.color_hex;
    switch (status) {
      case 'completed':
        return {
          background: getColorTint(color, 0.12),
          iconBg: getColorTint(color, 0.20),
          iconColor: color,
          textColor: color,
        };
      case 'current':
        return {
          background: getColorTint(color, 0.18),
          borderColor: getColorTint(color, 0.25),
          iconBg: getColorTint(color, 0.25),
          iconColor: color,
          textColor: color,
        };
      case 'next':
        return {
          background: 'rgba(251, 146, 60, 0.12)',
          iconBg: 'rgba(251, 146, 60, 0.20)',
          iconColor: '#F97316',
          textColor: undefined,
          accentColor: '#F97316',
        };
      case 'locked':
      default:
        return {
          background: 'transparent',
          iconBg: undefined,
          iconColor: '#9CA3AF',
          textColor: '#9CA3AF',
        };
    }
  };
  
  const styles = getRowStyles();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative flex items-center gap-3 p-3 rounded-xl transition-all',
        status === 'current' && 'border',
        status === 'locked' && 'bg-muted/20'
      )}
      style={{
        backgroundColor: status !== 'locked' ? styles.background : undefined,
        borderColor: status === 'current' ? styles.borderColor : undefined,
      }}
    >
      {/* Icon circle */}
      <div 
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
          status === 'locked' && 'bg-gray-100'
        )}
        style={{ 
          backgroundColor: status !== 'locked' ? styles.iconBg : undefined,
        }}
      >
        {status === 'completed' || status === 'current' ? (
          <Check 
            className="w-5 h-5" 
            style={{ color: styles.iconColor }} 
          />
        ) : status === 'next' ? (
          <ChevronRight 
            className="w-5 h-5" 
            style={{ color: styles.iconColor }} 
          />
        ) : (
          <Lock className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Division info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Color dot */}
          <div 
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: division.color_hex }}
          />
          
          {/* Division name */}
          <span 
            className={cn(
              'font-semibold text-sm',
              status === 'locked' && 'text-gray-400'
            )}
            style={{ 
              color: status !== 'locked' ? styles.textColor : undefined 
            }}
          >
            {division.name}
          </span>
          
          {/* Current badge */}
          {status === 'current' && (
            <span 
              className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: getColorTint(division.color_hex, 0.25),
                color: division.color_hex,
              }}
            >
              Current
            </span>
          )}
        </div>
        
        {/* Threshold */}
        <span className={cn(
          'text-xs',
          status === 'locked' ? 'text-gray-400' : 'text-muted-foreground'
        )}>
          {division.min_courses}+ courses
        </span>
      </div>

      {/* "X to go" for next division */}
      {status === 'next' && coursesToUnlock > 0 && (
        <span className="text-sm font-semibold text-orange-500">
          {coursesToUnlock} to go
        </span>
      )}

      {/* Glow effect for next division */}
      {status === 'next' && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(249, 115, 22, 0)',
              '0 0 20px 4px rgba(249, 115, 22, 0.2)',
              '0 0 0 0 rgba(249, 115, 22, 0)',
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
