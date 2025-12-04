import React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CompletionStamp } from '@/lib/top100Helpers';

interface ProfileCompletionStampsProps {
  stamps: CompletionStamp[];
  className?: string;
}

/**
 * ProfileCompletionStamps - Displays region completion stamps as small badges
 * Only shown when user has completed at least one Top 100 region list
 */
const ProfileCompletionStamps: React.FC<ProfileCompletionStampsProps> = ({
  stamps,
  className,
}) => {
  if (!stamps || stamps.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1.5', className)}>
        {stamps.map((stamp) => (
          <Tooltip key={stamp.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'inline-flex items-center justify-center',
                  'px-2 py-0.5 rounded-full',
                  'text-[10px] font-medium tracking-wide uppercase',
                  'bg-amber-500/20 text-amber-200 border border-amber-500/30',
                  'hover:bg-amber-500/30 transition-colors duration-150',
                  'cursor-default select-none'
                )}
              >
                <span className="mr-1">{stamp.emoji}</span>
                <span className="hidden sm:inline">{stamp.label.split(' ')[0]}</span>
                <span className="sm:hidden">✓</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-sm">
              <span className="font-medium">{stamp.label}</span> Top 100 completed 🏆
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default ProfileCompletionStamps;
