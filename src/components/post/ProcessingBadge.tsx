/**
 * ProcessingBadge - Shows "Enhancing..." indicator while image is being processed
 * 
 * Displays a subtle badge on posts that are currently being enhanced
 * with baked-in filters and text overlays.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingBadgeProps {
  status: 'pending' | 'processing' | 'complete' | 'failed' | 'skipped' | null;
  className?: string;
  showOnComplete?: boolean;
}

export function ProcessingBadge({ 
  status, 
  className,
  showOnComplete = false 
}: ProcessingBadgeProps) {
  // Only show for pending/processing states (or complete if showOnComplete)
  if (!status) return null;
  if (status === 'complete' && !showOnComplete) return null;
  if (status === 'skipped') return null;
  if (status === 'failed') return null;

  const isActive = status === 'pending' || status === 'processing';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        isActive 
          ? 'bg-primary/20 text-primary animate-pulse' 
          : 'bg-green-500/20 text-green-400',
        className
      )}
    >
      <Sparkles className={cn('w-3 h-3', isActive && 'animate-spin')} />
      <span>
        {status === 'pending' && 'Enhancing...'}
        {status === 'processing' && 'Enhancing...'}
        {status === 'complete' && 'Enhanced'}
      </span>
    </div>
  );
}

export default ProcessingBadge;
