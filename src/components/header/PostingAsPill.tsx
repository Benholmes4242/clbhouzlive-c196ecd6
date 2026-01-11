import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';

interface PostingAsPillProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnread?: boolean;
  useLightTheme?: boolean;
}

/**
 * PostingAsPill - Trigger button for the profile menu
 * Uses forwardRef to allow parent to get anchor position for desktop popover
 */
export const PostingAsPill = forwardRef<HTMLButtonElement, PostingAsPillProps>(
  ({ onClick, isOpen, hasUnread = false, useLightTheme = false }, ref) => {
    const { activeActor, isLoading } = useActiveActor();

    if (isLoading || !activeActor) {
      return (
        <div className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-sq-pill border",
          useLightTheme 
            ? "bg-white border-slate-200" 
            : "bg-white/5 border-white/10"
        )}>
          <div 
            className={cn(
              "h-7 w-7 animate-pulse",
              useLightTheme ? "bg-slate-100" : "bg-white/10"
            )} 
            style={{ borderRadius: '34%' }} 
          />
          <div className={cn(
            "h-3 w-16 rounded animate-pulse",
            useLightTheme ? "bg-slate-100" : "bg-white/10"
          )} />
        </div>
      );
    }

    const getInitials = (name: string) => name.charAt(0).toUpperCase();

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 pl-1 pr-2 h-8",
          "rounded-sq-pill border transition-colors",
          "max-w-[180px]",
          useLightTheme 
            ? "bg-white border-slate-200/80 hover:bg-slate-50 active:bg-slate-100" 
            : "bg-white/5 border-white/10 hover:bg-white/10 active:bg-white/15"
        )}
      >
        {/* Squircle Avatar with notification dot */}
        <div className="relative flex-shrink-0 flex items-center">
          <SquircleAvatar
            size={24}
            src={activeActor.avatarUrl}
            alt={activeActor.name}
            fallback={getInitials(activeActor.name)}
            hideRing
          />
          {hasUnread && (
            <span 
              className={cn(
                "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500",
                useLightTheme ? "ring-[1.5px] ring-slate-50" : "ring-[1.5px] ring-[rgb(10,10,10)]"
              )}
              aria-label="Unread notifications"
            />
          )}
        </div>
        
        {/* Name */}
        <span className={cn(
          "text-xs font-medium truncate max-w-[120px] leading-none",
          useLightTheme ? "text-slate-700" : "text-white"
        )}>
          {activeActor.name}
        </span>
        
        {/* Chevron */}
        <ChevronDown 
          className={cn(
            "h-3 w-3 flex-shrink-0 transition-transform duration-200",
            useLightTheme ? "text-slate-400" : "text-white/50",
            isOpen && "rotate-180"
          )} 
        />
      </button>
    );
  }
);

PostingAsPill.displayName = 'PostingAsPill';

export default PostingAsPill;
