import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingIndicatorProps {
  status?: 'pending' | 'processing' | 'complete' | 'failed' | null;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Shows a subtle "Enhancing..." badge when media is being processed
 * Used in feed posts to indicate background image/video processing
 */
export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  status,
  className,
  size = 'sm',
}) => {
  // Only show for pending/processing states
  if (!status || status === 'complete' || status === 'failed') {
    return null;
  }

  const isProcessing = status === 'processing';
  
  return (
    <div
      className={cn(
        'absolute top-2 left-2 z-10',
        'flex items-center gap-1.5',
        'bg-black/60 backdrop-blur-sm',
        'text-white/90 rounded-full',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        className
      )}
    >
      <Sparkles 
        className={cn(
          size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
          isProcessing && 'animate-pulse'
        )} 
      />
      <span className="font-medium">
        {isProcessing ? 'Enhancing...' : 'Queued'}
      </span>
    </div>
  );
};

export default ProcessingIndicator;
