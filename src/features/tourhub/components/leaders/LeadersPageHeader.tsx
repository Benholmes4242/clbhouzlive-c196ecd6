/**
 * LeadersPageHeader - Arena-style page header with stadium glow
 * Makes the page feel like a destination, not a spreadsheet
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface LeadersPageHeaderProps {
  title?: string;
  subtitle?: string;
  updateLabel?: string;
  className?: string;
}

export const LeadersPageHeader: React.FC<LeadersPageHeaderProps> = ({
  title = 'Season Leaders',
  subtitle = "The season's best — updated as the Tour unfolds.",
  updateLabel = 'Updated weekly',
  className,
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Stadium light glow - subtle radial gradient */}
      <div className="absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative px-4 pt-6 pb-4">
        {/* Title */}
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>

        {/* Subtitle row with update label */}
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-slate-500 dark:text-muted-foreground max-w-[70%]">
            {subtitle}
          </p>

          {/* Update micro-label */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{updateLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadersPageHeader;
