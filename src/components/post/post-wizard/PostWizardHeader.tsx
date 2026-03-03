// PostWizardHeader - Redesigned: X | Avatar+Audience | Clock+Post
import { Loader2, Clock, X, ChevronDown } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

export interface PostWizardHeaderProps {
  onClose: () => void;
  onPost: () => void;
  canPost: boolean;
  isSubmitting: boolean;
  isEditMode?: boolean;
  isScheduled?: boolean;
  isDirty?: boolean;
  onOpenSchedule?: () => void;
  // New: avatar + audience in header
  avatarUrl?: string;
  actorName?: string;
  visibilityLabel?: string;
  onAudienceClick?: () => void;
}

export function PostWizardHeader({
  onClose,
  onPost,
  canPost,
  isSubmitting,
  isEditMode = false,
  isScheduled = false,
  isDirty = false,
  onOpenSchedule,
  avatarUrl,
  actorName = 'You',
  visibilityLabel = 'Anyone',
  onAudienceClick,
}: PostWizardHeaderProps) {
  const buttonLabel = isSubmitting
    ? (isEditMode ? 'Saving…' : isScheduled ? 'Scheduling…' : 'Posting…')
    : (isEditMode ? 'Save' : isScheduled ? 'Schedule' : 'Post');

  return (
    <header
      className="flex items-center justify-between px-4 flex-shrink-0"
      style={{
        height: 'calc(52px + max(env(safe-area-inset-top, 0px), 47px))',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        borderBottom: '0.5px solid hsl(var(--border) / 0.3)',
      }}
    >
      {/* Left: X close button */}
      <div className="min-w-[72px] flex items-center">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-[0.90] transition-transform"
          style={{ background: 'hsl(var(--muted))' }}
          aria-label="Close"
        >
          <X className="w-[18px] h-[18px]" style={{ color: '#8E8E93' }} />
        </button>
      </div>

      {/* Center: Avatar + Audience pill */}
      <button
        onClick={onAudienceClick}
        className="flex items-center gap-2 active:opacity-70 transition-opacity min-h-[44px]"
      >
        <SquircleAvatar
          size={24}
          src={avatarUrl}
          alt={actorName}
          fallback={actorName?.[0]?.toUpperCase() || 'U'}
          hideRing
        />
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {/* Right: Clock + Post button */}
      <div className="min-w-[72px] flex items-center justify-end gap-1.5">
        {/* Schedule clock icon */}
        {isDirty && !isEditMode && onOpenSchedule && (
          <button
            onClick={onOpenSchedule}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.90] transition-transform"
            style={{
              background: isScheduled ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
            }}
            aria-label={isScheduled ? 'Change schedule' : 'Schedule post'}
          >
            <Clock
              className="w-[19px] h-[19px]"
              style={{
                color: isScheduled ? '#f59e0b' : 'hsl(var(--muted-foreground) / 0.5)',
              }}
            />
          </button>
        )}

        {/* Post / Schedule button */}
        <button
          onClick={onPost}
          disabled={!canPost || isSubmitting}
          className="text-[15px] font-semibold px-[18px] min-h-[44px] flex items-center rounded-full transition-all duration-400 active:scale-[0.96]"
          style={{
            color: canPost ? '#FFFFFF' : 'hsl(var(--muted-foreground) / 0.5)',
            background: canPost ? '#f59e0b' : 'hsl(var(--muted))',
            boxShadow: canPost ? '0 2px 12px rgba(245,158,11,0.22)' : 'none',
            pointerEvents: canPost ? 'auto' : 'none',
          }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {buttonLabel}
            </span>
          ) : buttonLabel}
        </button>
      </div>
    </header>
  );
}

export default PostWizardHeader;
