import React from 'react';
import { cn } from '@/lib/utils';
import { type ScoreTierData } from '@/utils/getScoreTier';

export type RatingBand =
  | 'outstanding'
  | 'excellent'
  | 'veryGood'
  | 'good'
  | 'fair';

interface RatingBadgeProps {
  /** Tier data from getScoreTier() */
  tierData: ScoreTierData;
  /** Optional override label */
  label?: string;
  /** Extra classes */
  className?: string;
}

/**
 * Reusable rating badge component that uses tier data from getScoreTier()
 * for consistent badge styling across the app.
 * 
 * Updated to use Apple-style glass/frosted effect matching AchievementBadgeCard,
 * with subtle tier-colored accent instead of opaque gradient background.
 */
export function RatingBadge({ tierData, label, className }: RatingBadgeProps) {
  // Use the tier's accent color for the subtle tint
  const accentColor = tierData.accent || tierData.bgDark;
  
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center relative overflow-hidden',
        'rounded-sq-sm px-3 py-[6px] text-xs font-semibold uppercase tracking-[0.08em]',
        'transition-all duration-200',
        className
      )}
      style={{
        // Glass base with tier-colored tint for more visible color
        background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}08 100%)`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: 'var(--foreground)',
        boxShadow: `0 1px 6px ${accentColor}15, 0 1px 2px rgba(0, 0, 0, 0.04)`,
      }}
    >
      {/* Top edge inner highlight sheen - tier colored for visibility */}
      <span 
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentColor}40 30%, ${accentColor}50 50%, ${accentColor}40 70%, transparent 100%)`,
          opacity: 0.8,
        }}
      />
      
      {/* Left accent glow - stronger tier color */}
      <span 
        className="absolute bottom-0 left-0 w-10 h-full pointer-events-none"
        style={{
          background: `linear-gradient(90deg, ${accentColor}35 0%, transparent 100%)`,
          borderRadius: 'inherit',
        }}
      />
      
      {/* Badge text */}
      <span className="relative z-10">{label ?? tierData.label}</span>
    </span>
  );
}
