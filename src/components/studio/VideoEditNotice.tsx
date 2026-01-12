/**
 * VideoEditNotice - Informational notice for video editing in Studio
 * 
 * Shows users that video edits (filters, text, etc.) are preview-only
 * and won't be included in downloads or external shares.
 */

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VideoEditNoticeProps {
  className?: string;
  variant?: 'inline' | 'banner';
}

export function VideoEditNotice({ className, variant = 'inline' }: VideoEditNoticeProps) {
  if (variant === 'banner') {
    return (
      <div 
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-muted/50 border border-border/50',
          'text-muted-foreground text-xs',
          className
        )}
      >
        <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
        <span>
          Video edits preview only — filters and text will display in Clbhouz 
          but won't be included in downloads or external shares.
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md',
              'bg-muted/50 border border-border/50',
              'text-muted-foreground text-xs cursor-help',
              'transition-colors hover:bg-muted/70',
              className
            )}
          >
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Preview only</span>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="start"
          className="max-w-[280px]"
        >
          <p className="text-sm leading-relaxed">
            Video edits preview only — filters and text will display in Clbhouz 
            but won't be included in downloads or external shares.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default VideoEditNotice;
