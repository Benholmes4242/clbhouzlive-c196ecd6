import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { useMessaging } from '@/hooks/useMessaging';

interface PostingAsPillProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnreadNotifications?: boolean;
  useLightTheme?: boolean;
  isDimmed?: boolean; // When true, pill becomes transparent
}

/**
 * PostingAsPill - Trigger button for the profile menu
 * Uses forwardRef to allow parent to get anchor position for desktop popover
 */
export const PostingAsPill = forwardRef<HTMLButtonElement, PostingAsPillProps>(
  ({ onClick, isOpen, hasUnreadNotifications = false, useLightTheme = false, isDimmed = false }, ref) => {
    const { activeActor, isLoading } = useActiveActor();
    
    // Get unread messages count from messaging system
    const { conversations } = useMessaging();
    const hasUnreadMessages = conversations?.some(conv => conv.unread_count > 0) || false;

    if (isLoading || !activeActor) {
      return (
        <div 
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-xl",
            useLightTheme 
              ? "" 
              : "bg-white/5 border border-white/10"
          )}
          style={useLightTheme ? {
            background: 'var(--cm-surface-alt)',
            border: '1px solid var(--cm-border)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          } : undefined}
        >
          <div 
            className={cn(
              "h-7 w-7 animate-pulse rounded-lg",
              useLightTheme ? "bg-slate-100" : "bg-white/10"
            )} 
          />
          <div className={cn(
            "h-3 w-16 rounded animate-pulse",
            useLightTheme ? "bg-slate-100" : "bg-white/10"
          )} />
        </div>
      );
    }

    const getInitials = (name: string) => name.charAt(0).toUpperCase();

    // Get styles based on theme and dim state
    const getPillStyles = () => {
      if (isDimmed) {
        // Transparent when dimmed (both light and dark themes)
        return {
          background: 'transparent',
          border: '1px solid transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        };
      }
      if (useLightTheme) {
        return {
          background: 'var(--cm-surface-alt)',
          border: '1px solid var(--cm-border)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        };
      }
      return undefined; // Dark theme uses className styles
    };

    return (
      <button
        ref={ref}
        onClick={onClick}
          className={cn(
            "flex items-center gap-1.5 pl-1 pr-2 h-8",
            "rounded-xl transition-all duration-500",
            "max-w-[180px]",
            useLightTheme 
              ? "hover:opacity-90" 
              : isDimmed
                ? "" // No bg classes when dimmed
                : "bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15"
          )}
          style={getPillStyles()}
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
          
          {/* Orange dot — social notifications (top-right) */}
          {hasUnreadNotifications && (
            <span 
              className={cn(
                "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-500",
                useLightTheme ? "ring-[1.5px] ring-slate-50" : "ring-[1.5px] ring-[rgb(10,10,10)]"
              )}
              aria-label="Unread notifications"
            />
          )}
          
          {/* Green dot — unread messages (bottom-right) */}
          {hasUnreadMessages && (
            <span 
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#2A9D5C]",
                useLightTheme ? "ring-[1.5px] ring-slate-50" : "ring-[1.5px] ring-[rgb(10,10,10)]"
              )}
              aria-label="Unread messages"
            />
          )}
        </div>
        
        {/* Name */}
        <span className={cn(
          "text-sm font-medium truncate max-w-[120px] leading-none",
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
