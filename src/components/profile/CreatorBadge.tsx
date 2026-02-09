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
 * Uses Lucide Sparkles icon for cross-platform consistency.
 */
export function CreatorBadge({ className }: CreatorBadgeProps) {
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shadow-sm',
        'bg-[#C1A84C]/10 border border-[#C1A84C]/30 text-[#C1A84C]',
        className
      )}
    >
      <Sparkles className="h-2.5 w-2.5" />
      Creator
    </span>
  );
}

export default CreatorBadge;
