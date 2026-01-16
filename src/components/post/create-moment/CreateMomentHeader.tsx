import React from 'react';
import { X, FileEdit, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ActiveActor } from '@/context/ActiveActorContext';

interface CreateMomentHeaderProps {
  /** Currently selected actor for posting */
  selectedActor: ActiveActor | null;
  /** Callback to open the posting options sheet */
  onOpenPostingOptions: () => void;
  /** Callback to close the modal */
  onClose: () => void;
  /** Number of saved drafts */
  draftCount: number;
  /** Callback to open drafts sheet */
  onOpenDrafts: () => void;
  /** Number of scheduled posts */
  scheduledCount: number;
  /** Callback to open scheduled posts */
  onOpenScheduled: () => void;
  /** Callback to open schedule picker */
  onOpenScheduleSheet: () => void;
  /** Whether posting is allowed (has content) */
  canPost: boolean;
  /** Whether currently submitting */
  isSubmitting: boolean;
  /** Callback to submit post */
  onPost: () => void;
  /** Whether in edit mode for scheduled post */
  isEditMode?: boolean;
}

/**
 * CreateMomentHeader - LinkedIn-style header with avatar, identity selector, and actions
 * Layout: [X] [Avatar + Name ▼] [📝] [🕐] [Post]
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
}: CreateMomentHeaderProps) {
  const getInitials = (name: string) => name.charAt(0).toUpperCase();
  
  const truncateDisplayName = (name: string, maxLength = 16) => {
    if (!name) return '';
    return name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;
  };

  return (
    <div 
      className="flex items-center justify-between px-4 h-14"
      style={{ 
        borderBottom: '1px solid var(--cm-border-subtle)',
        background: 'var(--cm-surface-card)',
      }}
    >
      {/* Left: Close button */}
      <button
        onClick={onClose}
        className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center transition-colors"
        style={{ background: 'transparent' }}
        aria-label="Close"
      >
        <X className="h-5 w-5" style={{ color: 'var(--cm-text-secondary)' }} />
      </button>
      
      {/* Center: Identity selector - Avatar + Name + Chevron */}
      <button 
        onClick={onOpenPostingOptions}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-colors hover:bg-[#f1f5f9] active:bg-[#e2e8f0]"
      >
        {selectedActor && (
          <>
            <SquircleAvatar
              size={32}
              src={selectedActor.avatarUrl}
              alt={selectedActor.name}
              fallback={getInitials(selectedActor.name)}
              hideRing
            />
            <span 
              className="font-medium text-sm max-w-[140px] truncate"
              style={{ color: 'var(--cm-text-primary)' }}
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
              style={{ color: 'var(--cm-text-tertiary)' }}
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
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenDrafts();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center relative transition-colors hover:bg-[#f1f5f9]"
            aria-label={`View ${draftCount} drafts`}
          >
            <FileEdit className="h-5 w-5" style={{ color: 'var(--cm-text-secondary)' }} />
            <span 
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full text-white text-[9px] font-semibold flex items-center justify-center"
              style={{ background: '#ef4444' }}
            >
              {draftCount > 9 ? '9+' : draftCount}
            </span>
          </button>
        )}
        
        {/* Scheduled posts button (with badge) */}
        {scheduledCount > 0 && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenScheduled();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center relative transition-colors hover:bg-[#f1f5f9]"
            aria-label={`View ${scheduledCount} scheduled posts`}
          >
            <Clock className="h-5 w-5" style={{ color: 'var(--cm-text-secondary)' }} />
            <span 
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full text-white text-[9px] font-semibold flex items-center justify-center"
              style={{ background: '#3b82f6' }}
            >
              {scheduledCount > 9 ? '9+' : scheduledCount}
            </span>
          </button>
        )}
        
        {/* Schedule button (clock icon) - only show if no scheduled count badge */}
        {scheduledCount === 0 && (
          <button
            onClick={onOpenScheduleSheet}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[#f1f5f9]"
            aria-label="Schedule post"
          >
            <Clock className="h-5 w-5" style={{ color: 'var(--cm-text-secondary)' }} />
          </button>
        )}
        
        {/* Post button */}
        <button
          onClick={onPost}
          disabled={!canPost || isSubmitting}
          className={cn(
            "h-8 px-4 rounded-full font-semibold text-sm transition-all duration-200 ml-1",
            canPost && !isSubmitting
              ? "active:scale-[0.97]"
              : "cursor-not-allowed"
          )}
          style={{
            background: canPost && !isSubmitting ? '#1e293b' : '#e2e8f0',
            color: canPost && !isSubmitting ? 'white' : '#94a3b8',
          }}
        >
          {isSubmitting ? 'Posting...' : isEditMode ? 'Update' : 'Post'}
        </button>
      </div>
    </div>
  );
}

export default CreateMomentHeader;
