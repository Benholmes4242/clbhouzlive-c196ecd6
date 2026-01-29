import React from 'react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';

interface CommentingAsIndicatorProps {
  isDark?: boolean;
  className?: string;
}

/**
 * Shows "Commenting as [Business Name]" when acting as a business profile.
 * Hidden when acting as personal profile.
 */
export function CommentingAsIndicator({ isDark = false, className }: CommentingAsIndicatorProps) {
  const { activeActor } = useActiveActor();
  
  // Only show when acting as business
  if (activeActor?.type !== 'business') {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg text-[12px]",
      isDark 
        ? "bg-white/5 text-white/70" 
        : "bg-muted text-muted-foreground",
      className
    )}>
      <SquircleAvatar
        size={18}
        src={activeActor.avatarUrl}
        alt={activeActor.name}
        fallback={activeActor.name.charAt(0).toUpperCase()}
        hideRing
      />
      <span>
        Commenting as <span className="font-medium">{activeActor.name}</span>
      </span>
    </div>
  );
}

export default CommentingAsIndicator;
