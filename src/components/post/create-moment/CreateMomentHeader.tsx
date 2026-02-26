import React from 'react';
import { X, FileEdit, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ActiveActor } from '@/context/ActiveActorContext';

interface CreateMomentHeaderProps {
  selectedActor: ActiveActor | null;
  onOpenPostingOptions: () => void;
  onClose: () => void;
  draftCount: number;
  onOpenDrafts: () => void;
  scheduledCount: number;
  onOpenScheduled: () => void;
  onOpenScheduleSheet: () => void;
  canPost: boolean;
  isSubmitting: boolean;
  onPost: () => void;
  isEditMode?: boolean;
  /** Use glass styling for dark hero background */
  variant?: 'default' | 'glass';
}

/**
 * CreateMomentHeader - Header with avatar, identity selector, and actions
 * Supports two visual variants:
 * - 'default': light bg (when media is selected)
 * - 'glass': translucent glass on dark amber hero
 */
export function CreateMomentHeader({
  selectedActor,
  onOpenPostingOptions,
  onClose,
  draftCount,
  onOpenDrafts,
  scheduledCount,
  onOpenScheduled,
  onOpenScheduleSheet,
  canPost,
  isSubmitting,
  onPost,
  isEditMode = false,
  variant = 'default',
}: CreateMomentHeaderProps) {
  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  const truncateDisplayName = (name: string, maxLength = 16) => {
    if (!name) return '';
    return name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;
  };

  const isGlass = variant === 'glass';

  // ── Glass button style (shared by close + drafts/schedule circles) ──
  const glassCircle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        !isGlass && "h-14 px-4 bg-card"
      )}
      style={isGlass ? {
        padding: 'calc(env(safe-area-inset-top, 20px) + 16px) 20px 12px',
        background: 'transparent',
      } : undefined}
    >
      {/* Left: Close button */}
      {isGlass ? (
        <button
          onClick={onClose}
          style={{ ...glassCircle, color: 'rgba(255,255,255,0.7)' }}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={onClose}
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center transition-colors text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Center: Identity selector */}
      <button
        onClick={onOpenPostingOptions}
        className={cn(
          "flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-colors",
          !isGlass && "hover:bg-muted active:bg-muted/80"
        )}
      >
        {selectedActor && (
          <>
            <div
              style={isGlass ? {
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.15)',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              } : undefined}
            >
              <SquircleAvatar
                size={32}
                src={selectedActor.avatarUrl}
                alt={selectedActor.name}
                fallback={getInitials(selectedActor.name)}
                hideRing
              />
            </div>
            <span
              className={cn(
                "font-medium text-sm max-w-[140px] truncate",
                !isGlass && "text-foreground"
              )}
              style={isGlass ? { color: 'white' } : undefined}
            >
              {truncateDisplayName(selectedActor.name)}
            </span>
            {selectedActor.verified && <VerifiedBadge size="sm" />}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: isGlass ? 'rgba(255,255,255,0.4)' : undefined }}
              className={cn(!isGlass && "text-muted-foreground")}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </button>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1">
        {/* Drafts button (with badge) */}
        {draftCount > 0 && (
          isGlass ? (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenDrafts(); }}
              style={{ ...glassCircle, color: 'rgba(255,255,255,0.45)', position: 'relative' }}
              aria-label={`View ${draftCount} drafts`}
            >
              <FileEdit className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold flex items-center justify-center">
                {draftCount > 9 ? '9+' : draftCount}
              </span>
            </button>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenDrafts(); }}
              className="w-9 h-9 rounded-full flex items-center justify-center relative transition-colors hover:bg-muted"
              aria-label={`View ${draftCount} drafts`}
            >
              <FileEdit className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold flex items-center justify-center">
                {draftCount > 9 ? '9+' : draftCount}
              </span>
            </button>
          )
        )}

        {/* Scheduled posts button (with badge) */}
        {scheduledCount > 0 && (
          isGlass ? (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenScheduled(); }}
              style={{ ...glassCircle, color: 'rgba(255,255,255,0.45)', position: 'relative' }}
              aria-label={`View ${scheduledCount} scheduled posts`}
            >
              <Clock className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full text-[9px] font-semibold flex items-center justify-center"
                style={{ background: '#f59e0b', color: 'white' }}
              >
                {scheduledCount > 9 ? '9+' : scheduledCount}
              </span>
            </button>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenScheduled(); }}
              className="w-9 h-9 rounded-full flex items-center justify-center relative transition-colors hover:bg-muted"
              aria-label={`View ${scheduledCount} scheduled posts`}
            >
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                {scheduledCount > 9 ? '9+' : scheduledCount}
              </span>
            </button>
          )
        )}

        {/* Schedule button (clock icon) */}
        {scheduledCount === 0 && (
          isGlass ? (
            <button
              onClick={onOpenScheduleSheet}
              style={{ ...glassCircle, color: 'rgba(255,255,255,0.45)' }}
              aria-label="Schedule post"
            >
              <Clock className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onOpenScheduleSheet}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-muted text-muted-foreground"
              aria-label="Schedule post"
            >
              <Clock className="h-5 w-5" />
            </button>
          )
        )}

        {/* Next/Post button */}
        {isGlass ? (
          <button
            onClick={onPost}
            disabled={!canPost || isSubmitting}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: canPost && !isSubmitting ? 700 : 600,
              letterSpacing: '0.02em',
              marginLeft: 4,
              ...(canPost && !isSubmitting
                ? {
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                    border: 'none',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                  }
                : {
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    color: 'rgba(255,255,255,0.3)',
                  }),
            }}
          >
            {isSubmitting ? 'Posting...' : isEditMode ? 'Update' : 'Next'}
          </button>
        ) : (
          <button
            onClick={onPost}
            disabled={!canPost || isSubmitting}
            className={cn(
              "h-8 px-4 rounded-full font-semibold text-sm transition-all duration-200 ml-1",
              canPost && !isSubmitting
                ? "bg-muted text-foreground active:scale-[0.97]"
                : "bg-muted/50 text-muted-foreground cursor-not-allowed"
            )}
          >
            {isSubmitting ? 'Posting...' : isEditMode ? 'Update' : 'Post'}
          </button>
        )}
      </div>
    </div>
  );
}

export default CreateMomentHeader;
