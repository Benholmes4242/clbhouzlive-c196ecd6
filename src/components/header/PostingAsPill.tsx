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
    const { countFor } = useActorUnreadCounts();

    // Combined unread count for the active actor (notifications + DMs).
    const activeUnread = activeActor
      ? countFor(activeActor.type as 'personal' | 'business', activeActor.id)
      : 0;

    const activeUnreadCount = activeUnread;


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
                "absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-[#F7931E] font-bold",
                activeUnreadCount > 9
                  ? "h-[18px] min-w-[18px] px-[4px] text-[10px]"
                  : "h-[18px] w-[18px] text-[10px]"
              )}
              style={{
                color: 'rgba(255,255,255,0.95)',
                boxShadow: '0 0 0 2px #FFFFFF',
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'center',
                lineHeight: '18px',
              }}
              aria-label={`${activeUnreadCount} unread`}
            >
              {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
            </span>
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
          <Skeleton
            variant={useLightTheme ? 'light' : 'dark'}
            className="h-7 w-7 rounded-lg"
          />
          <Skeleton
            variant={useLightTheme ? 'light' : 'dark'}
            className="h-3 w-16 rounded"
          />
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
                "absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-[#F7931E] font-bold text-white",
                activeUnreadCount > 9
                  ? "h-[18px] min-w-[18px] px-[4px] text-[10px]"
                  : "h-[18px] w-[18px] text-[10px]"
              )}
              style={{
                boxShadow: '0 0 0 2px #FFFFFF',
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'center',
                lineHeight: '18px',
              }}
              aria-label={`${activeUnreadCount} unread`}
            >
              {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
            </span>
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