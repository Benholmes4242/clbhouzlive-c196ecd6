// PostWizardHeader - Minimal composer header: Cancel | Title | Post
import { Loader2 } from 'lucide-react';

export interface PostWizardHeaderProps {
  onClose: () => void;
  onPost: () => void;
  canPost: boolean;
  isSubmitting: boolean;
  isEditMode?: boolean;
  isScheduled?: boolean;
}

export function PostWizardHeader({
  onClose,
  onPost,
  canPost,
  isSubmitting,
  isEditMode = false,
  isScheduled = false,
}: PostWizardHeaderProps) {
  const buttonLabel = isSubmitting
    ? (isEditMode ? 'Saving…' : isScheduled ? 'Scheduling…' : 'Posting…')
    : (isEditMode ? 'Save' : isScheduled ? 'Schedule' : 'Post');

  return (
    <header
      className="flex items-center justify-between px-5 flex-shrink-0"
      style={{
        height: 'calc(52px + max(env(safe-area-inset-top, 0px), 47px))',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        borderBottom: '0.5px solid rgba(0,0,0,0.07)',
      }}
    >
      {/* Cancel */}
      <button
        onClick={onClose}
        className="text-[17px] font-normal min-w-[72px] text-left active:opacity-60 transition-opacity"
        style={{ color: '#7A7A7A' }}
      >
        Cancel
      </button>

      {/* Center title */}
      <span className="text-[17px] font-semibold tracking-tight" style={{ color: '#1A1A1A' }}>
        {isEditMode ? 'Edit Post' : 'New Post'}
      </span>

      {/* Post button */}
      <div className="min-w-[72px] flex justify-end">
        <button
          onClick={onPost}
          disabled={!canPost || isSubmitting}
          className="text-[15px] font-semibold px-[18px] py-[7px] rounded-full transition-all duration-400 active:scale-[0.96]"
          style={{
            color: canPost ? '#FFFFFF' : '#AEAEB2',
            background: canPost ? '#f59e0b' : '#F5F5F7',
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
