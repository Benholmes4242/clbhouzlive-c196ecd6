import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { useMessagingContext } from '@/contexts/MessagingContext';

interface PostingAsPillProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnreadNotifications?: boolean;
  notificationCount?: number;
  useLightTheme?: boolean;
  useGlassTheme?: boolean; // Clubhouse frosted-glass treatment
  useBareTheme?: boolean; // No background, no chevron — TikTok-style floating avatar
}

/**
 * PostingAsPill - Trigger button for the profile menu
 * Uses forwardRef to allow parent to get anchor position for desktop popover
 */
export const PostingAsPill = forwardRef<HTMLButtonElement, PostingAsPillProps>(
  ({ onClick, isOpen, hasUnreadNotifications = false, notificationCount = 0, useLightTheme = false, useGlassTheme = false, useBareTheme = false }, ref) => {
    const { activeActor, isLoading } = useActiveActor();
    
    // Get unread messages count from messaging system
    const { conversations } = useMessagingContext();
    const hasUnreadMessages = conversations?.some(conv => conv.unread_count > 0) || false;

    // Bare theme — no background, no chevron, white-ringed avatar with drop shadow
    if (!isLoading && activeActor && useBareTheme) {
      const initials = activeActor.name.charAt(0).toUpperCase();
      return (
        <button
          ref={ref}
          onClick={onClick}
          aria-label="Open profile menu"
          style={{
            position: 'relative',
            width: 30,
            height: 30,
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
          }}
        >
          <SquircleAvatar
            size={30}
            src={activeActor.avatarUrl}
            alt={activeActor.name}
            fallback={initials}
            ringColor="rgba(255,255,255,0.95)"
            hairlineRing
          />

          {hasUnreadNotifications && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-[#F7931E] font-bold text-white",
                notificationCount > 9
                  ? "h-[15px] min-w-[15px] px-[3px] text-[9px]"
                  : notificationCount > 0
                  ? "h-[13px] w-[13px] text-[9px]"
                  : "h-2.5 w-2.5"
              )}
              aria-label={`${notificationCount} unread notifications`}
            >
              {notificationCount > 0 && (
                <span style={{ lineHeight: 1 }}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </span>
          )}

          {hasUnreadMessages && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-[1.5px] ring-black"
              aria-label="Unread messages"
            />
          )}
        </button>
      );
    }

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
              useLightTheme ? "bg-muted" : "bg-white/10"
            )} 
          />
          <div className={cn(
            "h-3 w-16 rounded animate-pulse",
            useLightTheme ? "bg-muted" : "bg-white/10"
          )} />
        </div>
      );
    }

    const getInitials = (name: string) => name.charAt(0).toUpperCase();

    // Get styles based on theme
    const getPillStyles = () => {
      if (useGlassTheme) {
        return {
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
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
            "flex items-center p-1.5 h-11",
            "rounded-xl transition-all duration-500",
            "max-w-[160px] min-w-0",
            "active:scale-[0.97]",
            useGlassTheme
              ? "hover:brightness-110"
              : useLightTheme 
                ? "hover:opacity-90" 
                : "bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15"
          )}
          style={getPillStyles()}
        >
        {/* Squircle Avatar with notification dot */}
        <div className="relative flex-shrink-0 flex items-center">
          <SquircleAvatar
            size={28}
            src={activeActor.avatarUrl}
            alt={activeActor.name}
            fallback={getInitials(activeActor.name)}
            hideRing
          />
          
          {/* Orange badge — social notifications (top-right) */}
          {hasUnreadNotifications && (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-[#F7931E] font-bold text-white",
                "",
                notificationCount > 9
                  ? "h-[16px] min-w-[16px] px-[3px] text-[8px]"
                  : notificationCount > 0
                  ? "h-[14px] w-[14px] text-[8px]"
                  : "h-2.5 w-2.5"
              )}
              aria-label={`${notificationCount} unread notifications`}
            >
              {notificationCount > 0 && (
                <span style={{ lineHeight: 1 }}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </span>
          )}
          
          {/* Green dot — unread messages (bottom-right) */}
          {hasUnreadMessages && (
            <span 
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500",
                useLightTheme ? "ring-[1.5px] ring-background" : "ring-[1.5px] ring-black"
              )}
              aria-label="Unread messages"
            />
          )}
        </div>
        
        {/* Chevron */}
        <ChevronDown 
          className={cn(
            "h-3 w-3 flex-shrink-0 transition-transform duration-200",
            (useLightTheme && !useGlassTheme) ? "text-muted-foreground" : "text-white/70",
            isOpen && "rotate-180"
          )} 
        />
      </button>
    );
  }
);

PostingAsPill.displayName = 'PostingAsPill';

export default PostingAsPill;