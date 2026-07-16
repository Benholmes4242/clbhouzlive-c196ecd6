import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { useActorUnreadCounts } from '@/hooks/useActorUnreadCounts';

interface PostingAsPillProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnreadNotifications?: boolean;
  notificationCount?: number;
  useLightTheme?: boolean;
  useGlassTheme?: boolean; // Clubhouse frosted-glass treatment
  useBareTheme?: boolean; // No background, no chevron — TikTok-style floating avatar
  compact?: boolean; // One-size-smaller for tour routes
  size?: 'sm' | 'md' | 'lg'; // Optional explicit size; 'lg' matches 38px tour pill
}

/**
 * PostingAsPill - Trigger button for the profile menu
 * Uses forwardRef to allow parent to get anchor position for desktop popover
 */
export const PostingAsPill = forwardRef<HTMLButtonElement, PostingAsPillProps>(
  ({ onClick, isOpen, hasUnreadNotifications = false, notificationCount = 0, useLightTheme = false, useGlassTheme = false, useBareTheme = false, compact = false, size }, ref) => {
    const { activeActor, isLoading } = useActiveActor();

    // Per-actor unread (badge hybrid): show a small dot on the pill when ANY
    // non-active actor has unread activity — tells the owner "another profile
    // has activity".
    const { otherUnreadTotal, countFor } = useActorUnreadCounts();

    // Combined unread count for the active actor (notifications + DMs).
    const activeUnread = activeActor
      ? countFor(activeActor.type as 'personal' | 'business', activeActor.id)
      : 0;

    // Split badge semantics: YOUR unread renders as a number; when only OTHER
    // accounts have unread, render a bare dot (no number) so a foreign count
    // is never mistaken for your own.
    const activeUnreadCount = activeUnread;
    const showOtherDot = activeUnread === 0 && otherUnreadTotal > 0;


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
          <span
            style={{
              display: 'inline-flex',
              borderRadius: '34%',
            }}
          >
            <SquircleAvatar
              size={30}
              src={activeActor.avatarUrl}
              alt={activeActor.name}
              fallback={initials}
              hairlineRing
            />


          </span>

          {activeUnreadCount > 0 ? (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-[#F7931E] font-bold",
                activeUnreadCount > 9
                  ? "h-[18px] min-w-[18px] px-[4px] text-[10px]"
                  : "h-[18px] w-[18px] text-[10px]"
              )}
              style={{
                color: 'rgba(255,255,255,0.95)',
                boxShadow: '0 0 0 0.5px rgba(255,255,255,0.95)',
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'center',
                lineHeight: '18px',
              }}
              aria-label={`${activeUnreadCount} unread`}
            >
              {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
            </span>
          ) : showOtherDot ? (
            <span
              aria-label="Unread on another account"
              className="absolute -top-1 -right-1 rounded-full bg-[#F7931E]"
              style={{
                width: 8,
                height: 8,
                boxShadow: '0 0 0 0.5px rgba(255,255,255,0.95)',
              }}
            />
          ) : null}
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
            "flex items-center",
            size === 'lg'
              ? "p-[5px] h-[38px]"
              : compact ? "p-1 h-9" : "p-1.5 h-11",
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
          <span
            style={{
              display: 'inline-flex',
              borderRadius: '34%',
            }}
          >
            <SquircleAvatar
              size={size === 'lg' ? 28 : compact ? 26 : 28}
              src={activeActor.avatarUrl}
              alt={activeActor.name}
              userId={activeActor.id}
              hairlineRing
            />


          </span>
          
          {/* Your unread = number; other-account unread = bare dot */}
          {activeUnreadCount > 0 ? (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-[#F7931E] font-bold text-white",
                activeUnreadCount > 9
                  ? "h-[16px] min-w-[16px] px-[3px] text-[8px]"
                  : "h-[14px] w-[14px] text-[8px]"
              )}
              style={{
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'center',
                lineHeight: activeUnreadCount > 9 ? '16px' : '14px',
              }}
              aria-label={`${activeUnreadCount} unread`}
            >
              {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
            </span>
          ) : showOtherDot ? (
            <span
              aria-label="Unread on another account"
              className="absolute -top-1 -right-1 rounded-full bg-[#F7931E]"
              style={{ width: 8, height: 8 }}
            />
          ) : null}
        </div>


        
        
        {/* Chevron */}
        <ChevronDown 
          className={cn(
            "flex-shrink-0 transition-transform duration-200",
            compact ? "h-2.5 w-2.5" : "h-3 w-3",
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