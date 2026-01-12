/**
 * ScheduleChapterDivider - Special chapter marker for global events
 * 
 * Appears before Ryder Cup, Olympics, etc. to signal
 * "this is beyond the normal tour rhythm"
 */

import { cn } from '@/lib/utils';

interface ScheduleChapterDividerProps {
  title: string;
  subtitle: string;
  className?: string;
}

export function ScheduleChapterDivider({ 
  title, 
  subtitle,
  className 
}: ScheduleChapterDividerProps) {
  return (
    <div 
      className={cn(
        "py-8 my-4",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Left line */}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border/50" />
        
        {/* Chapter content */}
        <div className="text-center px-4">
          <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            {subtitle}
          </p>
        </div>
        
        {/* Right line */}
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border/50" />
      </div>
    </div>
  );
}

// Helper to get chapter text for global events
export function getChapterText(eventName: string): { title: string; subtitle: string } | null {
  const lower = eventName.toLowerCase();
  
  if (lower.includes('ryder cup')) {
    return {
      title: 'A Global Moment',
      subtitle: 'When the season becomes something bigger'
    };
  }
  
  if (lower.includes('olympic')) {
    return {
      title: 'Beyond the Tour',
      subtitle: 'Golf on the world stage'
    };
  }
  
  if (lower.includes('presidents cup')) {
    return {
      title: 'International Showdown',
      subtitle: 'Pride before purse'
    };
  }
  
  if (lower.includes('solheim cup')) {
    return {
      title: 'A Global Moment',
      subtitle: 'When the season becomes something bigger'
    };
  }
  
  return null;
}
