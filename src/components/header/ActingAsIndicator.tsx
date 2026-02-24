import React from 'react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';

interface ActingAsIndicatorProps {
  useLightTheme?: boolean;
  className?: string;
}

/**
 * Desktop-only indicator showing "Acting as [Business Name]" when in business mode.
 * Displays in the header area on larger screens.
 */
export function ActingAsIndicator({ useLightTheme = false, className }: ActingAsIndicatorProps) {
  const { activeActor } = useActiveActor();
  
  // Only show when acting as business
  if (activeActor?.type !== 'business') {
    return null;
  }

  return (
    <div className={cn(
      "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium mr-1",
      "transition-all duration-500",
      useLightTheme
        ? "bg-slate-100/80 text-slate-600"
        : "bg-white/10 text-white/70",
      className
    )}>
      <SquircleAvatar
        size={18}
        src={activeActor.avatarUrl}
        alt={activeActor.name}
        fallback={activeActor.name.charAt(0).toUpperCase()}
        hideRing
      />
      <span className="max-w-[120px] truncate">
        Acting as {activeActor.name}
      </span>
    </div>
  );
}

export default ActingAsIndicator;