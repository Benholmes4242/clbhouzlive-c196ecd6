import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatorBadgeProps {
  className?: string;
}

/**
 * Phase 3.2: Subtle Creator label pill
 * 
 * Displays a small "Creator" pill badge on creator profiles.
 * Keeps layout consistent with regular golfer profiles.
 */
export function CreatorBadge({ className }: CreatorBadgeProps) {
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
        className
      )}
      style={{ 
        background: 'rgba(247, 147, 30, 0.1)',
        color: '#F7931E',
        border: '1px solid rgba(247, 147, 30, 0.2)'
      }}
    >
      <Sparkles className="h-2.5 w-2.5" />
      Creator
    </span>
  );
}

export default CreatorBadge;
